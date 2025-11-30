#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const CWD = process.cwd();
const TARGET_DIRS = ['flux/apps', 'raw-manifests'];

// Standard Kubernetes labels
const RECOMMENDED_LABELS = [
  'app.kubernetes.io/name',
  'app.kubernetes.io/component',
  'app.kubernetes.io/part-of',
  'app.kubernetes.io/managed-by',
];

// Alternative common labels
const ALTERNATIVE_LABELS = [
  'app',
  'component',
  'part-of',
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
 * Check for metadata best practices in a file
 */
function checkMetadata(filePath, content) {
  const violations = [];
  const lines = content.split('\n');
  const relativePath = path.relative(CWD, filePath);

  // Split into YAML documents
  const documents = content.split(/^---$/m);

  for (const doc of documents) {
    // Skip empty documents
    if (!doc.trim()) continue;

    // Check if this is a Kubernetes resource
    const kindMatch = doc.match(/^kind:\s*["']?([^"'\n]+)["']?\s*$/m);
    const apiVersionMatch = doc.match(/^apiVersion:\s*/m);

    if (!kindMatch || !apiVersionMatch) continue;

    const kind = kindMatch[1].trim();

    // Skip non-workload resources for label checks
    const workloadKinds = ['Deployment', 'StatefulSet', 'DaemonSet', 'Job', 'CronJob', 'Pod', 'ReplicaSet'];
    const isWorkload = workloadKinds.includes(kind);

    // Skip ArgoCD resources (they have their own conventions)
    if (kind === 'Application' || kind === 'ApplicationSet' || kind === 'AppProject') continue;

    const docStartLine = content.indexOf(doc) === 0 ? 0 : content.substring(0, content.indexOf(doc)).split('\n').length;
    const docLines = doc.split('\n');

    // Get the name of the resource
    const nameMatch = doc.match(/^\s*name:\s*["']?([^"'\n]+)["']?\s*$/m);
    const resourceName = nameMatch ? nameMatch[1].trim() : 'unknown';

    // Check for labels in metadata
    let hasLabels = false;
    let hasAppLabel = false;
    let hasComponentLabel = false;
    let inMetadata = false;
    let inLabels = false;

    for (let i = 0; i < docLines.length; i++) {
      const line = docLines[i];

      if (/^metadata:/.test(line)) {
        inMetadata = true;
        continue;
      }

      if (inMetadata && /^\s*labels:/.test(line)) {
        hasLabels = true;
        inLabels = true;
        continue;
      }

      if (inLabels) {
        // Check for app label
        if (/^\s*(app\.kubernetes\.io\/name|app)\s*:/.test(line)) {
          hasAppLabel = true;
        }

        // Check for component label
        if (/^\s*(app\.kubernetes\.io\/component|component)\s*:/.test(line)) {
          hasComponentLabel = true;
        }

        // Exit labels section
        if (/^\s*[a-zA-Z]/.test(line) && !/^\s+/.test(line)) {
          inLabels = false;
        }
      }

      // Exit metadata section
      if (inMetadata && /^[a-zA-Z]/.test(line) && !/^\s/.test(line) && !/^metadata:/.test(line)) {
        inMetadata = false;
      }
    }

    // Only check workload resources for missing labels
    if (isWorkload) {
      if (!hasLabels) {
        violations.push({
          file: relativePath,
          line: docStartLine + 1,
          severity: 'LOW',
          message: `${kind} "${resourceName}" has no labels defined`,
        });
      } else {
        if (!hasAppLabel) {
          violations.push({
            file: relativePath,
            line: docStartLine + 1,
            severity: 'LOW',
            message: `${kind} "${resourceName}" missing app or app.kubernetes.io/name label`,
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
  console.log('ArgoCD Metadata Best Practices Check');
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
      const violations = checkMetadata(file, content);
      allViolations.push(...violations);
    } catch (error) {
      console.error(`Error reading ${file}: ${error.message}`);
    }
  }

  // Output results
  console.log('Metadata Best Practices Violations');
  console.log('-'.repeat(80));
  console.log('');

  if (allViolations.length === 0) {
    console.log('✅ No metadata issues found!');
    console.log('');
    console.log('='.repeat(80));
    console.log('Summary');
    console.log('');
    console.log('Metadata issues: 0 violation(s)');
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

  console.log(`❌ Found ${allViolations.length} metadata issue(s) (HIGH: ${highCount}, MEDIUM: ${mediumCount}, LOW: ${lowCount})`);
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
  console.log(`Metadata issues: ${allViolations.length} violation(s)`);
  console.log('');
  console.log('❌ Metadata issues found.');
  console.log('');
  console.log('Fix: Add standard Kubernetes labels:');
  console.log('     labels:');
  console.log('       app.kubernetes.io/name: my-app');
  console.log('       app.kubernetes.io/component: backend');
  console.log('       app.kubernetes.io/part-of: my-system');

  process.exit(1);
}

main();
