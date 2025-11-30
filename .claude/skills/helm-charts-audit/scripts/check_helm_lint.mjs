#!/usr/bin/env node

import { spawn } from 'child_process';
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
      charts.push({ name: item, path: chartPath });
    }
  }

  return charts;
}

/**
 * Check if helm is installed
 */
function checkHelmInstalled() {
  return new Promise((resolve) => {
    const proc = spawn('helm', ['version', '--short'], {
      stdio: 'pipe',
      shell: true,
    });

    let output = '';
    proc.stdout.on('data', (data) => {
      output += data.toString();
    });

    proc.on('close', (code) => {
      resolve(code === 0 ? output.trim() : null);
    });

    proc.on('error', () => {
      resolve(null);
    });
  });
}

/**
 * Run helm lint on a chart
 */
function runHelmLint(chartPath) {
  return new Promise((resolve) => {
    const proc = spawn('helm', ['lint', chartPath, '--strict'], {
      stdio: 'pipe',
      shell: true,
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      resolve({
        code,
        output: stdout + stderr,
        stdout,
        stderr,
      });
    });

    proc.on('error', (error) => {
      resolve({
        code: 1,
        output: error.message,
        error: error.message,
      });
    });
  });
}

/**
 * Parse helm lint output for violations
 */
function parseLintOutput(output, chartName) {
  const violations = [];
  const lines = output.split('\n');

  for (const line of lines) {
    // Pattern: [ERROR] or [WARNING] followed by path and message
    const errorMatch = line.match(/\[ERROR\]\s*(.*)/);
    if (errorMatch) {
      violations.push({
        chart: chartName,
        issue: 'helm_lint_error',
        severity: 'HIGH',
        message: errorMatch[1].trim(),
      });
    }

    const warnMatch = line.match(/\[WARNING\]\s*(.*)/);
    if (warnMatch) {
      violations.push({
        chart: chartName,
        issue: 'helm_lint_warning',
        severity: 'MEDIUM',
        message: warnMatch[1].trim(),
      });
    }

    const infoMatch = line.match(/\[INFO\]\s*(.*)/);
    if (infoMatch) {
      violations.push({
        chart: chartName,
        issue: 'helm_lint_info',
        severity: 'LOW',
        message: infoMatch[1].trim(),
      });
    }
  }

  return violations;
}

/**
 * Main check function
 */
async function runCheck() {
  console.log('Helm Charts Lint Check');
  console.log('='.repeat(80));
  console.log('');

  // Check if helm is installed
  const helmVersion = await checkHelmInstalled();
  if (!helmVersion) {
    console.log('Helm CLI not found - skipping helm lint check');
    console.log('');
    console.log('Install helm to enable this check:');
    console.log('  - Windows: choco install kubernetes-helm');
    console.log('  - macOS: brew install helm');
    console.log('  - Linux: https://helm.sh/docs/intro/install/');
    console.log('');
    console.log('='.repeat(80));
    console.log('Summary');
    console.log('');
    console.log('Helm lint: SKIPPED (helm not installed)');
    console.log('');
    // Return 0 since we're gracefully skipping
    return 0;
  }

  console.log(`Helm version: ${helmVersion}`);
  console.log('');

  const charts = getHelmCharts(helmChartsDir);
  console.log(`Found ${charts.length} Helm charts to lint`);
  console.log('');

  const violations = [];
  const results = [];

  for (const chart of charts) {
    process.stdout.write(`Linting ${chart.name}... `);

    const { code, output } = await runHelmLint(chart.path);
    const chartViolations = parseLintOutput(output, chart.name);

    violations.push(...chartViolations);

    const hasErrors = chartViolations.some(v => v.severity === 'HIGH');
    const hasWarnings = chartViolations.some(v => v.severity === 'MEDIUM');

    results.push({
      chart: chart.name,
      code,
      hasErrors,
      hasWarnings,
      violations: chartViolations,
    });

    if (hasErrors) {
      console.log('FAILED');
    } else if (hasWarnings) {
      console.log('WARNING');
    } else {
      console.log('OK');
    }
  }

  console.log('');
  console.log('Helm Lint Violations');
  console.log('-'.repeat(80));
  console.log('');

  if (violations.length === 0) {
    console.log('✅ All charts pass helm lint!');
  } else {
    const high = violations.filter(v => v.severity === 'HIGH').length;
    const medium = violations.filter(v => v.severity === 'MEDIUM').length;
    const low = violations.filter(v => v.severity === 'LOW').length;

    console.log(`❌ Found ${violations.length} lint issue(s) (HIGH: ${high}, MEDIUM: ${medium}, LOW: ${low})`);
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
        console.log(`     [${v.severity}] ${v.message}`);
      }
      console.log('');
    }
  }

  console.log('='.repeat(80));
  console.log('Summary');
  console.log('');

  const failedCharts = results.filter(r => r.hasErrors).map(r => r.chart);
  const warningCharts = results.filter(r => !r.hasErrors && r.hasWarnings).map(r => r.chart);
  const passedCharts = results.filter(r => !r.hasErrors && !r.hasWarnings).map(r => r.chart);

  console.log(`Helm lint: ${failedCharts.length} failed, ${warningCharts.length} warnings, ${passedCharts.length} passed`);
  console.log('');

  if (failedCharts.length === 0) {
    console.log('✅ All helm lint checks passed!');
  } else {
    console.log('❌ Helm lint issues found.');
    console.log('');
    console.log('Failed charts:');
    for (const chart of failedCharts) {
      console.log(`  - ${chart}`);
    }
    console.log('');
    console.log('Fix: Run "helm lint <chart-path>" for detailed error messages');
  }

  console.log('');

  // Return 1 only if there are HIGH severity issues (errors)
  return failedCharts.length > 0 ? 1 : 0;
}

runCheck().then((exitCode) => {
  process.exit(exitCode);
}).catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
