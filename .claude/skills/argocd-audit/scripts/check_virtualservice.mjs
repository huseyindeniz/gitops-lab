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
 * Check for VirtualService security issues in a file
 */
function checkVirtualService(filePath, content) {
  const violations = [];
  const lines = content.split('\n');
  const relativePath = path.relative(CWD, filePath);

  // Split into YAML documents
  const documents = content.split(/^---$/m);

  for (const doc of documents) {
    // Check if this is an Istio VirtualService
    const kindMatch = doc.match(/^kind:\s*VirtualService\s*$/m);
    const apiVersionMatch = doc.match(/^apiVersion:\s*networking\.istio\.io/m);

    if (!kindMatch || !apiVersionMatch) continue;

    const docStartLine = content.indexOf(doc) === 0 ? 0 : content.substring(0, content.indexOf(doc)).split('\n').length;
    const docLines = doc.split('\n');

    // Get the name of the VirtualService
    const nameMatch = doc.match(/^\s*name:\s*["']?([^"'\n]+)["']?\s*$/m);
    const vsName = nameMatch ? nameMatch[1].trim() : 'unknown';

    // Track configurations
    let hasGateways = false;
    let hasHosts = false;
    let hasHttp = false;
    let hasRoute = false;
    let hasDestination = false;
    let hasTimeout = false;

    for (let i = 0; i < docLines.length; i++) {
      const line = docLines[i];

      // Check for gateways
      if (/^\s*gateways:\s*$/.test(line) || /^\s*gateways:\s*\[/.test(line)) {
        hasGateways = true;
      }

      // Check for hosts
      if (/^\s*hosts:\s*$/.test(line) || /^\s*hosts:\s*\[/.test(line)) {
        hasHosts = true;
      }

      // Check for wildcard hosts
      if (/^\s*-\s*["']\*["']\s*$/.test(line)) {
        // Check if we're in hosts section
        for (let j = i - 1; j >= 0; j--) {
          if (/^\s*hosts:\s*$/.test(docLines[j])) {
            violations.push({
              file: relativePath,
              line: docStartLine + i + 1,
              severity: 'MEDIUM',
              message: `VirtualService "${vsName}" has wildcard host "*" - overly broad matching`,
            });
            break;
          }
          if (/^\s*\w+:\s*$/.test(docLines[j]) && !/^\s*-/.test(docLines[j])) break;
        }
      }

      // Check for http section
      if (/^\s*http:\s*$/.test(line)) {
        hasHttp = true;
      }

      // Check for route
      if (/^\s*route:\s*$/.test(line) || /^\s*-\s*route:\s*$/.test(line)) {
        hasRoute = true;
      }

      // Check for destination (can be "destination:" or "- destination:")
      if (/^\s*-?\s*destination:\s*/.test(line)) {
        hasDestination = true;
      }

      // Check for timeout
      if (/^\s*timeout:\s*/.test(line)) {
        hasTimeout = true;
      }
    }

    // Check for missing gateways
    if (!hasGateways) {
      violations.push({
        file: relativePath,
        line: docStartLine + 1,
        severity: 'MEDIUM',
        message: `VirtualService "${vsName}" has no gateways defined - may be orphaned`,
      });
    }

    // Check for missing hosts
    if (!hasHosts) {
      violations.push({
        file: relativePath,
        line: docStartLine + 1,
        severity: 'HIGH',
        message: `VirtualService "${vsName}" has no hosts defined`,
      });
    }

    // Check for http without routes
    if (hasHttp && !hasRoute) {
      violations.push({
        file: relativePath,
        line: docStartLine + 1,
        severity: 'HIGH',
        message: `VirtualService "${vsName}" has http section but no routes defined`,
      });
    }

    // Check for route without destination
    if (hasRoute && !hasDestination) {
      violations.push({
        file: relativePath,
        line: docStartLine + 1,
        severity: 'HIGH',
        message: `VirtualService "${vsName}" has route but no destination defined`,
      });
    }

    // Check for missing timeout (informational)
    if (hasHttp && !hasTimeout) {
      violations.push({
        file: relativePath,
        line: docStartLine + 1,
        severity: 'LOW',
        message: `VirtualService "${vsName}" has no timeout configured - using default`,
      });
    }
  }

  return violations;
}

/**
 * Main function
 */
function main() {
  console.log('ArgoCD VirtualService Check');
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
  let vsCount = 0;

  // Check each file
  for (const file of allFiles) {
    try {
      const content = fs.readFileSync(file, 'utf8');

      // Count VirtualServices
      const vsMatches = content.match(/kind:\s*VirtualService/g);
      const istioMatches = content.match(/apiVersion:\s*networking\.istio\.io/g);
      if (vsMatches && istioMatches) {
        vsCount += Math.min(vsMatches.length, istioMatches.length);
      }

      const violations = checkVirtualService(file, content);
      allViolations.push(...violations);
    } catch (error) {
      console.error(`Error reading ${file}: ${error.message}`);
    }
  }

  console.log(`Found ${vsCount} VirtualService resources`);
  console.log('');

  // Output results
  console.log('VirtualService Violations');
  console.log('-'.repeat(80));
  console.log('');

  if (allViolations.length === 0) {
    console.log('✅ No VirtualService issues found!');
    console.log('');
    console.log('='.repeat(80));
    console.log('Summary');
    console.log('');
    console.log('VirtualService issues: 0 violation(s)');
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

  console.log(`❌ Found ${allViolations.length} VirtualService issue(s) (HIGH: ${highCount}, MEDIUM: ${mediumCount}, LOW: ${lowCount})`);
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
  console.log(`VirtualService issues: ${allViolations.length} violation(s)`);
  console.log('');
  console.log('❌ VirtualService issues found.');
  console.log('');
  console.log('Fix: Associate VirtualService with valid Gateway');
  console.log('     Use specific hosts instead of wildcards');
  console.log('     Ensure routes have proper destinations');

  process.exit(1);
}

main();
