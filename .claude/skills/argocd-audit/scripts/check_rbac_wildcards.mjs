#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const CWD = process.cwd();
const TARGET_DIRS = ['flux/apps', 'raw-manifests'];

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
 * Check for RBAC wildcard permissions in a file
 */
function checkRbacWildcards(filePath, content) {
  const violations = [];
  const lines = content.split('\n');
  const relativePath = path.relative(CWD, filePath);

  // Split into YAML documents
  const documents = content.split(/^---$/m);

  for (const doc of documents) {
    // Check if this is a Role, ClusterRole, RoleBinding, or ClusterRoleBinding
    const kindMatch = doc.match(/^kind:\s*(ClusterRole|Role|ClusterRoleBinding|RoleBinding)\s*$/m);
    if (!kindMatch) continue;

    const kind = kindMatch[1];
    const docStartLine = content.indexOf(doc) === 0 ? 0 : content.substring(0, content.indexOf(doc)).split('\n').length;
    const docLines = doc.split('\n');

    // Check for wildcard verbs
    for (let i = 0; i < docLines.length; i++) {
      const line = docLines[i];

      // Check for verbs: ["*"] or verbs: - "*"
      if (/verbs:\s*\[.*["']\*["'].*\]/.test(line) || /verbs:\s*\[.*\*.*\]/.test(line)) {
        violations.push({
          file: relativePath,
          line: docStartLine + i + 1,
          severity: 'HIGH',
          message: `${kind} has wildcard verbs: ["*"] - grants all actions`,
        });
      }

      // Check for resources: ["*"]
      if (/resources:\s*\[.*["']\*["'].*\]/.test(line) || /resources:\s*\[.*\*.*\]/.test(line)) {
        violations.push({
          file: relativePath,
          line: docStartLine + i + 1,
          severity: 'HIGH',
          message: `${kind} has wildcard resources: ["*"] - access to all resource types`,
        });
      }

      // Check for apiGroups: ["*"]
      if (/apiGroups:\s*\[.*["']\*["'].*\]/.test(line)) {
        violations.push({
          file: relativePath,
          line: docStartLine + i + 1,
          severity: 'HIGH',
          message: `${kind} has wildcard apiGroups: ["*"] - access across all API groups`,
        });
      }

      // Check for - "*" in list format (multi-line)
      if (/^\s*-\s*["']\*["']\s*$/.test(line)) {
        // Look at previous lines to determine context
        for (let j = i - 1; j >= 0; j--) {
          const prevLine = docLines[j];
          if (/^\s*verbs:\s*$/.test(prevLine)) {
            violations.push({
              file: relativePath,
              line: docStartLine + i + 1,
              severity: 'HIGH',
              message: `${kind} has wildcard verb "*" - grants all actions`,
            });
            break;
          }
          if (/^\s*resources:\s*$/.test(prevLine)) {
            violations.push({
              file: relativePath,
              line: docStartLine + i + 1,
              severity: 'HIGH',
              message: `${kind} has wildcard resource "*" - access to all resource types`,
            });
            break;
          }
          if (/^\s*apiGroups:\s*$/.test(prevLine)) {
            violations.push({
              file: relativePath,
              line: docStartLine + i + 1,
              severity: 'HIGH',
              message: `${kind} has wildcard apiGroup "*" - access across all API groups`,
            });
            break;
          }
          // Stop if we hit another field
          if (/^\s*\w+:/.test(prevLine) && !/^\s*-/.test(prevLine)) break;
        }
      }

      // Check for cluster-admin binding
      if (/roleRef:/.test(line)) {
        // Look ahead for cluster-admin
        for (let j = i; j < Math.min(i + 5, docLines.length); j++) {
          if (/name:\s*["']?cluster-admin["']?\s*$/.test(docLines[j])) {
            violations.push({
              file: relativePath,
              line: docStartLine + j + 1,
              severity: 'HIGH',
              message: `${kind} binds to cluster-admin - full cluster access`,
            });
            break;
          }
        }
      }

      // Check for dangerous verbs
      if (/verbs:.*impersonate/.test(line)) {
        violations.push({
          file: relativePath,
          line: docStartLine + i + 1,
          severity: 'HIGH',
          message: `${kind} has impersonate verb - can act as other users`,
        });
      }

      if (/verbs:.*escalate/.test(line)) {
        violations.push({
          file: relativePath,
          line: docStartLine + i + 1,
          severity: 'HIGH',
          message: `${kind} has escalate verb - can grant additional privileges`,
        });
      }

      if (/verbs:.*bind/.test(line) && !/verbs:.*\bbind\b/.test(line)) {
        // Check it's the verb "bind" not part of another word
        if (/verbs:.*[\[,\s]bind[\],\s]/.test(line)) {
          violations.push({
            file: relativePath,
            line: docStartLine + i + 1,
            severity: 'MEDIUM',
            message: `${kind} has bind verb - can bind roles to subjects`,
          });
        }
      }
    }
  }

  return violations;
}

/**
 * Main function
 */
function main() {
  console.log('ArgoCD RBAC Wildcards Check');
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

  // Check each file
  for (const file of allFiles) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const violations = checkRbacWildcards(file, content);
      allViolations.push(...violations);
    } catch (error) {
      console.error(`Error reading ${file}: ${error.message}`);
    }
  }

  // Output results
  console.log('RBAC Wildcards Violations');
  console.log('-'.repeat(80));
  console.log('');

  if (allViolations.length === 0) {
    console.log('✅ No RBAC wildcard issues found!');
    console.log('');
    console.log('='.repeat(80));
    console.log('Summary');
    console.log('');
    console.log('RBAC wildcard issues: 0 violation(s)');
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

  console.log(`❌ Found ${allViolations.length} RBAC wildcard issue(s) (HIGH: ${highCount}, MEDIUM: ${mediumCount}, LOW: ${lowCount})`);
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
  console.log(`RBAC wildcard issues: ${allViolations.length} violation(s)`);
  console.log('');
  console.log('❌ RBAC wildcard issues found.');
  console.log('');
  console.log('Fix: Use explicit verbs like [get, list, watch]');
  console.log('     Use explicit resources like [pods, services]');
  console.log('     Avoid cluster-admin bindings');

  process.exit(1);
}

main();
