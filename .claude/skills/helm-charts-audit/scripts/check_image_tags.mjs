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

/**
 * Get all Helm chart directories
 */
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
 * Get all YAML files in a chart
 */
function getYamlFiles(chartPath, subdir = '') {
  const files = [];
  const searchDir = subdir ? path.join(chartPath, subdir) : chartPath;

  if (!fs.existsSync(searchDir)) return files;

  const items = fs.readdirSync(searchDir);

  for (const item of items) {
    const fullPath = path.join(searchDir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      files.push(...getYamlFiles(chartPath, path.join(subdir, item)));
    } else if (item.endsWith('.yaml') || item.endsWith('.yml')) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Mutable/dangerous image tags that should never be used in production
 * VALUE-BASED detection - we look at actual tag values
 */
const dangerousTags = [
  'latest',
  'head',
  'master',
  'main',
  'develop',
  'dev',
  'staging',
  'canary',
  'edge',
  'nightly',
  'snapshot',
  'unstable',
  'beta',
  'alpha',
  'rc',
  'test',
  'debug',
];

/**
 * Check for dangerous image tags in content
 * VALUE-BASED: Look at actual tag values, not field names
 */
function checkImageTags(content, filePath, chartName) {
  const violations = [];
  const lines = content.split('\n');
  const relPath = normalizePath(path.relative(projectRoot, filePath));

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // Skip comments
    if (/^\s*#/.test(line)) continue;

    // Pattern 1: image: "repo:tag" or image: repo:tag
    const imageMatch = line.match(/image:\s*["']?([^"'\s]+)["']?/);
    if (imageMatch) {
      const imageValue = imageMatch[1];

      // Check for no tag specified (defaults to latest)
      if (!imageValue.includes(':') && !imageValue.includes('{{')) {
        violations.push({
          file: relPath,
          line: lineNum,
          chart: chartName,
          issue: 'no_tag',
          severity: 'HIGH',
          message: `Image "${imageValue}" has no tag (defaults to :latest)`,
        });
        continue;
      }

      // Extract tag from image:tag
      const tagMatch = imageValue.match(/:([^/]+)$/);
      if (tagMatch) {
        const tag = tagMatch[1];

        // Skip templated tags (they're configurable)
        if (tag.includes('{{')) continue;

        // Check for dangerous tags
        const lowerTag = tag.toLowerCase();
        for (const dangerous of dangerousTags) {
          if (lowerTag === dangerous || lowerTag.startsWith(dangerous + '-') || lowerTag.endsWith('-' + dangerous)) {
            violations.push({
              file: relPath,
              line: lineNum,
              chart: chartName,
              issue: 'mutable_tag',
              severity: 'HIGH',
              message: `Mutable tag ":${tag}" found - use immutable tags (SemVer or SHA)`,
            });
            break;
          }
        }
      }
    }

    // Pattern 2: tag: "value" in values.yaml
    const tagFieldMatch = line.match(/^\s*tag:\s*["']?([^"'\s#]+)["']?/);
    if (tagFieldMatch) {
      const tag = tagFieldMatch[1];

      // Skip templated values
      if (tag.includes('{{') || tag.includes('$')) continue;

      // Skip empty values (will be overridden)
      if (!tag || tag === '""' || tag === "''") continue;

      const lowerTag = tag.toLowerCase();
      for (const dangerous of dangerousTags) {
        if (lowerTag === dangerous || lowerTag.startsWith(dangerous + '-') || lowerTag.endsWith('-' + dangerous)) {
          violations.push({
            file: relPath,
            line: lineNum,
            chart: chartName,
            issue: 'mutable_tag_default',
            severity: 'HIGH',
            message: `Mutable default tag "${tag}" in values - use immutable tags`,
          });
          break;
        }
      }
    }

    // Pattern 3: Check for empty tag fields
    if (/^\s*tag:\s*(["']\s*["']|\s*)$/.test(line)) {
      violations.push({
        file: relPath,
        line: lineNum,
        chart: chartName,
        issue: 'empty_tag',
        severity: 'MEDIUM',
        message: 'Empty tag field - ensure a valid tag is provided at deploy time',
      });
    }
  }

  return violations;
}

/**
 * Main check function
 */
function runCheck() {
  console.log('Helm Charts Image Tags Check');
  console.log('='.repeat(80));
  console.log('');

  const charts = getHelmCharts(helmChartsDir);
  console.log(`Found ${charts.length} Helm charts to scan`);
  console.log('');

  const violations = [];

  for (const chart of charts) {
    // Check values.yaml
    const valuesFile = path.join(chart.path, 'values.yaml');
    if (fs.existsSync(valuesFile)) {
      const content = fs.readFileSync(valuesFile, 'utf-8');
      violations.push(...checkImageTags(content, valuesFile, chart.name));
    }

    // Check all template files
    const templateFiles = getYamlFiles(chart.path, 'templates');
    for (const file of templateFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      violations.push(...checkImageTags(content, file, chart.name));
    }
  }

  console.log('Image Tags Violations');
  console.log('-'.repeat(80));
  console.log('');

  if (violations.length === 0) {
    console.log('✅ All image tags are valid!');
  } else {
    const high = violations.filter(v => v.severity === 'HIGH').length;
    const medium = violations.filter(v => v.severity === 'MEDIUM').length;

    console.log(`❌ Found ${violations.length} image tag issue(s) (HIGH: ${high}, MEDIUM: ${medium})`);
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
        console.log(`     Line ${v.line}: [${v.severity}] ${v.message}`);
      }
      console.log('');
    }
  }

  console.log('='.repeat(80));
  console.log('Summary');
  console.log('');
  console.log(`Image tag issues: ${violations.length} violation(s)`);
  console.log('');

  if (violations.length === 0) {
    console.log('✅ All image tags checks passed!');
  } else {
    console.log('❌ Image tag issues found.');
    console.log('');
    console.log('Fix: Use immutable tags (SemVer like v1.2.3 or SHA digests)');
  }

  console.log('');

  return violations.length > 0 ? 1 : 0;
}

const exitCode = runCheck();
process.exit(exitCode);
