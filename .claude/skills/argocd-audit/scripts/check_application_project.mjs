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
 * Check for application project issues in a file
 */
function checkApplicationProject(filePath, content) {
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

    // Get the name of the application
    const nameMatch = doc.match(/^\s*name:\s*["']?([^"'\n]+)["']?\s*$/m);
    const appName = nameMatch ? nameMatch[1].trim() : 'unknown';

    // Check for project field
    let hasProject = false;
    let projectLine = -1;
    let projectValue = null;

    for (let i = 0; i < docLines.length; i++) {
      const line = docLines[i];

      // Check for project field
      if (/^\s*project:\s*/.test(line)) {
        hasProject = true;
        projectLine = i;

        const projectMatch = line.match(/project:\s*["']?([^"'\n]+)["']?\s*$/);
        projectValue = projectMatch ? projectMatch[1].trim() : null;

        // Check if using default project
        if (projectValue === 'default') {
          violations.push({
            file: relativePath,
            line: docStartLine + i + 1,
            severity: 'MEDIUM',
            message: `${kind} "${appName}" uses project: default - no source/destination restrictions`,
          });
        }

        // Check if project is empty
        if (!projectValue || projectValue === '""' || projectValue === "''") {
          violations.push({
            file: relativePath,
            line: docStartLine + i + 1,
            severity: 'HIGH',
            message: `${kind} "${appName}" has empty project field`,
          });
        }
      }
    }

    // Check if Application has no project at all (only for Application kind)
    if (kind === 'Application' && !hasProject) {
      violations.push({
        file: relativePath,
        line: docStartLine + 1,
        severity: 'MEDIUM',
        message: `${kind} "${appName}" has no project defined - defaults to default project`,
      });
    }
  }

  return violations;
}

/**
 * Main function
 */
function main() {
  console.log('ArgoCD Application Project Check');
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

      const violations = checkApplicationProject(file, content);
      allViolations.push(...violations);
    } catch (error) {
      console.error(`Error reading ${file}: ${error.message}`);
    }
  }

  console.log(`Found ${applicationCount} Application/ApplicationSet resources`);
  console.log('');

  // Output results
  console.log('Application Project Violations');
  console.log('-'.repeat(80));
  console.log('');

  if (allViolations.length === 0) {
    console.log('✅ No application project issues found!');
    console.log('');
    console.log('='.repeat(80));
    console.log('Summary');
    console.log('');
    console.log('Application project issues: 0 violation(s)');
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

  console.log(`❌ Found ${allViolations.length} application project issue(s) (HIGH: ${highCount}, MEDIUM: ${mediumCount}, LOW: ${lowCount})`);
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
  console.log(`Application project issues: ${allViolations.length} violation(s)`);
  console.log('');
  console.log('❌ Application project issues found.');
  console.log('');
  console.log('Fix: Create dedicated AppProject with proper sourceRepos and destinations restrictions');
  console.log('     Avoid using the default project for production applications');

  process.exit(1);
}

main();
