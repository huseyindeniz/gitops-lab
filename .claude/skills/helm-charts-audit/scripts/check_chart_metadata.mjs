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
 * Validate SemVer format
 */
function isValidSemVer(version) {
  // SemVer regex: MAJOR.MINOR.PATCH with optional pre-release and build metadata
  const semverRegex = /^\d+\.\d+\.\d+(-[0-9A-Za-z-]+(\.[0-9A-Za-z-]+)*)?(\+[0-9A-Za-z-]+(\.[0-9A-Za-z-]+)*)?$/;
  return semverRegex.test(version);
}

/**
 * Check Chart.yaml metadata
 */
function checkChartMetadata(chartYamlPath, chartName) {
  const violations = [];
  const relPath = normalizePath(path.relative(projectRoot, chartYamlPath));

  const content = fs.readFileSync(chartYamlPath, 'utf-8');
  const lines = content.split('\n');

  // Find line numbers for better reporting
  const findLineNumber = (key) => {
    for (let i = 0; i < lines.length; i++) {
      if (new RegExp(`^${key}:`).test(lines[i])) {
        return i + 1;
      }
    }
    return 1;
  };

  // Check apiVersion
  const apiVersionMatch = content.match(/^apiVersion:\s*["']?([^"'\s\n]+)["']?/m);
  if (!apiVersionMatch) {
    violations.push({
      file: relPath,
      line: 1,
      chart: chartName,
      issue: 'missing_api_version',
      severity: 'HIGH',
      message: 'Missing apiVersion in Chart.yaml',
    });
  } else if (apiVersionMatch[1] === 'v1') {
    violations.push({
      file: relPath,
      line: findLineNumber('apiVersion'),
      chart: chartName,
      issue: 'legacy_api_version',
      severity: 'MEDIUM',
      message: 'Using apiVersion: v1 (Helm 2) - upgrade to apiVersion: v2 (Helm 3)',
    });
  }

  // Check name matches directory name
  const nameMatch = content.match(/^name:\s*["']?([^"'\s\n]+)["']?/m);
  if (!nameMatch) {
    violations.push({
      file: relPath,
      line: 1,
      chart: chartName,
      issue: 'missing_name',
      severity: 'HIGH',
      message: 'Missing name in Chart.yaml',
    });
  } else if (nameMatch[1] !== chartName) {
    violations.push({
      file: relPath,
      line: findLineNumber('name'),
      chart: chartName,
      issue: 'name_mismatch',
      severity: 'MEDIUM',
      message: `Chart name "${nameMatch[1]}" doesn't match directory name "${chartName}"`,
    });
  }

  // Check version
  const versionMatch = content.match(/^version:\s*["']?([^"'\s\n]+)["']?/m);
  if (!versionMatch) {
    violations.push({
      file: relPath,
      line: 1,
      chart: chartName,
      issue: 'missing_version',
      severity: 'HIGH',
      message: 'Missing version in Chart.yaml',
    });
  } else if (!isValidSemVer(versionMatch[1])) {
    violations.push({
      file: relPath,
      line: findLineNumber('version'),
      chart: chartName,
      issue: 'invalid_semver',
      severity: 'MEDIUM',
      message: `Version "${versionMatch[1]}" is not valid SemVer (expected: MAJOR.MINOR.PATCH)`,
    });
  }

  // Check appVersion
  const appVersionMatch = content.match(/^appVersion:\s*["']?([^"'\s\n]+)["']?/m);
  if (!appVersionMatch) {
    violations.push({
      file: relPath,
      line: 1,
      chart: chartName,
      issue: 'missing_app_version',
      severity: 'LOW',
      message: 'Missing appVersion in Chart.yaml - recommended for tracking application version',
    });
  }

  // Check description
  const descriptionMatch = content.match(/^description:\s*["']?(.+)["']?/m);
  if (!descriptionMatch || !descriptionMatch[1].trim()) {
    violations.push({
      file: relPath,
      line: 1,
      chart: chartName,
      issue: 'missing_description',
      severity: 'LOW',
      message: 'Missing description in Chart.yaml',
    });
  } else if (descriptionMatch[1].trim().length < 10) {
    violations.push({
      file: relPath,
      line: findLineNumber('description'),
      chart: chartName,
      issue: 'short_description',
      severity: 'LOW',
      message: 'Description is too short - provide a meaningful description',
    });
  }

  // Check maintainers
  const hasMaintainers = /^maintainers:/m.test(content);
  if (!hasMaintainers) {
    violations.push({
      file: relPath,
      line: 1,
      chart: chartName,
      issue: 'missing_maintainers',
      severity: 'MEDIUM',
      message: 'Missing maintainers section - important for chart ownership',
    });
  } else {
    // Check maintainers have email
    const maintainersBlock = content.match(/^maintainers:([\s\S]*?)(?=^[a-z]|\z)/m);
    if (maintainersBlock) {
      if (!/email:/.test(maintainersBlock[1])) {
        violations.push({
          file: relPath,
          line: findLineNumber('maintainers'),
          chart: chartName,
          issue: 'maintainers_no_email',
          severity: 'LOW',
          message: 'Maintainers should include email addresses',
        });
      }
    }
  }

  // Check type (if present, should be application or library)
  const typeMatch = content.match(/^type:\s*["']?([^"'\s\n]+)["']?/m);
  if (typeMatch && !['application', 'library'].includes(typeMatch[1])) {
    violations.push({
      file: relPath,
      line: findLineNumber('type'),
      chart: chartName,
      issue: 'invalid_type',
      severity: 'LOW',
      message: `Invalid type "${typeMatch[1]}" - must be "application" or "library"`,
    });
  }

  // Check for deprecated: true without notice
  if (/^deprecated:\s*true/m.test(content)) {
    const hasDeprecationNotice = /deprecation|replaced|successor|migration/i.test(content);
    if (!hasDeprecationNotice) {
      violations.push({
        file: relPath,
        line: findLineNumber('deprecated'),
        chart: chartName,
        issue: 'deprecated_no_notice',
        severity: 'MEDIUM',
        message: 'Chart is deprecated but has no migration/replacement info in description',
      });
    }
  }

  // Check icon URL (if present, should be valid URL)
  const iconMatch = content.match(/^icon:\s*["']?([^"'\s\n]+)["']?/m);
  if (iconMatch) {
    const iconUrl = iconMatch[1];
    if (!iconUrl.startsWith('http://') && !iconUrl.startsWith('https://')) {
      violations.push({
        file: relPath,
        line: findLineNumber('icon'),
        chart: chartName,
        issue: 'invalid_icon_url',
        severity: 'LOW',
        message: 'Icon should be a valid HTTP/HTTPS URL',
      });
    }
  }

  // Check kubeVersion constraint format
  const kubeVersionMatch = content.match(/^kubeVersion:\s*["']?([^"'\n]+)["']?/m);
  if (kubeVersionMatch) {
    const constraint = kubeVersionMatch[1];
    // Very basic check - should have comparison operators
    if (!/[<>=^~]/.test(constraint)) {
      violations.push({
        file: relPath,
        line: findLineNumber('kubeVersion'),
        chart: chartName,
        issue: 'invalid_kube_version',
        severity: 'LOW',
        message: `kubeVersion "${constraint}" should use version constraints (e.g., ">=1.20.0")`,
      });
    }
  }

  return violations;
}

/**
 * Main check function
 */
function runCheck() {
  console.log('Helm Charts Metadata Check');
  console.log('='.repeat(80));
  console.log('');

  const charts = getHelmCharts(helmChartsDir);
  console.log(`Found ${charts.length} Helm charts to scan`);
  console.log('');

  const violations = [];

  for (const chart of charts) {
    violations.push(...checkChartMetadata(chart.chartYaml, chart.name));
  }

  console.log('Chart Metadata Violations');
  console.log('-'.repeat(80));
  console.log('');

  if (violations.length === 0) {
    console.log('✅ All Chart.yaml files are properly configured!');
  } else {
    const high = violations.filter(v => v.severity === 'HIGH').length;
    const medium = violations.filter(v => v.severity === 'MEDIUM').length;
    const low = violations.filter(v => v.severity === 'LOW').length;

    console.log(`❌ Found ${violations.length} metadata issue(s) (HIGH: ${high}, MEDIUM: ${medium}, LOW: ${low})`);
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
  console.log(`Metadata issues: ${violations.length} violation(s)`);
  console.log('');

  if (violations.length === 0) {
    console.log('✅ All chart metadata checks passed!');
  } else {
    console.log('❌ Fix: Ensure Chart.yaml has:');
    console.log('  - apiVersion: v2');
    console.log('  - name: matching-directory-name');
    console.log('  - version: 1.0.0 (SemVer)');
    console.log('  - description: A meaningful description');
    console.log('  - maintainers: with name and email');
  }

  console.log('');

  // Only return 1 if there are HIGH severity issues
  const hasHighSeverity = violations.some(v => v.severity === 'HIGH');
  return hasHighSeverity ? 1 : 0;
}

const exitCode = runCheck();
process.exit(exitCode);
