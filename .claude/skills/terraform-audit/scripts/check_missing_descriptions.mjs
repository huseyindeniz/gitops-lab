#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, '../../../..');
const terraformDir = path.join(projectRoot, 'terraform');

function normalizePath(p) {
  return p.replace(/\\/g, '/');
}

function getTerraformFiles(dir, files = []) {
  if (!fs.existsSync(dir)) return files;

  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (!['node_modules', '.git', '.terraform'].includes(item)) {
        getTerraformFiles(fullPath, files);
      }
    } else if (stat.isFile() && item.endsWith('.tf')) {
      files.push(fullPath);
    }
  }
  return files;
}

function findMissingDescriptions(content, filePath) {
  const violations = [];
  const relPath = normalizePath(path.relative(projectRoot, filePath));

  // Check variables
  const variableRegex = /variable\s+"([^"]+)"\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/gs;
  let match;

  while ((match = variableRegex.exec(content)) !== null) {
    const varName = match[1];
    const varBody = match[2];
    const lineNum = content.substring(0, match.index).split('\n').length;

    if (!/description\s*=/.test(varBody)) {
      violations.push({
        file: relPath,
        line: lineNum,
        type: 'missing_variable_description',
        name: varName,
        message: `Variable "${varName}" has no description`,
      });
    }
  }

  // Check outputs
  const outputRegex = /output\s+"([^"]+)"\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/gs;

  while ((match = outputRegex.exec(content)) !== null) {
    const outName = match[1];
    const outBody = match[2];
    const lineNum = content.substring(0, match.index).split('\n').length;

    if (!/description\s*=/.test(outBody)) {
      violations.push({
        file: relPath,
        line: lineNum,
        type: 'missing_output_description',
        name: outName,
        message: `Output "${outName}" has no description`,
      });
    }
  }

  return violations;
}

function runCheck() {
  console.log('Terraform Missing Descriptions Check');
  console.log('='.repeat(80));
  console.log('');

  const files = getTerraformFiles(terraformDir);
  console.log(`Scanning ${files.length} Terraform files...`);
  console.log('');

  const violations = [];

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    violations.push(...findMissingDescriptions(content, file));
  }

  console.log('Missing Descriptions');
  console.log('-'.repeat(80));
  console.log('');

  if (violations.length === 0) {
    console.log('✅ All variables and outputs have descriptions!');
  } else {
    const vars = violations.filter(v => v.type.includes('variable')).length;
    const outs = violations.filter(v => v.type.includes('output')).length;

    console.log(`❌ Found ${violations.length} missing description(s) (variables: ${vars}, outputs: ${outs})`);
    console.log('');

    const byFile = {};
    for (const v of violations) {
      if (!byFile[v.file]) byFile[v.file] = [];
      byFile[v.file].push(v);
    }

    for (const file of Object.keys(byFile).sort()) {
      console.log(`  ❌ ${file}`);
      for (const v of byFile[file]) {
        console.log(`     Line ${v.line}: ${v.message}`);
      }
      console.log('');
    }
  }

  console.log('='.repeat(80));
  console.log('Summary');
  console.log('');
  console.log(`Missing descriptions: ${violations.length} violation(s)`);
  console.log('');

  if (violations.length === 0) {
    console.log('✅ All description checks passed!');
  } else {
    console.log('❌ Add descriptions for better documentation.');
  }

  console.log('');

  return violations.length > 0 ? 1 : 0;
}

const exitCode = runCheck();
process.exit(exitCode);
