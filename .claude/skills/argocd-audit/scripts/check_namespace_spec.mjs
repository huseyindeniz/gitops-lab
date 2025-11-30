#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const CWD = process.cwd();
const TARGET_DIRS = ['flux/apps', 'raw-manifests'];

// Resources that are cluster-scoped (don't need namespace)
const CLUSTER_SCOPED_KINDS = [
  'Namespace',
  'ClusterRole',
  'ClusterRoleBinding',
  'ClusterIssuer',
  'CustomResourceDefinition',
  'PersistentVolume',
  'StorageClass',
  'IngressClass',
  'PriorityClass',
  'RuntimeClass',
  'VolumeAttachment',
  'CSIDriver',
  'CSINode',
  'Node',
  'APIService',
  'TokenReview',
  'SelfSubjectAccessReview',
  'SelfSubjectRulesReview',
  'SubjectAccessReview',
  'CertificateSigningRequest',
  'FlowSchema',
  'PriorityLevelConfiguration',
  'MutatingWebhookConfiguration',
  'ValidatingWebhookConfiguration',
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
 * Check for namespace specification issues in a file
 */
function checkNamespaceSpec(filePath, content) {
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

    // Skip cluster-scoped resources
    if (CLUSTER_SCOPED_KINDS.includes(kind)) continue;

    // Skip ArgoCD Application and ApplicationSet (they manage their own namespaces)
    if (kind === 'Application' || kind === 'ApplicationSet') continue;

    const docStartLine = content.indexOf(doc) === 0 ? 0 : content.substring(0, content.indexOf(doc)).split('\n').length;
    const docLines = doc.split('\n');

    // Get the name of the resource
    const nameMatch = doc.match(/^\s*name:\s*["']?([^"'\n]+)["']?\s*$/m);
    const resourceName = nameMatch ? nameMatch[1].trim() : 'unknown';

    // Check for namespace in metadata
    let hasNamespace = false;
    let inMetadata = false;

    for (let i = 0; i < docLines.length; i++) {
      const line = docLines[i];

      if (/^metadata:/.test(line)) {
        inMetadata = true;
        continue;
      }

      if (inMetadata && /^\s*namespace:\s*["']?[^"'\n]+["']?\s*$/.test(line)) {
        hasNamespace = true;
        break;
      }

      // Exit metadata section
      if (inMetadata && /^[a-zA-Z]/.test(line) && !/^\s/.test(line)) {
        inMetadata = false;
      }
    }

    if (!hasNamespace) {
      violations.push({
        file: relativePath,
        line: docStartLine + 1,
        severity: 'LOW',
        message: `${kind} "${resourceName}" has no namespace specified - relies on kubectl context`,
      });
    }
  }

  return violations;
}

/**
 * Main function
 */
function main() {
  console.log('ArgoCD Namespace Specification Check');
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
      const violations = checkNamespaceSpec(file, content);
      allViolations.push(...violations);
    } catch (error) {
      console.error(`Error reading ${file}: ${error.message}`);
    }
  }

  // Output results
  console.log('Namespace Specification Violations');
  console.log('-'.repeat(80));
  console.log('');

  if (allViolations.length === 0) {
    console.log('✅ No namespace specification issues found!');
    console.log('');
    console.log('='.repeat(80));
    console.log('Summary');
    console.log('');
    console.log('Namespace specification issues: 0 violation(s)');
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

  console.log(`❌ Found ${allViolations.length} namespace specification issue(s) (HIGH: ${highCount}, MEDIUM: ${mediumCount}, LOW: ${lowCount})`);
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
  console.log(`Namespace specification issues: ${allViolations.length} violation(s)`);
  console.log('');
  console.log('❌ Namespace specification issues found.');
  console.log('');
  console.log('Fix: Add explicit namespace field to metadata:');
  console.log('     metadata:');
  console.log('       name: my-resource');
  console.log('       namespace: my-namespace');

  process.exit(1);
}

main();
