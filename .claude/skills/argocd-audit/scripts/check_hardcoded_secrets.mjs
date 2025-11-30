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
 * Check for hardcoded secrets in a file
 */
function checkHardcodedSecrets(filePath, content) {
  const violations = [];
  const lines = content.split('\n');
  const relativePath = path.relative(CWD, filePath);

  // Split into YAML documents
  const documents = content.split(/^---$/m);

  for (const doc of documents) {
    const docLines = doc.split('\n');
    let docStartLine = content.indexOf(doc) === 0 ? 0 : content.substring(0, content.indexOf(doc)).split('\n').length;

    // Check for Secret kind with data or stringData
    const kindMatch = doc.match(/^kind:\s*Secret\s*$/m);
    if (kindMatch) {
      // Check for data: field
      const dataMatch = doc.match(/^data:\s*$/m);
      if (dataMatch) {
        const dataLineIndex = docLines.findIndex(l => /^data:\s*$/.test(l));
        if (dataLineIndex !== -1) {
          violations.push({
            file: relativePath,
            line: docStartLine + dataLineIndex + 1,
            severity: 'HIGH',
            message: 'Secret with data: field - base64 encoded secrets in Git (NOT encryption!)',
          });
        }
      }

      // Check for stringData: field
      const stringDataMatch = doc.match(/^stringData:\s*$/m);
      if (stringDataMatch) {
        const stringDataLineIndex = docLines.findIndex(l => /^stringData:\s*$/.test(l));
        if (stringDataLineIndex !== -1) {
          violations.push({
            file: relativePath,
            line: docStartLine + stringDataLineIndex + 1,
            severity: 'HIGH',
            message: 'Secret with stringData: field - plaintext secrets in Git',
          });
        }
      }
    }
  }

  // Check for hardcoded sensitive patterns in all files
  const sensitivePatterns = [
    { pattern: /password\s*[:=]\s*["'](?!{{\s*\.)[^"']+["']/gi, message: 'Hardcoded password value', severity: 'HIGH' },
    { pattern: /api[_-]?key\s*[:=]\s*["'](?!{{\s*\.)[^"']+["']/gi, message: 'Hardcoded API key', severity: 'HIGH' },
    { pattern: /secret[_-]?key\s*[:=]\s*["'](?!{{\s*\.)[^"']+["']/gi, message: 'Hardcoded secret key', severity: 'HIGH' },
    { pattern: /access[_-]?key\s*[:=]\s*["']AKIA[A-Z0-9]{16}["']/gi, message: 'Hardcoded AWS Access Key', severity: 'HIGH' },
    { pattern: /token\s*[:=]\s*["']ghp_[a-zA-Z0-9]+["']/gi, message: 'Hardcoded GitHub token (ghp_)', severity: 'HIGH' },
    { pattern: /token\s*[:=]\s*["']gho_[a-zA-Z0-9]+["']/gi, message: 'Hardcoded GitHub OAuth token (gho_)', severity: 'HIGH' },
    { pattern: /token\s*[:=]\s*["']xox[baprs]-[a-zA-Z0-9-]+["']/gi, message: 'Hardcoded Slack token', severity: 'HIGH' },
    { pattern: /private[_-]?key\s*[:=]\s*["']-----BEGIN/gi, message: 'Hardcoded private key', severity: 'HIGH' },
    { pattern: /-----BEGIN RSA PRIVATE KEY-----/g, message: 'RSA private key in manifest', severity: 'HIGH' },
    { pattern: /-----BEGIN OPENSSH PRIVATE KEY-----/g, message: 'OpenSSH private key in manifest', severity: 'HIGH' },
    { pattern: /-----BEGIN EC PRIVATE KEY-----/g, message: 'EC private key in manifest', severity: 'HIGH' },
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip comments
    if (line.trim().startsWith('#')) continue;

    // Skip Flux image policy markers (they're not secrets)
    if (line.includes('$imagepolicy')) continue;

    for (const { pattern, message, severity } of sensitivePatterns) {
      pattern.lastIndex = 0; // Reset regex
      if (pattern.test(line)) {
        violations.push({
          file: relativePath,
          line: i + 1,
          severity,
          message,
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
  console.log('ArgoCD Hardcoded Secrets Check');
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
      const violations = checkHardcodedSecrets(file, content);
      allViolations.push(...violations);
    } catch (error) {
      console.error(`Error reading ${file}: ${error.message}`);
    }
  }

  // Output results
  console.log('Hardcoded Secrets Violations');
  console.log('-'.repeat(80));
  console.log('');

  if (allViolations.length === 0) {
    console.log('✅ No hardcoded secrets found!');
    console.log('');
    console.log('='.repeat(80));
    console.log('Summary');
    console.log('');
    console.log('Hardcoded secrets issues: 0 violation(s)');
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

  console.log(`❌ Found ${allViolations.length} hardcoded secret issue(s) (HIGH: ${highCount}, MEDIUM: ${mediumCount}, LOW: ${lowCount})`);
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
  console.log(`Hardcoded secrets issues: ${allViolations.length} violation(s)`);
  console.log('');
  console.log('❌ Hardcoded secrets found.');
  console.log('');
  console.log('Fix: Use External Secrets, Sealed Secrets, or HashiCorp Vault');
  console.log('     Never commit secrets to Git - base64 is encoding, not encryption!');

  process.exit(1);
}

main();
