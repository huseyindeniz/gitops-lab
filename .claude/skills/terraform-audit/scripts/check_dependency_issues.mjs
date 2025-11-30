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

function findDependencyIssues(content, filePath) {
  const violations = [];
  const relPath = normalizePath(path.relative(projectRoot, filePath));

  // Count depends_on usage
  const dependsOnMatches = content.match(/depends_on\s*=/g) || [];
  if (dependsOnMatches.length > 5) {
    violations.push({
      file: relPath,
      line: 1,
      type: 'excessive_depends_on',
      message: `File has ${dependsOnMatches.length} depends_on blocks - consider implicit dependencies`,
    });
  }

  // Check depends_on with data sources
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (/depends_on\s*=\s*\[.*data\./.test(line)) {
      violations.push({
        file: relPath,
        line: i + 1,
        type: 'depends_on_data_source',
        message: 'depends_on with data source - usually unnecessary',
      });
    }

    if (/depends_on\s*=\s*\[.*random_/.test(line)) {
      violations.push({
        file: relPath,
        line: i + 1,
        type: 'depends_on_random',
        message: 'depends_on with random resource - use value reference instead',
      });
    }
  }

  // Check null_resource with provisioner but no depends_on
  const nullResourceRegex = /resource\s+"null_resource"\s+"([^"]+)"\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/gs;
  let match;

  while ((match = nullResourceRegex.exec(content)) !== null) {
    const name = match[1];
    const body = match[2];
    const lineNum = content.substring(0, match.index).split('\n').length;

    if (/provisioner\s+"/.test(body) && !/depends_on/.test(body) && !/triggers/.test(body)) {
      violations.push({
        file: relPath,
        line: lineNum,
        type: 'null_resource_no_dependency',
        message: `null_resource "${name}" with provisioner needs depends_on or triggers`,
      });
    }
  }

  return violations;
}

function runCheck() {
  console.log('Terraform Dependency Issues Check');
  console.log('='.repeat(80));
  console.log('');

  const files = getTerraformFiles(terraformDir);
  console.log(`Scanning ${files.length} Terraform files...`);
  console.log('');

  const violations = [];

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    violations.push(...findDependencyIssues(content, file));
  }

  console.log('Dependency Issue Violations');
  console.log('-'.repeat(80));
  console.log('');

  if (violations.length === 0) {
    console.log('✅ No dependency issues found!');
  } else {
    console.log(`❌ Found ${violations.length} dependency issue(s)`);
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
  console.log(`Dependency issues: ${violations.length} violation(s)`);
  console.log('');

  if (violations.length === 0) {
    console.log('✅ All dependency checks passed!');
  } else {
    console.log('❌ Use implicit dependencies where possible.');
  }

  console.log('');

  return violations.length > 0 ? 1 : 0;
}

const exitCode = runCheck();
process.exit(exitCode);
