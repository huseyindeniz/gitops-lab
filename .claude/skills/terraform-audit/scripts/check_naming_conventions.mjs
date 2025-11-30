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

function isCamelCase(name) {
  return /[a-z][A-Z]/.test(name) && !/^[A-Z]+$/.test(name);
}

function isKebabCase(name) {
  return /-/.test(name);
}

function findNamingIssues(content, filePath) {
  const violations = [];
  const relPath = normalizePath(path.relative(projectRoot, filePath));

  // Check resources
  const resourceRegex = /resource\s+"([^"]+)"\s+"([^"]+)"/g;
  let match;

  while ((match = resourceRegex.exec(content)) !== null) {
    const resourceName = match[2];
    const lineNum = content.substring(0, match.index).split('\n').length;

    if (isCamelCase(resourceName)) {
      violations.push({
        file: relPath,
        line: lineNum,
        name: resourceName,
        type: 'camel_case',
        message: `Resource "${resourceName}" uses camelCase - use snake_case`,
      });
    }

    if (isKebabCase(resourceName)) {
      violations.push({
        file: relPath,
        line: lineNum,
        name: resourceName,
        type: 'kebab_case',
        message: `Resource "${resourceName}" uses kebab-case - use snake_case`,
      });
    }
  }

  // Check variables
  const variableRegex = /variable\s+"([^"]+)"/g;
  while ((match = variableRegex.exec(content)) !== null) {
    const varName = match[1];
    const lineNum = content.substring(0, match.index).split('\n').length;

    if (isCamelCase(varName)) {
      violations.push({
        file: relPath,
        line: lineNum,
        name: varName,
        type: 'camel_case',
        message: `Variable "${varName}" uses camelCase - use snake_case`,
      });
    }
  }

  // Check modules
  const moduleRegex = /module\s+"([^"]+)"/g;
  while ((match = moduleRegex.exec(content)) !== null) {
    const modName = match[1];
    const lineNum = content.substring(0, match.index).split('\n').length;

    if (isCamelCase(modName)) {
      violations.push({
        file: relPath,
        line: lineNum,
        name: modName,
        type: 'camel_case',
        message: `Module "${modName}" uses camelCase - use snake_case`,
      });
    }
  }

  return violations;
}

function runCheck() {
  console.log('Terraform Naming Conventions Check');
  console.log('='.repeat(80));
  console.log('');

  const files = getTerraformFiles(terraformDir);
  console.log(`Scanning ${files.length} Terraform files...`);
  console.log('');

  const violations = [];

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    violations.push(...findNamingIssues(content, file));
  }

  console.log('Naming Convention Violations');
  console.log('-'.repeat(80));
  console.log('');

  if (violations.length === 0) {
    console.log('✅ All names follow snake_case convention!');
  } else {
    const camel = violations.filter(v => v.type === 'camel_case').length;
    const kebab = violations.filter(v => v.type === 'kebab_case').length;

    console.log(`❌ Found ${violations.length} naming issue(s) (camelCase: ${camel}, kebab-case: ${kebab})`);
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
  console.log(`Naming issues: ${violations.length} violation(s)`);
  console.log('');

  if (violations.length === 0) {
    console.log('✅ All naming convention checks passed!');
  } else {
    console.log('❌ Use snake_case for all Terraform identifiers.');
  }

  console.log('');

  return violations.length > 0 ? 1 : 0;
}

const exitCode = runCheck();
process.exit(exitCode);
