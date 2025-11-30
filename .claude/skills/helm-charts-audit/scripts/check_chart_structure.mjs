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
      charts.push({ name: item, path: chartPath });
    }
  }

  return charts;
}

/**
 * Check chart directory structure
 */
function checkChartStructure(chartPath, chartName) {
  const violations = [];
  const relPath = normalizePath(path.relative(projectRoot, chartPath));

  // Required files
  const requiredFiles = [
    { file: 'Chart.yaml', severity: 'HIGH', message: 'Chart.yaml is required' },
    { file: 'values.yaml', severity: 'MEDIUM', message: 'values.yaml is recommended for configurable charts' },
  ];

  // Recommended files
  const recommendedFiles = [
    { file: 'README.md', severity: 'MEDIUM', message: 'README.md helps users understand how to use the chart' },
    { file: 'templates/NOTES.txt', severity: 'LOW', message: 'NOTES.txt provides post-install instructions' },
    { file: 'templates/_helpers.tpl', severity: 'LOW', message: '_helpers.tpl organizes template helpers' },
    { file: '.helmignore', severity: 'LOW', message: '.helmignore excludes files from packaged chart' },
  ];

  // Check required files
  for (const { file, severity, message } of requiredFiles) {
    const filePath = path.join(chartPath, file);
    if (!fs.existsSync(filePath)) {
      violations.push({
        file: `${relPath}/${file}`,
        line: 1,
        chart: chartName,
        issue: `missing_${file.replace(/[./]/g, '_')}`,
        severity,
        message: `Missing ${file}: ${message}`,
      });
    }
  }

  // Check recommended files
  for (const { file, severity, message } of recommendedFiles) {
    const filePath = path.join(chartPath, file);
    if (!fs.existsSync(filePath)) {
      violations.push({
        file: `${relPath}/${file}`,
        line: 1,
        chart: chartName,
        issue: `missing_${file.replace(/[./]/g, '_')}`,
        severity,
        message: `Missing ${file}: ${message}`,
      });
    }
  }

  // Check templates directory exists
  const templatesDir = path.join(chartPath, 'templates');
  if (!fs.existsSync(templatesDir)) {
    violations.push({
      file: `${relPath}/templates`,
      line: 1,
      chart: chartName,
      issue: 'missing_templates_dir',
      severity: 'MEDIUM',
      message: 'Missing templates/ directory',
    });
  } else {
    // Check templates directory is not empty
    const templateFiles = fs.readdirSync(templatesDir).filter(f => f.endsWith('.yaml') || f.endsWith('.yml') || f.endsWith('.tpl'));
    if (templateFiles.length === 0) {
      violations.push({
        file: `${relPath}/templates`,
        line: 1,
        chart: chartName,
        issue: 'empty_templates_dir',
        severity: 'MEDIUM',
        message: 'templates/ directory has no YAML templates',
      });
    }
  }

  // Check for values.schema.json (optional but recommended)
  const schemaPath = path.join(chartPath, 'values.schema.json');
  if (!fs.existsSync(schemaPath)) {
    violations.push({
      file: `${relPath}/values.schema.json`,
      line: 1,
      chart: chartName,
      issue: 'missing_values_schema',
      severity: 'LOW',
      message: 'values.schema.json provides validation for values.yaml',
    });
  } else {
    // Validate JSON schema is valid
    try {
      const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
      JSON.parse(schemaContent);
    } catch (e) {
      violations.push({
        file: `${relPath}/values.schema.json`,
        line: 1,
        chart: chartName,
        issue: 'invalid_values_schema',
        severity: 'MEDIUM',
        message: `values.schema.json is not valid JSON: ${e.message}`,
      });
    }
  }

  // Check README.md content if it exists
  const readmePath = path.join(chartPath, 'README.md');
  if (fs.existsSync(readmePath)) {
    const readmeContent = fs.readFileSync(readmePath, 'utf-8');

    // Check for meaningful content (not just title)
    if (readmeContent.trim().split('\n').length < 5) {
      violations.push({
        file: `${relPath}/README.md`,
        line: 1,
        chart: chartName,
        issue: 'short_readme',
        severity: 'LOW',
        message: 'README.md is very short - add installation and configuration docs',
      });
    }

    // Check for common sections
    const hasInstallation = /install|usage|getting started/i.test(readmeContent);
    const hasConfiguration = /configuration|values|parameters/i.test(readmeContent);

    if (!hasInstallation && !hasConfiguration) {
      violations.push({
        file: `${relPath}/README.md`,
        line: 1,
        chart: chartName,
        issue: 'readme_no_sections',
        severity: 'LOW',
        message: 'README.md should include installation and configuration sections',
      });
    }
  }

  // Check NOTES.txt content if it exists
  const notesPath = path.join(chartPath, 'templates', 'NOTES.txt');
  if (fs.existsSync(notesPath)) {
    const notesContent = fs.readFileSync(notesPath, 'utf-8');

    // Check for meaningful content
    if (notesContent.trim().length < 20) {
      violations.push({
        file: `${relPath}/templates/NOTES.txt`,
        line: 1,
        chart: chartName,
        issue: 'short_notes',
        severity: 'LOW',
        message: 'NOTES.txt is very short - add helpful post-install info',
      });
    }

    // Check for common patterns
    if (!/kubectl|helm|http|port|service/i.test(notesContent)) {
      violations.push({
        file: `${relPath}/templates/NOTES.txt`,
        line: 1,
        chart: chartName,
        issue: 'notes_no_commands',
        severity: 'LOW',
        message: 'NOTES.txt should include example commands for accessing the app',
      });
    }
  }

  // Check for tests directory
  const testsDir = path.join(chartPath, 'templates', 'tests');
  const testFilesInTemplates = fs.existsSync(templatesDir)
    ? fs.readdirSync(templatesDir).filter(f => f.includes('test'))
    : [];

  if (!fs.existsSync(testsDir) && testFilesInTemplates.length === 0) {
    violations.push({
      file: `${relPath}/templates/tests`,
      line: 1,
      chart: chartName,
      issue: 'missing_tests',
      severity: 'LOW',
      message: 'No test templates found - consider adding helm test hooks',
    });
  }

  // Check for crds directory (only if chart uses CRDs)
  const chartYamlPath = path.join(chartPath, 'Chart.yaml');
  if (fs.existsSync(chartYamlPath)) {
    const chartYamlContent = fs.readFileSync(chartYamlPath, 'utf-8');
    // If chart mentions CRD in description or has CRD templates
    const hasCrdMention = /crd|custom\s*resource/i.test(chartYamlContent);
    const crdsDir = path.join(chartPath, 'crds');

    if (hasCrdMention && !fs.existsSync(crdsDir)) {
      violations.push({
        file: `${relPath}/crds`,
        line: 1,
        chart: chartName,
        issue: 'missing_crds_dir',
        severity: 'MEDIUM',
        message: 'Chart mentions CRDs but has no crds/ directory',
      });
    }
  }

  return violations;
}

/**
 * Main check function
 */
function runCheck() {
  console.log('Helm Charts Structure Check');
  console.log('='.repeat(80));
  console.log('');

  const charts = getHelmCharts(helmChartsDir);
  console.log(`Found ${charts.length} Helm charts to scan`);
  console.log('');

  const violations = [];

  for (const chart of charts) {
    violations.push(...checkChartStructure(chart.path, chart.name));
  }

  console.log('Chart Structure Violations');
  console.log('-'.repeat(80));
  console.log('');

  if (violations.length === 0) {
    console.log('✅ All charts have proper structure!');
  } else {
    const high = violations.filter(v => v.severity === 'HIGH').length;
    const medium = violations.filter(v => v.severity === 'MEDIUM').length;
    const low = violations.filter(v => v.severity === 'LOW').length;

    console.log(`❌ Found ${violations.length} structure issue(s) (HIGH: ${high}, MEDIUM: ${medium}, LOW: ${low})`);
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
  console.log(`Structure issues: ${violations.length} violation(s)`);
  console.log('');

  if (violations.length === 0) {
    console.log('✅ All chart structure checks passed!');
  } else {
    console.log('❌ Fix: Ensure each chart has:');
    console.log('  - Chart.yaml');
    console.log('  - values.yaml');
    console.log('  - templates/ directory');
    console.log('  - README.md');
    console.log('  - templates/NOTES.txt');
    console.log('  - templates/_helpers.tpl');
  }

  console.log('');

  // Only return 1 if there are HIGH severity issues
  const hasHighSeverity = violations.some(v => v.severity === 'HIGH');
  return hasHighSeverity ? 1 : 0;
}

const exitCode = runCheck();
process.exit(exitCode);
