#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const CWD = process.cwd();
const TARGET_DIRS = ['flux/apps', 'raw-manifests'];

// Deprecated API versions and their replacements
const DEPRECATED_APIS = [
  {
    pattern: /apiVersion:\s*extensions\/v1beta1/,
    message: 'extensions/v1beta1 is deprecated (removed in K8s 1.22)',
    replacement: 'apps/v1 or networking.k8s.io/v1',
    severity: 'HIGH',
  },
  {
    pattern: /apiVersion:\s*apps\/v1beta1/,
    message: 'apps/v1beta1 is deprecated (removed in K8s 1.16)',
    replacement: 'apps/v1',
    severity: 'HIGH',
  },
  {
    pattern: /apiVersion:\s*apps\/v1beta2/,
    message: 'apps/v1beta2 is deprecated (removed in K8s 1.16)',
    replacement: 'apps/v1',
    severity: 'HIGH',
  },
  {
    pattern: /apiVersion:\s*networking\.k8s\.io\/v1beta1/,
    message: 'networking.k8s.io/v1beta1 Ingress is deprecated (removed in K8s 1.22)',
    replacement: 'networking.k8s.io/v1',
    severity: 'HIGH',
  },
  {
    pattern: /apiVersion:\s*batch\/v1beta1/,
    message: 'batch/v1beta1 CronJob is deprecated (removed in K8s 1.25)',
    replacement: 'batch/v1',
    severity: 'HIGH',
  },
  {
    pattern: /apiVersion:\s*policy\/v1beta1/,
    message: 'policy/v1beta1 PodSecurityPolicy is deprecated (removed in K8s 1.25)',
    replacement: 'Pod Security Admission',
    severity: 'HIGH',
  },
  {
    pattern: /apiVersion:\s*rbac\.authorization\.k8s\.io\/v1beta1/,
    message: 'rbac.authorization.k8s.io/v1beta1 is deprecated (removed in K8s 1.22)',
    replacement: 'rbac.authorization.k8s.io/v1',
    severity: 'HIGH',
  },
  {
    pattern: /apiVersion:\s*admissionregistration\.k8s\.io\/v1beta1/,
    message: 'admissionregistration.k8s.io/v1beta1 is deprecated (removed in K8s 1.22)',
    replacement: 'admissionregistration.k8s.io/v1',
    severity: 'MEDIUM',
  },
  {
    pattern: /apiVersion:\s*apiextensions\.k8s\.io\/v1beta1/,
    message: 'apiextensions.k8s.io/v1beta1 is deprecated (removed in K8s 1.22)',
    replacement: 'apiextensions.k8s.io/v1',
    severity: 'MEDIUM',
  },
  {
    pattern: /apiVersion:\s*storage\.k8s\.io\/v1beta1/,
    message: 'storage.k8s.io/v1beta1 is deprecated (removed in K8s 1.22)',
    replacement: 'storage.k8s.io/v1',
    severity: 'MEDIUM',
  },
];

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
 * Check for deprecated APIs in a file
 */
function checkDeprecatedApis(filePath, content) {
  const violations = [];
  const lines = content.split('\n');
  const relativePath = path.relative(CWD, filePath);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    for (const api of DEPRECATED_APIS) {
      if (api.pattern.test(line)) {
        violations.push({
          file: relativePath,
          line: i + 1,
          severity: api.severity,
          message: `${api.message} - use ${api.replacement}`,
        });
      }
    }
  }

  return violations;
}

/**
 * Main function
 */
function main() {
  console.log('ArgoCD Deprecated APIs Check');
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
      const violations = checkDeprecatedApis(file, content);
      allViolations.push(...violations);
    } catch (error) {
      console.error(`Error reading ${file}: ${error.message}`);
    }
  }

  // Output results
  console.log('Deprecated APIs Violations');
  console.log('-'.repeat(80));
  console.log('');

  if (allViolations.length === 0) {
    console.log('✅ No deprecated API issues found!');
    console.log('');
    console.log('='.repeat(80));
    console.log('Summary');
    console.log('');
    console.log('Deprecated API issues: 0 violation(s)');
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

  console.log(`❌ Found ${allViolations.length} deprecated API issue(s) (HIGH: ${highCount}, MEDIUM: ${mediumCount}, LOW: ${lowCount})`);
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
  console.log(`Deprecated API issues: ${allViolations.length} violation(s)`);
  console.log('');
  console.log('❌ Deprecated API issues found.');
  console.log('');
  console.log('Fix: Update apiVersion fields to use stable APIs:');
  console.log('     - extensions/v1beta1 -> apps/v1');
  console.log('     - networking.k8s.io/v1beta1 -> networking.k8s.io/v1');
  console.log('     - batch/v1beta1 -> batch/v1');

  process.exit(1);
}

main();
