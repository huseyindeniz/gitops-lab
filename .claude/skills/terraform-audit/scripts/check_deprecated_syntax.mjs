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

// Deprecated/anti-pattern checks - HIGH severity (upgrade blockers)
const deprecatedPatterns = [
  // Unnecessary interpolation - will be removed in Terraform 2.0
  {
    pattern: /"\$\{(var|local)\.[a-zA-Z_][a-zA-Z0-9_]*\}"/g,
    type: 'unnecessary_interpolation',
    severity: 'HIGH',
    message: 'Unnecessary interpolation "${var.x}" - use var.x (Terraform 2.0 breaking)',
    exclude: [/templatefile/, /format\(/, /join\(/, /<</, /heredoc/i],
  },
  // Deprecated list() function
  {
    pattern: /\blist\s*\(\s*("[^"]*"|[0-9])/g,
    type: 'deprecated_list_function',
    severity: 'HIGH',
    message: 'Deprecated list() function - use [] syntax',
    exclude: [/type\s*=/, /tolist\(/],
  },
  // Deprecated map() function
  {
    pattern: /\bmap\s*\(\s*"[^"]*"\s*,/g,
    type: 'deprecated_map_function',
    severity: 'HIGH',
    message: 'Deprecated map() function - use {} syntax',
    exclude: [/type\s*=/, /tomap\(/],
  },
  // count = length() anti-pattern - causes state corruption on reorder
  {
    pattern: /count\s*=\s*length\s*\(/g,
    type: 'count_length_antipattern',
    severity: 'HIGH',
    message: 'count = length() anti-pattern - use for_each (state corruption risk on reorder)',
    exclude: [],
  },
  // count.index with element() - deprecated pattern
  {
    pattern: /element\s*\([^,]+,\s*count\.index\s*\)/g,
    type: 'deprecated_element',
    severity: 'HIGH',
    message: 'element(list, count.index) deprecated - use list[count.index]',
    exclude: [],
  },
  // Splat expression old syntax
  {
    pattern: /\.\*\./g,
    type: 'old_splat_syntax',
    severity: 'MEDIUM',
    message: 'Old splat syntax .*.attr - use [*].attr',
    exclude: [/\*\.\*/, /\/\*/],  // Exclude glob patterns and comments
  },
  // terraform.workspace anti-pattern
  {
    pattern: /terraform\.workspace/g,
    type: 'workspace_antipattern',
    severity: 'MEDIUM',
    message: 'terraform.workspace usage - consider separate state files per environment',
    exclude: [],
  },
  // Deprecated ignore_changes = all
  {
    pattern: /ignore_changes\s*=\s*\[?"?all"?\]?/g,
    type: 'deprecated_ignore_all',
    severity: 'HIGH',
    message: 'ignore_changes = all deprecated - use ignore_changes = [all] or specific attributes',
    exclude: [],
  },
  // Legacy provider syntax
  {
    pattern: /provider\s*=\s*"[^"]+\.[^"]+"/g,
    type: 'legacy_provider_syntax',
    severity: 'MEDIUM',
    message: 'Legacy provider syntax "provider.alias" - use provider.alias without quotes',
    exclude: [],
  },
  // Deprecated -target usage hint (in comments/docs)
  {
    pattern: /terraform\s+(apply|plan)\s+.*-target/g,
    type: 'target_usage',
    severity: 'LOW',
    message: 'terraform -target usage noted - indicates potential dependency issues',
    exclude: [],
  },
  // Deprecated lookup() with default - use try() instead
  {
    pattern: /lookup\s*\([^,]+,[^,]+,[^)]+\)/g,
    type: 'deprecated_lookup_default',
    severity: 'LOW',
    message: 'lookup() with default - consider try() for complex defaults',
    exclude: [],
  },
];

function findDeprecatedSyntax(content, filePath) {
  const lines = content.split('\n');
  const violations = [];
  const relPath = normalizePath(path.relative(projectRoot, filePath));

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip comments
    if (/^\s*#/.test(line)) continue;

    for (const check of deprecatedPatterns) {
      // Check exclusions
      const excluded = check.exclude.some(ex => ex.test(line));
      if (excluded) continue;

      check.pattern.lastIndex = 0;
      if (check.pattern.test(line)) {
        violations.push({
          file: relPath,
          line: i + 1,
          type: check.type,
          severity: check.severity,
          message: check.message,
        });
      }
    }
  }

  return violations;
}

function runCheck() {
  console.log('Terraform Deprecated Syntax Check');
  console.log('='.repeat(80));
  console.log('');

  const files = getTerraformFiles(terraformDir);
  console.log(`Scanning ${files.length} Terraform files...`);
  console.log('');

  const violations = [];

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    violations.push(...findDeprecatedSyntax(content, file));
  }

  console.log('Deprecated Syntax Violations');
  console.log('-'.repeat(80));
  console.log('');

  if (violations.length === 0) {
    console.log('✅ No deprecated syntax found!');
  } else {
    const high = violations.filter(v => v.severity === 'HIGH').length;
    const medium = violations.filter(v => v.severity === 'MEDIUM').length;
    const low = violations.filter(v => v.severity === 'LOW').length;

    console.log(`❌ Found ${violations.length} deprecated syntax issue(s) (HIGH: ${high}, MEDIUM: ${medium}, LOW: ${low})`);
    console.log('');

    const byFile = {};
    for (const v of violations) {
      if (!byFile[v.file]) byFile[v.file] = [];
      byFile[v.file].push(v);
    }

    for (const file of Object.keys(byFile).sort()) {
      console.log(`  ❌ ${file}`);
      for (const v of byFile[file]) {
        console.log(`     Line ${v.line}: [${v.severity}] ${v.message}`);
      }
      console.log('');
    }
  }

  console.log('='.repeat(80));
  console.log('Summary');
  console.log('');
  console.log(`Deprecated syntax: ${violations.length} violation(s)`);
  console.log('');

  if (violations.length === 0) {
    console.log('✅ All deprecated syntax checks passed!');
  } else {
    console.log('❌ Update to modern Terraform syntax.');
  }

  console.log('');

  return violations.length > 0 ? 1 : 0;
}

const exitCode = runCheck();
process.exit(exitCode);
