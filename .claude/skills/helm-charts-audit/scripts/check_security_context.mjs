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
 * Tracks indentation to find the end of the block
 */
function extractBlock(lines, startLine) {
  const baseIndent = lines[startLine].search(/\S/);
  let block = lines[startLine] + '\n';

  for (let i = startLine + 1; i < lines.length; i++) {
    const line = lines[i];
    // Empty lines or comments continue the block
    if (/^\s*$/.test(line) || /^\s*#/.test(line)) {
      block += line + '\n';
      continue;
    }

    const indent = line.search(/\S/);
    // If we hit a line with same or less indentation, block ended
    if (indent <= baseIndent) break;

    block += line + '\n';
  }

  return block;
}

/**
 * Check security context issues in content
 */
function checkSecurityContext(content, filePath, chartName) {
  const violations = [];
  const lines = content.split('\n');
  const relPath = normalizePath(path.relative(projectRoot, filePath));

  // Track container blocks for security context checks
  let inContainerSpec = false;
  let containerStartLine = 0;
  let hasSecurityContext = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // Skip comments
    if (/^\s*#/.test(line)) continue;

    // Check for privileged: true - CRITICAL
    if (/privileged:\s*true/.test(line)) {
      violations.push({
        file: relPath,
        line: lineNum,
        chart: chartName,
        issue: 'privileged_container',
        severity: 'HIGH',
        message: 'Container runs as privileged - full host access',
      });
    }

    // Check for allowPrivilegeEscalation: true - CRITICAL
    if (/allowPrivilegeEscalation:\s*true/.test(line)) {
      violations.push({
        file: relPath,
        line: lineNum,
        chart: chartName,
        issue: 'privilege_escalation',
        severity: 'HIGH',
        message: 'allowPrivilegeEscalation: true - can gain more privileges than parent',
      });
    }

    // Check for runAsNonRoot: false - CRITICAL
    if (/runAsNonRoot:\s*false/.test(line)) {
      violations.push({
        file: relPath,
        line: lineNum,
        chart: chartName,
        issue: 'runs_as_root',
        severity: 'HIGH',
        message: 'runAsNonRoot: false - container may run as root',
      });
    }

    // Check for hostNetwork: true - CRITICAL
    if (/hostNetwork:\s*true/.test(line)) {
      violations.push({
        file: relPath,
        line: lineNum,
        chart: chartName,
        issue: 'host_network',
        severity: 'HIGH',
        message: 'hostNetwork: true - shares host network namespace',
      });
    }

    // Check for hostPID: true - CRITICAL
    if (/hostPID:\s*true/.test(line)) {
      violations.push({
        file: relPath,
        line: lineNum,
        chart: chartName,
        issue: 'host_pid',
        severity: 'HIGH',
        message: 'hostPID: true - shares host PID namespace',
      });
    }

    // Check for hostIPC: true - CRITICAL
    if (/hostIPC:\s*true/.test(line)) {
      violations.push({
        file: relPath,
        line: lineNum,
        chart: chartName,
        issue: 'host_ipc',
        severity: 'HIGH',
        message: 'hostIPC: true - shares host IPC namespace',
      });
    }

    // Check for readOnlyRootFilesystem: false - MEDIUM
    if (/readOnlyRootFilesystem:\s*false/.test(line)) {
      violations.push({
        file: relPath,
        line: lineNum,
        chart: chartName,
        issue: 'writable_root_fs',
        severity: 'MEDIUM',
        message: 'readOnlyRootFilesystem: false - container can write to root filesystem',
      });
    }

    // Check for capabilities.add containing dangerous capabilities
    if (/capabilities:/.test(line)) {
      const block = extractBlock(lines, i);

      // Check for SYS_ADMIN
      if (/add:[\s\S]*SYS_ADMIN/.test(block)) {
        violations.push({
          file: relPath,
          line: lineNum,
          chart: chartName,
          issue: 'cap_sys_admin',
          severity: 'HIGH',
          message: 'SYS_ADMIN capability added - near root-level access',
        });
      }

      // Check for NET_ADMIN
      if (/add:[\s\S]*NET_ADMIN/.test(block)) {
        violations.push({
          file: relPath,
          line: lineNum,
          chart: chartName,
          issue: 'cap_net_admin',
          severity: 'MEDIUM',
          message: 'NET_ADMIN capability added - can modify network stack',
        });
      }

      // Check for ALL capabilities
      if (/add:[\s\S]*["']?ALL["']?/.test(block)) {
        violations.push({
          file: relPath,
          line: lineNum,
          chart: chartName,
          issue: 'cap_all',
          severity: 'HIGH',
          message: 'ALL capabilities added - equivalent to privileged',
        });
      }

      // Check if capabilities.drop includes ALL (good practice)
      // We don't report this as violation, just note it's missing
    }

    // Check for runAsUser: 0 - running as root
    if (/runAsUser:\s*0\s*$/.test(line)) {
      violations.push({
        file: relPath,
        line: lineNum,
        chart: chartName,
        issue: 'runs_as_uid_0',
        severity: 'HIGH',
        message: 'runAsUser: 0 - container runs as root user',
      });
    }

    // Check for hostPath volumes - security risk
    if (/hostPath:/.test(line)) {
      const nextLine = lines[i + 1] || '';
      // Check what path is being mounted
      const pathMatch = nextLine.match(/path:\s*["']?([^"'\s]+)/);
      if (pathMatch) {
        const hostPath = pathMatch[1];
        // Critical paths
        if (hostPath === '/' || hostPath === '/etc' || hostPath === '/var/run/docker.sock') {
          violations.push({
            file: relPath,
            line: lineNum,
            chart: chartName,
            issue: 'dangerous_host_path',
            severity: 'HIGH',
            message: `Dangerous hostPath mount: ${hostPath}`,
          });
        } else {
          violations.push({
            file: relPath,
            line: lineNum,
            chart: chartName,
            issue: 'host_path_volume',
            severity: 'MEDIUM',
            message: `hostPath volume used: ${hostPath}`,
          });
        }
      }
    }

    // Check for Docker socket mount
    if (/\/var\/run\/docker\.sock/.test(line)) {
      violations.push({
        file: relPath,
        line: lineNum,
        chart: chartName,
        issue: 'docker_socket',
        severity: 'HIGH',
        message: 'Docker socket mounted - container can control Docker daemon',
      });
    }

    // Check for proc mount type
    if (/procMount:\s*["']?Unmasked["']?/.test(line)) {
      violations.push({
        file: relPath,
        line: lineNum,
        chart: chartName,
        issue: 'unmasked_proc',
        severity: 'HIGH',
        message: 'procMount: Unmasked - exposes sensitive /proc entries',
      });
    }

    // Check for seccompProfile type Unconfined
    if (/type:\s*["']?Unconfined["']?/.test(line)) {
      // Check if this is in a seccompProfile context
      const prevLines = lines.slice(Math.max(0, i - 3), i).join('\n');
      if (/seccompProfile/.test(prevLines)) {
        violations.push({
          file: relPath,
          line: lineNum,
          chart: chartName,
          issue: 'seccomp_unconfined',
          severity: 'MEDIUM',
          message: 'seccompProfile: Unconfined - no syscall filtering',
        });
      }
    }
  }

  return violations;
}

/**
 * Main check function
 */
function runCheck() {
  console.log('Helm Charts Security Context Check');
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
      violations.push(...checkSecurityContext(content, valuesFile, chart.name));
    }

    // Check all template files
    const templateFiles = getYamlFiles(chart.path, 'templates');
    for (const file of templateFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      violations.push(...checkSecurityContext(content, file, chart.name));
    }
  }

  console.log('Security Context Violations');
  console.log('-'.repeat(80));
  console.log('');

  if (violations.length === 0) {
    console.log('✅ All security contexts are properly configured!');
  } else {
    const high = violations.filter(v => v.severity === 'HIGH').length;
    const medium = violations.filter(v => v.severity === 'MEDIUM').length;

    console.log(`❌ Found ${violations.length} security context issue(s) (HIGH: ${high}, MEDIUM: ${medium})`);
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
  console.log(`Security context issues: ${violations.length} violation(s)`);
  console.log('');

  if (violations.length === 0) {
    console.log('✅ All security context checks passed!');
  } else {
    console.log('❌ Security context issues found.');
    console.log('');
    console.log('Fix: Add proper securityContext with:');
    console.log('  - runAsNonRoot: true');
    console.log('  - allowPrivilegeEscalation: false');
    console.log('  - readOnlyRootFilesystem: true');
    console.log('  - capabilities.drop: [ALL]');
  }

  console.log('');

  return violations.length > 0 ? 1 : 0;
}

const exitCode = runCheck();
process.exit(exitCode);
