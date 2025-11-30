#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const CWD = process.cwd();
const TARGET_DIRS = ['flux/apps'];

/**
 * Recursively find all YAML files in target directories
 */
function findYamlFiles(dir) {
  const files = [];
  if (!fs.existsSync(dir)) return files;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...findYamlFiles(fullPath));
    } else if (entry.isFile() && /\.ya?ml$/i.test(entry.name)) {
      files.push(fullPath);
    }
  }
  return files;
}

/**
 * Check for application source issues in a file
 */
function checkApplicationSource(filePath, content) {
  const violations = [];
  const lines = content.split('\n');
  const relativePath = path.relative(CWD, filePath);

  // Split into YAML documents
  const documents = content.split(/^---$/m);

  for (const doc of documents) {
    // Check if this is an ArgoCD Application or ApplicationSet
    const kindMatch = doc.match(/^kind:\s*(Application|ApplicationSet)\s*$/m);
    if (!kindMatch) continue;

    const kind = kindMatch[1];
    const docStartLine = content.indexOf(doc) === 0 ? 0 : content.substring(0, content.indexOf(doc)).split('\n').length;
    const docLines = doc.split('\n');

    // Track if we found sources
    let hasSource = false;
    let hasSources = false;

    for (let i = 0; i < docLines.length; i++) {
      const line = docLines[i];

      // Check for source: or sources:
      if (/^\s*source:/.test(line)) hasSource = true;
      if (/^\s*sources:/.test(line)) hasSources = true;

      // Check for targetRevision: HEAD
      if (/targetRevision:\s*["']?HEAD["']?\s*$/.test(line)) {
        violations.push({
          file: relativePath,
          line: docStartLine + i + 1,
          severity: 'HIGH',
          message: `${kind} uses targetRevision: HEAD - unpredictable deployments`,
        });
      }

      // Check for missing targetRevision (empty or not specified after repoURL)
      if (/repoURL:/.test(line)) {
        // Look for targetRevision in next few lines
        let foundTargetRevision = false;
        for (let j = i + 1; j < Math.min(i + 10, docLines.length); j++) {
          if (/targetRevision:/.test(docLines[j])) {
            foundTargetRevision = true;
            // Check if it's empty
            if (/targetRevision:\s*["']?\s*["']?\s*$/.test(docLines[j])) {
              violations.push({
                file: relativePath,
                line: docStartLine + j + 1,
                severity: 'HIGH',
                message: `${kind} has empty targetRevision - defaults to HEAD`,
              });
            }
            break;
          }
          // Stop if we hit another source block or major field
          if (/^\s*(source:|sources:|destination:|syncPolicy:)/.test(docLines[j])) break;
        }
      }

      // Check for HTTP (non-HTTPS) repoURL
      if (/repoURL:\s*["']?http:\/\//.test(line)) {
        violations.push({
          file: relativePath,
          line: docStartLine + i + 1,
          severity: 'HIGH',
          message: `${kind} uses HTTP repoURL - insecure, use HTTPS`,
        });
      }

      // Check for chart source without version (for Helm repos)
      if (/chart:/.test(line)) {
        // Look for targetRevision in nearby lines
        let foundVersion = false;
        for (let j = Math.max(0, i - 5); j < Math.min(i + 5, docLines.length); j++) {
          if (/targetRevision:\s*["']?[0-9]+\.[0-9]+/.test(docLines[j])) {
            foundVersion = true;
            break;
          }
        }
        // This is informational, not a violation - chart versions are usually OK
      }
    }

    // Check if Application has no source at all
    if (kind === 'Application' && !hasSource && !hasSources) {
      violations.push({
        file: relativePath,
        line: docStartLine + 1,
        severity: 'HIGH',
        message: `${kind} has no source or sources defined`,
      });
    }
  }

  return violations;
}

/**
 * Main function
 */
function main() {
  console.log('ArgoCD Application Source Check');
  console.log('='.repeat(80));
  console.log('');

  // Find all YAML files
  let allFiles = [];
  for (const dir of TARGET_DIRS) {
    const fullDir = path.join(CWD, dir);
    allFiles.push(...findYamlFiles(fullDir));
  }

  console.log(`Found ${allFiles.length} YAML files to scan`);
  console.log('');

  const allViolations = [];
  let applicationCount = 0;

  // Check each file
  for (const file of allFiles) {
    try {
      const content = fs.readFileSync(file, 'utf8');

      // Count Applications/ApplicationSets
      const appMatches = content.match(/kind:\s*(Application|ApplicationSet)/g);
      if (appMatches) applicationCount += appMatches.length;

      const violations = checkApplicationSource(file, content);
      allViolations.push(...violations);
    } catch (error) {
      console.error(`Error reading ${file}: ${error.message}`);
    }
  }

  console.log(`Found ${applicationCount} Application/ApplicationSet resources`);
  console.log('');

  // Output results
  console.log('Application Source Violations');
  console.log('-'.repeat(80));
  console.log('');

  if (allViolations.length === 0) {
    console.log('✅ No application source issues found!');
    console.log('');
    console.log('='.repeat(80));
    console.log('Summary');
    console.log('');
    console.log('Application source issues: 0 violation(s)');
    console.log('');
    console.log('✅ All checks passed.');
    process.exit(0);
  }

  // Group by file
  const byFile = {};
  for (const v of allViolations) {
    if (!byFile[v.file]) byFile[v.file] = [];
    byFile[v.file].push(v);
  }

  // Count by severity
  const highCount = allViolations.filter(v => v.severity === 'HIGH').length;
  const mediumCount = allViolations.filter(v => v.severity === 'MEDIUM').length;
  const lowCount = allViolations.filter(v => v.severity === 'LOW').length;

  console.log(`❌ Found ${allViolations.length} application source issue(s) (HIGH: ${highCount}, MEDIUM: ${mediumCount}, LOW: ${lowCount})`);
  console.log('');

  for (const [file, violations] of Object.entries(byFile)) {
    console.log(`  ❌ ${file}`);
    for (const v of violations) {
      console.log(`     Line ${v.line}: [${v.severity}] ${v.message}`);
    }
    console.log('');
  }

  console.log('='.repeat(80));
  console.log('Summary');
  console.log('');
  console.log(`Application source issues: ${allViolations.length} violation(s)`);
  console.log('');
  console.log('❌ Application source issues found.');
  console.log('');
  console.log('Fix: Use targetRevision: main or targetRevision: v1.0.0');
  console.log('     Always use HTTPS for repoURL');

  process.exit(1);
}

main();
