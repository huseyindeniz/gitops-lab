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

function findVersionIssues(content, filePath) {
  const violations = [];
  const relPath = normalizePath(path.relative(projectRoot, filePath));

  // Check for modules without version
  const moduleRegex = /module\s+"([^"]+)"\s*\{([^}]+)\}/gs;
  let match;

  while ((match = moduleRegex.exec(content)) !== null) {
    const moduleName = match[1];
    const moduleBody = match[2];
    const lineNum = content.substring(0, match.index).split('\n').length;

    // Check if source is registry or github
    const sourceMatch = moduleBody.match(/source\s*=\s*"([^"]+)"/);
    if (sourceMatch) {
      const source = sourceMatch[1];

      // Registry module (short form or full URL)
      if (/^[a-zA-Z0-9-]+\/[a-zA-Z0-9-]+\/[a-zA-Z0-9-]+$/.test(source) ||
          source.includes('registry.terraform.io')) {
        if (!/version\s*=/.test(moduleBody)) {
          violations.push({
            file: relPath,
            line: lineNum,
            type: 'missing_module_version',
            name: moduleName,
            message: `Module "${moduleName}" from registry has no version constraint`,
          });
        }
      }

      // GitHub module without ref
      if (source.includes('github.com') || source.includes('git::')) {
        if (!source.includes('?ref=') && !source.includes('?tag=')) {
          violations.push({
            file: relPath,
            line: lineNum,
            type: 'missing_git_ref',
            name: moduleName,
            message: `Module "${moduleName}" from Git has no ref/tag`,
          });
        }
      }
    }
  }

  // Check for required_providers without version
  const providerRegex = /required_providers\s*\{([^}]+)\}/gs;
  while ((match = providerRegex.exec(content)) !== null) {
    const providersBlock = match[1];
    const blockStart = content.substring(0, match.index).split('\n').length;

    // Find individual providers
    const providerDefRegex = /(\w+)\s*=\s*\{([^}]+)\}/g;
    let provMatch;

    while ((provMatch = providerDefRegex.exec(providersBlock)) !== null) {
      const providerName = provMatch[1];
      const providerBody = provMatch[2];

      if (!/version\s*=/.test(providerBody)) {
        violations.push({
          file: relPath,
          line: blockStart,
          type: 'missing_provider_version',
          name: providerName,
          message: `Provider "${providerName}" has no version constraint`,
        });
      }
    }
  }

  return violations;
}

function runCheck() {
  console.log('Terraform Missing Versions Check');
  console.log('='.repeat(80));
  console.log('');

  const files = getTerraformFiles(terraformDir);
  console.log(`Scanning ${files.length} Terraform files...`);
  console.log('');

  const violations = [];

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    violations.push(...findVersionIssues(content, file));
  }

  console.log('Missing Version Constraints');
  console.log('-'.repeat(80));
  console.log('');

  if (violations.length === 0) {
    console.log('✅ All modules and providers have version constraints!');
  } else {
    console.log(`❌ Found ${violations.length} missing version constraint(s)`);
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
  console.log(`Missing versions: ${violations.length} violation(s)`);
  console.log('');

  if (violations.length === 0) {
    console.log('✅ All version checks passed!');
  } else {
    console.log('❌ Pin versions for reproducible builds.');
  }

  console.log('');

  return violations.length > 0 ? 1 : 0;
}

const exitCode = runCheck();
process.exit(exitCode);
