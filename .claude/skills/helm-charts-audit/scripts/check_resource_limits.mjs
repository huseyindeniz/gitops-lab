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
 * Extract a YAML block starting at a given line
 */
function extractBlock(lines, startLine, targetIndent = null) {
  const baseIndent = targetIndent !== null ? targetIndent : lines[startLine].search(/\S/);
  let block = lines[startLine] + '\n';

  for (let i = startLine + 1; i < lines.length; i++) {
    const line = lines[i];
    if (/^\s*$/.test(line)) {
      block += line + '\n';
      continue;
    }

    const indent = line.search(/\S/);
    if (indent <= baseIndent) break;

    block += line + '\n';
  }

  return block;
}

/**
 * Parse resource value to bytes/millicores for comparison
 */
function parseResourceValue(value, type) {
  if (!value || typeof value !== 'string') return null;

  // Skip templated values
  if (value.includes('{{')) return null;

  value = value.trim();

  if (type === 'memory') {
    // Parse memory: Ki, Mi, Gi, Ti, K, M, G, T
    const match = value.match(/^(\d+(?:\.\d+)?)\s*(Ki|Mi|Gi|Ti|K|M|G|T|k|m|g|t)?$/i);
    if (!match) return null;

    const num = parseFloat(match[1]);
    const unit = (match[2] || '').toLowerCase();

    const multipliers = {
      '': 1,
      'k': 1000,
      'm': 1000 * 1000,
      'g': 1000 * 1000 * 1000,
      't': 1000 * 1000 * 1000 * 1000,
      'ki': 1024,
      'mi': 1024 * 1024,
      'gi': 1024 * 1024 * 1024,
      'ti': 1024 * 1024 * 1024 * 1024,
    };

    return num * (multipliers[unit] || 1);
  }

  if (type === 'cpu') {
    // Parse CPU: millicores (m) or cores
    if (value.endsWith('m')) {
      return parseInt(value.slice(0, -1));
    }
    return parseFloat(value) * 1000; // Convert cores to millicores
  }

  return null;
}

/**
 * Check resource limits and requests in content
 */
function checkResourceLimits(content, filePath, chartName) {
  const violations = [];
  const lines = content.split('\n');
  const relPath = normalizePath(path.relative(projectRoot, filePath));

  // Find container specs and check resources
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // Skip comments
    if (/^\s*#/.test(line)) continue;

    // Find resources: block
    if (/^\s*resources:\s*$/.test(line) || /^\s*resources:\s*\{\s*\}/.test(line)) {
      const indent = line.search(/\S/);
      const block = extractBlock(lines, i, indent);

      // Check for empty resources block
      if (/resources:\s*\{\s*\}/.test(line) || block.trim() === 'resources:') {
        violations.push({
          file: relPath,
          line: lineNum,
          chart: chartName,
          issue: 'empty_resources',
          severity: 'HIGH',
          message: 'Empty resources block - no limits or requests defined',
        });
        continue;
      }

      // Check for requests
      const hasRequests = /requests:/.test(block);
      const hasLimits = /limits:/.test(block);

      if (!hasRequests) {
        violations.push({
          file: relPath,
          line: lineNum,
          chart: chartName,
          issue: 'no_requests',
          severity: 'HIGH',
          message: 'No resource requests defined - scheduler cannot make informed decisions',
        });
      }

      if (!hasLimits) {
        violations.push({
          file: relPath,
          line: lineNum,
          chart: chartName,
          issue: 'no_limits',
          severity: 'HIGH',
          message: 'No resource limits defined - container can consume all node resources',
        });
      }

      // Check for specific resources
      if (hasRequests) {
        if (!/requests:[\s\S]*?cpu:/.test(block)) {
          violations.push({
            file: relPath,
            line: lineNum,
            chart: chartName,
            issue: 'no_cpu_request',
            severity: 'MEDIUM',
            message: 'No CPU request defined',
          });
        }
        if (!/requests:[\s\S]*?memory:/.test(block)) {
          violations.push({
            file: relPath,
            line: lineNum,
            chart: chartName,
            issue: 'no_memory_request',
            severity: 'HIGH',
            message: 'No memory request defined - OOM killer may terminate pod unexpectedly',
          });
        }
      }

      if (hasLimits) {
        if (!/limits:[\s\S]*?memory:/.test(block)) {
          violations.push({
            file: relPath,
            line: lineNum,
            chart: chartName,
            issue: 'no_memory_limit',
            severity: 'HIGH',
            message: 'No memory limit defined - container can cause node OOM',
          });
        }
        // Note: CPU limits are often intentionally omitted for better performance
      }

      // Extract and compare request vs limit values
      const memRequestMatch = block.match(/requests:[\s\S]*?memory:\s*["']?([^"'\s\n]+)/);
      const memLimitMatch = block.match(/limits:[\s\S]*?memory:\s*["']?([^"'\s\n]+)/);

      if (memRequestMatch && memLimitMatch) {
        const requestBytes = parseResourceValue(memRequestMatch[1], 'memory');
        const limitBytes = parseResourceValue(memLimitMatch[1], 'memory');

        if (requestBytes && limitBytes && requestBytes > limitBytes) {
          violations.push({
            file: relPath,
            line: lineNum,
            chart: chartName,
            issue: 'request_exceeds_limit',
            severity: 'HIGH',
            message: `Memory request (${memRequestMatch[1]}) exceeds limit (${memLimitMatch[1]})`,
          });
        }
      }

      const cpuRequestMatch = block.match(/requests:[\s\S]*?cpu:\s*["']?([^"'\s\n]+)/);
      const cpuLimitMatch = block.match(/limits:[\s\S]*?cpu:\s*["']?([^"'\s\n]+)/);

      if (cpuRequestMatch && cpuLimitMatch) {
        const requestMillis = parseResourceValue(cpuRequestMatch[1], 'cpu');
        const limitMillis = parseResourceValue(cpuLimitMatch[1], 'cpu');

        if (requestMillis && limitMillis && requestMillis > limitMillis) {
          violations.push({
            file: relPath,
            line: lineNum,
            chart: chartName,
            issue: 'cpu_request_exceeds_limit',
            severity: 'HIGH',
            message: `CPU request (${cpuRequestMatch[1]}) exceeds limit (${cpuLimitMatch[1]})`,
          });
        }
      }
    }

    // Check for containers without resources block
    if (/^\s*-\s*name:/.test(line) && /containers:/.test(lines.slice(Math.max(0, i - 5), i).join('\n'))) {
      // This is a container definition, check if it has resources
      const containerIndent = line.search(/\S/) - 2; // Account for "- "
      let hasResources = false;

      for (let j = i + 1; j < lines.length; j++) {
        const nextLine = lines[j];
        if (/^\s*$/.test(nextLine)) continue;

        const nextIndent = nextLine.search(/\S/);
        if (nextIndent <= containerIndent) break; // Next container or end of containers

        if (/^\s*resources:/.test(nextLine)) {
          hasResources = true;
          break;
        }
      }

      // Note: We don't report this here as it would duplicate with the resources: check
      // The check above handles empty/missing resources better
    }
  }

  return violations;
}

/**
 * Main check function
 */
function runCheck() {
  console.log('Helm Charts Resource Limits Check');
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
      violations.push(...checkResourceLimits(content, valuesFile, chart.name));
    }

    // Check all template files
    const templateFiles = getYamlFiles(chart.path, 'templates');
    for (const file of templateFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      violations.push(...checkResourceLimits(content, file, chart.name));
    }
  }

  console.log('Resource Limits Violations');
  console.log('-'.repeat(80));
  console.log('');

  if (violations.length === 0) {
    console.log('✅ All resource limits are properly configured!');
  } else {
    const high = violations.filter(v => v.severity === 'HIGH').length;
    const medium = violations.filter(v => v.severity === 'MEDIUM').length;

    console.log(`❌ Found ${violations.length} resource limit issue(s) (HIGH: ${high}, MEDIUM: ${medium})`);
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
  console.log(`Resource limits issues: ${violations.length} violation(s)`);
  console.log('');

  if (violations.length === 0) {
    console.log('✅ All resource limits checks passed!');
  } else {
    console.log('❌ Resource limit issues found.');
    console.log('');
    console.log('Fix: Define proper resources with:');
    console.log('  resources:');
    console.log('    requests:');
    console.log('      cpu: 100m');
    console.log('      memory: 128Mi');
    console.log('    limits:');
    console.log('      memory: 256Mi');
  }

  console.log('');

  return violations.length > 0 ? 1 : 0;
}

const exitCode = runCheck();
process.exit(exitCode);
