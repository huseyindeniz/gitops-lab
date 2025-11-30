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
 * Split content into multiple YAML documents
 */
function splitYamlDocuments(content) {
  return content.split(/^---\s*$/m).filter(doc => doc.trim());
}

/**
 * Check if document is a workload resource (Deployment, StatefulSet, etc.)
 */
function isWorkloadResource(content) {
  return /kind:\s*["']?(Deployment|StatefulSet|DaemonSet|ReplicaSet|Job|CronJob)["']?/.test(content);
}

/**
 * Check health probe configuration
 */
function checkHealthProbes(content, filePath, chartName) {
  const violations = [];
  const relPath = normalizePath(path.relative(projectRoot, filePath));
  const documents = splitYamlDocuments(content);

  for (const doc of documents) {
    if (!isWorkloadResource(doc)) continue;

    const lines = doc.split('\n');
    const docStartLine = content.indexOf(doc);
    const baseLineNum = content.substring(0, docStartLine).split('\n').length;

    // Extract kind
    const kindMatch = doc.match(/kind:\s*["']?(\w+)["']?/);
    const kind = kindMatch ? kindMatch[1] : 'Unknown';

    // Skip Jobs and CronJobs - probes don't apply
    if (kind === 'Job' || kind === 'CronJob') continue;

    // Extract name
    const nameMatch = doc.match(/metadata:[\s\S]*?name:\s*["']?([^"'\s\n]+)["']?/);
    const resourceName = nameMatch ? nameMatch[1] : 'unnamed';

    // Find the line where the resource is defined
    let resourceLine = baseLineNum;
    for (let i = 0; i < lines.length; i++) {
      if (/kind:\s*["']?(Deployment|StatefulSet|DaemonSet|ReplicaSet)["']?/.test(lines[i])) {
        resourceLine = baseLineNum + i;
        break;
      }
    }

    // Check for livenessProbe
    const hasLivenessProbe = /livenessProbe:/.test(doc);
    // Check for readinessProbe
    const hasReadinessProbe = /readinessProbe:/.test(doc);
    // Check for startupProbe
    const hasStartupProbe = /startupProbe:/.test(doc);

    // Skip if probes are conditionally included (templated)
    const hasConditionalProbes = /\{\{-?\s*if.*[Pp]robe/.test(doc);

    if (!hasLivenessProbe && !hasConditionalProbes) {
      violations.push({
        file: relPath,
        line: resourceLine,
        chart: chartName,
        resource: `${kind}/${resourceName}`,
        issue: 'no_liveness_probe',
        severity: 'HIGH',
        message: 'No livenessProbe defined - stuck containers won\'t be restarted',
      });
    }

    if (!hasReadinessProbe && !hasConditionalProbes) {
      violations.push({
        file: relPath,
        line: resourceLine,
        chart: chartName,
        resource: `${kind}/${resourceName}`,
        issue: 'no_readiness_probe',
        severity: 'HIGH',
        message: 'No readinessProbe defined - traffic may be sent to unready pods',
      });
    }

    // Check probe configurations
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = baseLineNum + i;

      // Check for initialDelaySeconds = 0 (too aggressive)
      if (/initialDelaySeconds:\s*0\s*$/.test(line)) {
        violations.push({
          file: relPath,
          line: lineNum,
          chart: chartName,
          resource: `${kind}/${resourceName}`,
          issue: 'zero_initial_delay',
          severity: 'MEDIUM',
          message: 'initialDelaySeconds: 0 - may cause unnecessary restarts during startup',
        });
      }

      // Check for very short timeoutSeconds (less than 2)
      const timeoutMatch = line.match(/timeoutSeconds:\s*(\d+)/);
      if (timeoutMatch && parseInt(timeoutMatch[1]) < 2) {
        violations.push({
          file: relPath,
          line: lineNum,
          chart: chartName,
          resource: `${kind}/${resourceName}`,
          issue: 'short_timeout',
          severity: 'MEDIUM',
          message: `timeoutSeconds: ${timeoutMatch[1]} - very short, may cause false failures`,
        });
      }

      // Check for successThreshold > 1 on livenessProbe (not recommended)
      if (/successThreshold:\s*([2-9]|\d{2,})/.test(line)) {
        // Check if we're in a livenessProbe context
        const prevLines = lines.slice(Math.max(0, i - 10), i).join('\n');
        if (/livenessProbe:/.test(prevLines) && !/readinessProbe:/.test(prevLines.split('livenessProbe:')[1] || '')) {
          const thresholdMatch = line.match(/successThreshold:\s*(\d+)/);
          violations.push({
            file: relPath,
            line: lineNum,
            chart: chartName,
            resource: `${kind}/${resourceName}`,
            issue: 'liveness_success_threshold',
            severity: 'MEDIUM',
            message: `livenessProbe successThreshold: ${thresholdMatch[1]} - should be 1 for liveness`,
          });
        }
      }

      // Check for very high failureThreshold on readinessProbe
      const failureMatch = line.match(/failureThreshold:\s*(\d+)/);
      if (failureMatch && parseInt(failureMatch[1]) > 10) {
        violations.push({
          file: relPath,
          line: lineNum,
          chart: chartName,
          resource: `${kind}/${resourceName}`,
          issue: 'high_failure_threshold',
          severity: 'LOW',
          message: `failureThreshold: ${failureMatch[1]} - very high, may delay detecting failures`,
        });
      }

      // Check for periodSeconds longer than timeoutSeconds (inefficient)
      if (/periodSeconds:/.test(line)) {
        const periodMatch = line.match(/periodSeconds:\s*(\d+)/);
        if (periodMatch) {
          // Look for nearby timeoutSeconds
          const nearbyLines = lines.slice(Math.max(0, i - 5), Math.min(lines.length, i + 5)).join('\n');
          const nearbyTimeoutMatch = nearbyLines.match(/timeoutSeconds:\s*(\d+)/);
          if (nearbyTimeoutMatch) {
            const period = parseInt(periodMatch[1]);
            const timeout = parseInt(nearbyTimeoutMatch[1]);
            if (timeout >= period) {
              violations.push({
                file: relPath,
                line: lineNum,
                chart: chartName,
                resource: `${kind}/${resourceName}`,
                issue: 'timeout_exceeds_period',
                severity: 'MEDIUM',
                message: `timeoutSeconds (${timeout}) >= periodSeconds (${period}) - probes may overlap`,
              });
            }
          }
        }
      }

      // Check for exec probes with complex commands (potential issues)
      if (/exec:/.test(line)) {
        const execBlock = lines.slice(i, Math.min(i + 10, lines.length)).join('\n');
        if (/command:[\s\S]*?(curl|wget|nc|netcat)/i.test(execBlock)) {
          violations.push({
            file: relPath,
            line: lineNum,
            chart: chartName,
            resource: `${kind}/${resourceName}`,
            issue: 'exec_with_network',
            severity: 'LOW',
            message: 'exec probe uses network tools - consider using httpGet or tcpSocket instead',
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
  console.log('Helm Charts Health Probes Check');
  console.log('='.repeat(80));
  console.log('');

  const charts = getHelmCharts(helmChartsDir);
  console.log(`Found ${charts.length} Helm charts to scan`);
  console.log('');

  const violations = [];

  for (const chart of charts) {
    // Check all template files
    const templateFiles = getYamlFiles(chart.path, 'templates');
    for (const file of templateFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      violations.push(...checkHealthProbes(content, file, chart.name));
    }
  }

  console.log('Health Probes Violations');
  console.log('-'.repeat(80));
  console.log('');

  if (violations.length === 0) {
    console.log('✅ All health probes are properly configured!');
  } else {
    const high = violations.filter(v => v.severity === 'HIGH').length;
    const medium = violations.filter(v => v.severity === 'MEDIUM').length;
    const low = violations.filter(v => v.severity === 'LOW').length;

    console.log(`❌ Found ${violations.length} health probe issue(s) (HIGH: ${high}, MEDIUM: ${medium}, LOW: ${low})`);
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
        console.log(`     Line ${v.line}: [${v.severity}] ${v.resource} - ${v.message}`);
      }
      console.log('');
    }
  }

  console.log('='.repeat(80));
  console.log('Summary');
  console.log('');
  console.log(`Health probe issues: ${violations.length} violation(s)`);
  console.log('');

  if (violations.length === 0) {
    console.log('✅ All health probe checks passed!');
  } else {
    console.log('❌ Health probe issues found.');
    console.log('');
    console.log('Fix: Add proper health probes:');
    console.log('  livenessProbe:');
    console.log('    httpGet:');
    console.log('      path: /healthz');
    console.log('      port: 8080');
    console.log('    initialDelaySeconds: 10');
    console.log('    periodSeconds: 10');
    console.log('  readinessProbe:');
    console.log('    httpGet:');
    console.log('      path: /ready');
    console.log('      port: 8080');
    console.log('    initialDelaySeconds: 5');
    console.log('    periodSeconds: 5');
  }

  console.log('');

  return violations.length > 0 ? 1 : 0;
}

const exitCode = runCheck();
process.exit(exitCode);
