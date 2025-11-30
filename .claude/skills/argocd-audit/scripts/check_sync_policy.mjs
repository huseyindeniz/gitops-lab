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
 * Check for sync policy issues in a file
 */
function checkSyncPolicy(filePath, content) {
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

    // Check for syncPolicy
    let hasSyncPolicy = false;
    let hasAutomated = false;
    let hasPrune = false;
    let hasSelfHeal = false;
    let hasRetry = false;
    let syncPolicyLine = -1;

    for (let i = 0; i < docLines.length; i++) {
      const line = docLines[i];

      if (/^\s*syncPolicy:/.test(line)) {
        hasSyncPolicy = true;
        syncPolicyLine = i;
      }

      if (/^\s*automated:/.test(line)) {
        hasAutomated = true;
      }

      if (/prune:\s*true/.test(line)) {
        hasPrune = true;
      }

      if (/prune:\s*false/.test(line)) {
        violations.push({
          file: relativePath,
          line: docStartLine + i + 1,
          severity: 'MEDIUM',
          message: `${kind} "${appName}" has prune: false - orphaned resources may accumulate`,
        });
      }

      if (/selfHeal:\s*true/.test(line)) {
        hasSelfHeal = true;
      }

      if (/selfHeal:\s*false/.test(line)) {
        violations.push({
          file: relativePath,
          line: docStartLine + i + 1,
          severity: 'MEDIUM',
          message: `${kind} "${appName}" has selfHeal: false - manual drift correction required`,
        });
      }

      if (/^\s*retry:/.test(line)) {
        hasRetry = true;
      }
    }

    // Check for missing syncPolicy (only for Application, not ApplicationSet template)
    if (kind === 'Application' && !hasSyncPolicy) {
      violations.push({
        file: relativePath,
        line: docStartLine + 1,
        severity: 'HIGH',
        message: `${kind} "${appName}" has no syncPolicy defined`,
      });
    }

    // Check for syncPolicy without automated
    if (hasSyncPolicy && !hasAutomated) {
      violations.push({
        file: relativePath,
        line: docStartLine + syncPolicyLine + 1,
        severity: 'MEDIUM',
        message: `${kind} "${appName}" has syncPolicy but no automated section - manual sync required`,
      });
    }

    // Check for automated without retry
    if (hasAutomated && !hasRetry) {
      violations.push({
        file: relativePath,
        line: docStartLine + syncPolicyLine + 1,
        severity: 'LOW',
        message: `${kind} "${appName}" has automated sync but no retry configuration`,
      });
    }
  }

  return violations;
}

/**
 * Main function
 */
function main() {
  console.log('ArgoCD SyncPolicy Check');
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

      const violations = checkSyncPolicy(file, content);
      allViolations.push(...violations);
    } catch (error) {
      console.error(`Error reading ${file}: ${error.message}`);
    }
  }

  console.log(`Found ${applicationCount} Application/ApplicationSet resources`);
  console.log('');

  // Output results
  console.log('SyncPolicy Violations');
  console.log('-'.repeat(80));
  console.log('');

  if (allViolations.length === 0) {
    console.log('✅ No syncPolicy issues found!');
    console.log('');
    console.log('='.repeat(80));
    console.log('Summary');
    console.log('');
    console.log('SyncPolicy issues: 0 violation(s)');
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

  console.log(`❌ Found ${allViolations.length} syncPolicy issue(s) (HIGH: ${highCount}, MEDIUM: ${mediumCount}, LOW: ${lowCount})`);
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
  console.log(`SyncPolicy issues: ${allViolations.length} violation(s)`);
  console.log('');
  console.log('❌ SyncPolicy issues found.');
  console.log('');
  console.log('Fix: Add syncPolicy with automated: { prune: true, selfHeal: true }');
  console.log('     Add retry configuration for transient failure handling');

  process.exit(1);
}

main();
