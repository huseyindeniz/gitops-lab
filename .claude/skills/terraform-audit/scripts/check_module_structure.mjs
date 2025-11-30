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

function getDirectories(dir) {
  if (!fs.existsSync(dir)) return [];

  return fs.readdirSync(dir)
    .filter(item => {
      const fullPath = path.join(dir, item);
      return fs.statSync(fullPath).isDirectory() && !item.startsWith('.');
    })
    .map(item => path.join(dir, item));
}

function checkModuleStructure(moduleDir, isRoot = false) {
  const violations = [];
  const moduleName = path.basename(moduleDir);
  const relPath = normalizePath(path.relative(projectRoot, moduleDir));

  const files = fs.readdirSync(moduleDir);
  const tfFiles = files.filter(f => f.endsWith('.tf'));

  // Skip if no .tf files
  if (tfFiles.length === 0) return violations;

  // Check README
  if (!files.some(f => f.toLowerCase() === 'readme.md')) {
    violations.push({
      path: relPath,
      type: 'missing_readme',
      message: `Module "${moduleName}" missing README.md`,
    });
  }

  // Check variables.tf if variables are used
  const hasVarUsage = tfFiles.some(f => {
    const content = fs.readFileSync(path.join(moduleDir, f), 'utf-8');
    return /var\./.test(content);
  });

  if (hasVarUsage && !files.includes('variables.tf')) {
    violations.push({
      path: relPath,
      type: 'missing_variables_tf',
      message: `Module "${moduleName}" uses variables but missing variables.tf`,
    });
  }

  // Check versions.tf
  if (!files.includes('versions.tf')) {
    violations.push({
      path: relPath,
      type: 'missing_versions_tf',
      message: `Module "${moduleName}" missing versions.tf`,
    });
  }

  // Check for overly complex modules
  if (tfFiles.length > 10) {
    violations.push({
      path: relPath,
      type: 'complex_module',
      message: `Module "${moduleName}" has ${tfFiles.length} .tf files - consider splitting`,
    });
  }

  // Root module checks
  if (isRoot) {
    // Check for backend
    let hasBackend = false;
    for (const f of tfFiles) {
      const content = fs.readFileSync(path.join(moduleDir, f), 'utf-8');
      if (/backend\s*"/.test(content) || /backend\s*\{/.test(content)) {
        hasBackend = true;
        break;
      }
    }

    if (!hasBackend) {
      violations.push({
        path: relPath,
        type: 'missing_backend',
        message: `Root module "${moduleName}" has no backend (uses local state)`,
      });
    }
  }

  return violations;
}

function runCheck() {
  console.log('Terraform Module Structure Check');
  console.log('='.repeat(80));
  console.log('');

  const violations = [];

  // Check modules/ directory
  const modulesDir = path.join(terraformDir, 'modules');
  if (fs.existsSync(modulesDir)) {
    const modules = getDirectories(modulesDir);
    console.log(`Checking ${modules.length} module(s) in terraform/modules/...`);

    for (const mod of modules) {
      violations.push(...checkModuleStructure(mod, false));
    }
  }

  // Check root modules (local-*, aws-*, etc.)
  const rootDirs = getDirectories(terraformDir).filter(d => {
    const name = path.basename(d);
    return name !== 'modules' && !name.startsWith('.');
  });

  console.log(`Checking ${rootDirs.length} root module(s)...`);

  for (const rootDir of rootDirs) {
    violations.push(...checkModuleStructure(rootDir, true));
  }

  console.log('');
  console.log('Module Structure Violations');
  console.log('-'.repeat(80));
  console.log('');

  if (violations.length === 0) {
    console.log('✅ All modules have proper structure!');
  } else {
    console.log(`❌ Found ${violations.length} structure issue(s)`);
    console.log('');

    for (const v of violations) {
      console.log(`  ❌ ${v.path}`);
      console.log(`     ${v.message}`);
      console.log('');
    }
  }

  console.log('='.repeat(80));
  console.log('Summary');
  console.log('');
  console.log(`Structure issues: ${violations.length} violation(s)`);
  console.log('');

  if (violations.length === 0) {
    console.log('✅ All module structure checks passed!');
  } else {
    console.log('❌ Fix module structure issues for consistency.');
  }

  console.log('');

  return violations.length > 0 ? 1 : 0;
}

const exitCode = runCheck();
process.exit(exitCode);
