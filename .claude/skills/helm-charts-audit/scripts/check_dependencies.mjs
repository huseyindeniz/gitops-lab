#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, '../../../..');
const helmChartsDir = path.join(projectRoot, 'helm-charts');

function normalizePath(p) {
  return p.replace(/\\/g, '/');
}

function getHelmCharts(dir) {
  if (!fs.existsSync(dir)) return [];

  const charts = [];
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const chartPath = path.join(dir, item);
    const chartYaml = path.join(chartPath, 'Chart.yaml');

    if (fs.statSync(chartPath).isDirectory() && fs.existsSync(chartYaml)) {
      charts.push({ name: item, path: chartPath, chartYaml });
    }
  }

  return charts;
}

/**
 * Check if version is a floating/unpinned version
 */
function isFloatingVersion(version) {
  if (!version || version === '*') return true;
  // Check for open-ended ranges like >=, >, ^, ~, x, X, *
  if (/^[>^~]/.test(version)) return true;
  if (/[xX*]/.test(version)) return true;
  // Check for empty or whitespace-only
  if (!version.trim()) return true;
  return false;
}

/**
 * Check chart dependencies
 */
function checkDependencies(chartYamlPath, chartPath, chartName) {
  const violations = [];
  const relPath = normalizePath(path.relative(projectRoot, chartYamlPath));

  const content = fs.readFileSync(chartYamlPath, 'utf-8');
  const lines = content.split('\n');

  // Check for dependencies block
  const hasDependencies = /^dependencies:/m.test(content);
  if (!hasDependencies) {
    // No dependencies is fine, no violations
    return violations;
  }

  // Extract dependencies block
  const dependenciesMatch = content.match(/^dependencies:([\s\S]*?)(?=^[a-z]|\z)/m);
  if (!dependenciesMatch) return violations;

  const dependenciesBlock = dependenciesMatch[1];
  const dependenciesStartLine = content.substring(0, content.indexOf('dependencies:')).split('\n').length;

  // Check for Chart.lock
  const chartLockPath = path.join(chartPath, 'Chart.lock');
  if (!fs.existsSync(chartLockPath)) {
    violations.push({
      file: `${normalizePath(path.relative(projectRoot, chartPath))}/Chart.lock`,
      line: dependenciesStartLine,
      chart: chartName,
      issue: 'missing_chart_lock',
      severity: 'MEDIUM',
      message: 'Chart has dependencies but no Chart.lock - run "helm dependency update"',
    });
  }

  // Parse individual dependencies
  const depRegex = /-\s*name:\s*["']?([^"'\s\n]+)["']?[\s\S]*?(?=\s*-\s*name:|\z)/g;
  let depMatch;

  while ((depMatch = depRegex.exec(dependenciesBlock)) !== null) {
    const depName = depMatch[1];
    const depBlock = depMatch[0];

    // Find line number for this dependency
    const depIndex = content.indexOf(depBlock);
    const depLineNum = content.substring(0, depIndex).split('\n').length;

    // Check version
    const versionMatch = depBlock.match(/version:\s*["']?([^"'\s\n]+)["']?/);
    if (!versionMatch) {
      violations.push({
        file: relPath,
        line: depLineNum,
        chart: chartName,
        dependency: depName,
        issue: 'missing_version',
        severity: 'HIGH',
        message: `Dependency "${depName}" has no version specified`,
      });
    } else {
      const version = versionMatch[1];
      if (isFloatingVersion(version)) {
        violations.push({
          file: relPath,
          line: depLineNum,
          chart: chartName,
          dependency: depName,
          issue: 'floating_version',
          severity: 'MEDIUM',
          message: `Dependency "${depName}" has floating version "${version}" - pin to specific version`,
        });
      }
    }

    // Check repository
    const repoMatch = depBlock.match(/repository:\s*["']?([^"'\s\n]+)["']?/);
    if (repoMatch) {
      const repo = repoMatch[1];

      // Check for file:// references
      if (repo.startsWith('file://')) {
        violations.push({
          file: relPath,
          line: depLineNum,
          chart: chartName,
          dependency: depName,
          issue: 'local_dependency',
          severity: 'MEDIUM',
          message: `Dependency "${depName}" uses local file:// reference - may not work when published`,
        });
      }

      // Check for insecure HTTP
      if (repo.startsWith('http://') && !repo.includes('localhost') && !repo.includes('127.0.0.1')) {
        violations.push({
          file: relPath,
          line: depLineNum,
          chart: chartName,
          dependency: depName,
          issue: 'insecure_repo',
          severity: 'HIGH',
          message: `Dependency "${depName}" uses insecure HTTP repository - use HTTPS`,
        });
      }

      // Check for deprecated/old repository URLs
      const deprecatedRepos = [
        { pattern: /charts\.helm\.sh\/stable/i, msg: 'Deprecated: Use new Helm repository URLs' },
        { pattern: /kubernetes-charts\.storage\.googleapis\.com/i, msg: 'Deprecated: Google Charts repo is deprecated' },
      ];

      for (const { pattern, msg } of deprecatedRepos) {
        if (pattern.test(repo)) {
          violations.push({
            file: relPath,
            line: depLineNum,
            chart: chartName,
            dependency: depName,
            issue: 'deprecated_repo',
            severity: 'MEDIUM',
            message: `Dependency "${depName}" uses deprecated repository: ${msg}`,
          });
        }
      }
    }

    // Check condition field (optional but good practice for optional deps)
    const hasCondition = /condition:/.test(depBlock);
    const hasEnabled = /enabled:/.test(depBlock);

    // This is just informational, not a violation
    // But check if condition references a non-existent value
    if (hasCondition) {
      const conditionMatch = depBlock.match(/condition:\s*["']?([^"'\s\n]+)["']?/);
      if (conditionMatch) {
        const condition = conditionMatch[1];
        // Check if this condition path exists in values.yaml
        const valuesPath = path.join(chartPath, 'values.yaml');
        if (fs.existsSync(valuesPath)) {
          const valuesContent = fs.readFileSync(valuesPath, 'utf-8');
          // Simple check - look for the first part of the condition path
          const conditionRoot = condition.split('.')[0];
          if (!new RegExp(`^${conditionRoot}:`, 'm').test(valuesContent)) {
            violations.push({
              file: relPath,
              line: depLineNum,
              chart: chartName,
              dependency: depName,
              issue: 'orphan_condition',
              severity: 'LOW',
              message: `Dependency "${depName}" condition "${condition}" may not be defined in values.yaml`,
            });
          }
        }
      }
    }

    // Check alias (should be alphanumeric with hyphens/underscores)
    const aliasMatch = depBlock.match(/alias:\s*["']?([^"'\s\n]+)["']?/);
    if (aliasMatch) {
      const alias = aliasMatch[1];
      if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(alias)) {
        violations.push({
          file: relPath,
          line: depLineNum,
          chart: chartName,
          dependency: depName,
          issue: 'invalid_alias',
          severity: 'LOW',
          message: `Dependency "${depName}" alias "${alias}" should be alphanumeric`,
        });
      }
    }
  }

  // Check charts/ directory for local dependencies
  const chartsDir = path.join(chartPath, 'charts');
  if (fs.existsSync(chartsDir)) {
    const localCharts = fs.readdirSync(chartsDir);

    for (const localChart of localCharts) {
      // Skip non-directories and archives
      if (localChart.endsWith('.tgz')) continue;

      const localChartPath = path.join(chartsDir, localChart);
      if (fs.statSync(localChartPath).isDirectory()) {
        // Check if this local chart is referenced in dependencies
        if (!dependenciesBlock.includes(localChart)) {
          violations.push({
            file: `${normalizePath(path.relative(projectRoot, chartsDir))}/${localChart}`,
            line: 1,
            chart: chartName,
            dependency: localChart,
            issue: 'orphan_local_chart',
            severity: 'LOW',
            message: `Local chart "${localChart}" in charts/ but not in dependencies`,
          });
        }
      }
    }
  }

  return violations;
}

/**
 * Main check function
 */
function runCheck() {
  console.log('Helm Charts Dependencies Check');
  console.log('='.repeat(80));
  console.log('');

  const charts = getHelmCharts(helmChartsDir);
  console.log(`Found ${charts.length} Helm charts to scan`);
  console.log('');

  const violations = [];

  for (const chart of charts) {
    violations.push(...checkDependencies(chart.chartYaml, chart.path, chart.name));
  }

  console.log('Dependencies Violations');
  console.log('-'.repeat(80));
  console.log('');

  if (violations.length === 0) {
    console.log('✅ All chart dependencies are properly configured!');
  } else {
    const high = violations.filter(v => v.severity === 'HIGH').length;
    const medium = violations.filter(v => v.severity === 'MEDIUM').length;
    const low = violations.filter(v => v.severity === 'LOW').length;

    console.log(`❌ Found ${violations.length} dependency issue(s) (HIGH: ${high}, MEDIUM: ${medium}, LOW: ${low})`);
    console.log('');

    // Group by chart
    const byChart = {};
    for (const v of violations) {
      if (!byChart[v.chart]) byChart[v.chart] = [];
      byChart[v.chart].push(v);
    }

    for (const chart of Object.keys(byChart).sort()) {
      console.log(`  ❌ ${chart}/`);
      for (const v of byChart[chart]) {
        console.log(`     ${v.file}:${v.line}: [${v.severity}] ${v.message}`);
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
    console.log('❌ Fix: Ensure dependencies have:');
    console.log('  - Pinned versions (e.g., "1.2.3" not "^1.2.3" or "*")');
    console.log('  - Chart.lock file (run "helm dependency update")');
    console.log('  - HTTPS repository URLs');
    console.log('  - No local file:// references in published charts');
  }

  console.log('');

  // Only return 1 if there are HIGH severity issues
  const hasHighSeverity = violations.some(v => v.severity === 'HIGH');
  return hasHighSeverity ? 1 : 0;
}

const exitCode = runCheck();
process.exit(exitCode);
