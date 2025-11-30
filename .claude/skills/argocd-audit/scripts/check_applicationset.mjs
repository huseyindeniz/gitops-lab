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
 * Check for ApplicationSet best practices in a file
 */
function checkApplicationSet(filePath, content) {
  const violations = [];
  const lines = content.split('\n');
  const relativePath = path.relative(CWD, filePath);

  // Split into YAML documents
  const documents = content.split(/^---$/m);

  for (const doc of documents) {
    // Check if this is an ApplicationSet
    const kindMatch = doc.match(/^kind:\s*ApplicationSet\s*$/m);
    if (!kindMatch) continue;

    const docStartLine = content.indexOf(doc) === 0 ? 0 : content.substring(0, content.indexOf(doc)).split('\n').length;
    const docLines = doc.split('\n');

    // Get the name of the ApplicationSet
    const nameMatch = doc.match(/^\s*name:\s*["']?([^"'\n]+)["']?\s*$/m);
    const appSetName = nameMatch ? nameMatch[1].trim() : 'unknown';

    // Track configurations
    let hasGoTemplate = false;
    let hasGoTemplateOptions = false;
    let hasMissingKeyError = false;
    let hasGenerators = false;
    let hasTemplate = false;

    for (let i = 0; i < docLines.length; i++) {
      const line = docLines[i];

      // Check for goTemplate: true
      if (/goTemplate:\s*true/.test(line)) {
        hasGoTemplate = true;
      }

      // Check for goTemplateOptions
      if (/goTemplateOptions:/.test(line)) {
        hasGoTemplateOptions = true;
      }

      // Check for missingkey=error
      if (/missingkey\s*=\s*error/.test(line) || /["']missingkey=error["']/.test(line)) {
        hasMissingKeyError = true;
      }

      // Check for generators
      if (/^\s*generators:\s*$/.test(line)) {
        hasGenerators = true;
      }

      // Check for template
      if (/^\s*template:\s*$/.test(line)) {
        hasTemplate = true;
      }
    }

    // Check for missing goTemplate
    if (!hasGoTemplate) {
      violations.push({
        file: relativePath,
        line: docStartLine + 1,
        severity: 'MEDIUM',
        message: `ApplicationSet "${appSetName}" missing goTemplate: true - using legacy template engine`,
      });
    }

    // Check for goTemplate without goTemplateOptions
    if (hasGoTemplate && !hasGoTemplateOptions) {
      violations.push({
        file: relativePath,
        line: docStartLine + 1,
        severity: 'MEDIUM',
        message: `ApplicationSet "${appSetName}" has goTemplate but no goTemplateOptions`,
      });
    }

    // Check for goTemplateOptions without missingkey=error
    if (hasGoTemplateOptions && !hasMissingKeyError) {
      violations.push({
        file: relativePath,
        line: docStartLine + 1,
        severity: 'MEDIUM',
        message: `ApplicationSet "${appSetName}" goTemplateOptions missing missingkey=error - silent template failures possible`,
      });
    }

    // Check for missing generators
    if (!hasGenerators) {
      violations.push({
        file: relativePath,
        line: docStartLine + 1,
        severity: 'HIGH',
        message: `ApplicationSet "${appSetName}" has no generators defined`,
      });
    }

    // Check for missing template
    if (!hasTemplate) {
      violations.push({
        file: relativePath,
        line: docStartLine + 1,
        severity: 'HIGH',
        message: `ApplicationSet "${appSetName}" has no template defined`,
      });
    }
  }

  return violations;
}

/**
 * Main function
 */
function main() {
  console.log('ArgoCD ApplicationSet Check');
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
  let appSetCount = 0;

  // Check each file
  for (const file of allFiles) {
    try {
      const content = fs.readFileSync(file, 'utf8');

      // Count ApplicationSets
      const appSetMatches = content.match(/kind:\s*ApplicationSet/g);
      if (appSetMatches) appSetCount += appSetMatches.length;

      const violations = checkApplicationSet(file, content);
      allViolations.push(...violations);
    } catch (error) {
      console.error(`Error reading ${file}: ${error.message}`);
    }
  }

  console.log(`Found ${appSetCount} ApplicationSet resources`);
  console.log('');

  // Output results
  console.log('ApplicationSet Violations');
  console.log('-'.repeat(80));
  console.log('');

  if (allViolations.length === 0) {
    console.log('✅ No ApplicationSet issues found!');
    console.log('');
    console.log('='.repeat(80));
    console.log('Summary');
    console.log('');
    console.log('ApplicationSet issues: 0 violation(s)');
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

  console.log(`❌ Found ${allViolations.length} ApplicationSet issue(s) (HIGH: ${highCount}, MEDIUM: ${mediumCount}, LOW: ${lowCount})`);
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
  console.log(`ApplicationSet issues: ${allViolations.length} violation(s)`);
  console.log('');
  console.log('❌ ApplicationSet issues found.');
  console.log('');
  console.log('Fix: Enable goTemplate: true with goTemplateOptions: ["missingkey=error"]');
  console.log('     Ensure generators and template are properly defined');

  process.exit(1);
}

main();
