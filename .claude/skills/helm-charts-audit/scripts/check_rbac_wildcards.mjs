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
 * Check if a document is an RBAC resource
 */
function isRbacResource(content) {
  return /kind:\s*["']?(Role|ClusterRole|RoleBinding|ClusterRoleBinding)["']?/.test(content);
}

/**
 * Check RBAC wildcards and overly permissive rules
 */
function checkRbacWildcards(content, filePath, chartName) {
  const violations = [];
  const relPath = normalizePath(path.relative(projectRoot, filePath));
  const documents = splitYamlDocuments(content);

  for (const doc of documents) {
    if (!isRbacResource(doc)) continue;

    const lines = doc.split('\n');
    const docStartLine = content.indexOf(doc);
    const baseLineNum = content.substring(0, docStartLine).split('\n').length;

    // Extract kind for context
    const kindMatch = doc.match(/kind:\s*["']?(\w+)["']?/);
    const kind = kindMatch ? kindMatch[1] : 'Unknown';

    // Extract name
    const nameMatch = doc.match(/name:\s*["']?([^"'\s\n]+)["']?/);
    const resourceName = nameMatch ? nameMatch[1] : 'unnamed';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = baseLineNum + i;

      // Skip comments
      if (/^\s*#/.test(line)) continue;

      // Check for wildcard verbs: ["*"]
      if (/verbs:\s*\[?\s*["']?\*["']?\s*\]?/.test(line) || /verbs:[\s\S]*?-\s*["']?\*["']?/.test(line)) {
        violations.push({
          file: relPath,
          line: lineNum,
          chart: chartName,
          resource: `${kind}/${resourceName}`,
          issue: 'wildcard_verbs',
          severity: 'HIGH',
          message: `Wildcard verbs ["*"] grants all actions - use explicit verbs`,
        });
      }

      // Check for wildcard resources: ["*"]
      if (/resources:\s*\[?\s*["']?\*["']?\s*\]?/.test(line) || /resources:[\s\S]*?-\s*["']?\*["']?/.test(line)) {
        violations.push({
          file: relPath,
          line: lineNum,
          chart: chartName,
          resource: `${kind}/${resourceName}`,
          issue: 'wildcard_resources',
          severity: 'HIGH',
          message: `Wildcard resources ["*"] grants access to all resource types`,
        });
      }

      // Check for wildcard apiGroups: ["*"]
      if (/apiGroups:\s*\[?\s*["']?\*["']?\s*\]?/.test(line) || /apiGroups:[\s\S]*?-\s*["']?\*["']?/.test(line)) {
        violations.push({
          file: relPath,
          line: lineNum,
          chart: chartName,
          resource: `${kind}/${resourceName}`,
          issue: 'wildcard_apigroups',
          severity: 'HIGH',
          message: `Wildcard apiGroups ["*"] grants access across all API groups`,
        });
      }

      // Check for cluster-admin role reference
      if (/roleRef:[\s\S]*?name:\s*["']?cluster-admin["']?/.test(doc)) {
        if (line.includes('cluster-admin')) {
          violations.push({
            file: relPath,
            line: lineNum,
            chart: chartName,
            resource: `${kind}/${resourceName}`,
            issue: 'cluster_admin',
            severity: 'HIGH',
            message: 'Binds to cluster-admin role - grants full cluster access',
          });
        }
      }

      // Check for secrets access
      if (/resources:[\s\S]*?secrets/.test(doc) && /verbs:[\s\S]*?(get|list|watch|\*)/.test(doc)) {
        if (line.includes('secrets')) {
          violations.push({
            file: relPath,
            line: lineNum,
            chart: chartName,
            resource: `${kind}/${resourceName}`,
            issue: 'secrets_access',
            severity: 'MEDIUM',
            message: 'Grants read access to secrets - ensure this is necessary',
          });
        }
      }

      // Check for create/delete on critical resources
      const criticalResources = ['persistentvolumes', 'nodes', 'namespaces', 'clusterroles', 'clusterrolebindings'];
      for (const critical of criticalResources) {
        if (doc.includes(critical) && /verbs:[\s\S]*?(create|delete|\*)/.test(doc)) {
          if (line.includes(critical)) {
            violations.push({
              file: relPath,
              line: lineNum,
              chart: chartName,
              resource: `${kind}/${resourceName}`,
              issue: `critical_resource_${critical}`,
              severity: 'MEDIUM',
              message: `Create/delete on ${critical} - high privilege operation`,
            });
          }
        }
      }

      // Check for impersonate permissions
      if (/verbs:[\s\S]*?impersonate/.test(doc)) {
        if (line.includes('impersonate')) {
          violations.push({
            file: relPath,
            line: lineNum,
            chart: chartName,
            resource: `${kind}/${resourceName}`,
            issue: 'impersonate_permission',
            severity: 'HIGH',
            message: 'Impersonate permission - can act as other users/groups',
          });
        }
      }

      // Check for escalate/bind permissions
      if (/verbs:[\s\S]*?(escalate|bind)/.test(doc)) {
        if (line.includes('escalate') || line.includes('bind')) {
          violations.push({
            file: relPath,
            line: lineNum,
            chart: chartName,
            resource: `${kind}/${resourceName}`,
            issue: 'escalate_bind_permission',
            severity: 'HIGH',
            message: 'Escalate/bind permission - can grant additional privileges',
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
  console.log('Helm Charts RBAC Wildcards Check');
  console.log('='.repeat(80));
  console.log('');

  const charts = getHelmCharts(helmChartsDir);
  console.log(`Found ${charts.length} Helm charts to scan`);
  console.log('');

  const violations = [];

  for (const chart of charts) {
    // Check all template files (RBAC is usually in templates)
    const templateFiles = getYamlFiles(chart.path, 'templates');
    for (const file of templateFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      violations.push(...checkRbacWildcards(content, file, chart.name));
    }
  }

  console.log('RBAC Wildcards Violations');
  console.log('-'.repeat(80));
  console.log('');

  if (violations.length === 0) {
    console.log('✅ No RBAC wildcard issues found!');
  } else {
    const high = violations.filter(v => v.severity === 'HIGH').length;
    const medium = violations.filter(v => v.severity === 'MEDIUM').length;

    console.log(`❌ Found ${violations.length} RBAC issue(s) (HIGH: ${high}, MEDIUM: ${medium})`);
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
  console.log(`RBAC wildcard issues: ${violations.length} violation(s)`);
  console.log('');

  if (violations.length === 0) {
    console.log('✅ All RBAC checks passed!');
  } else {
    console.log('❌ RBAC wildcard issues found.');
    console.log('');
    console.log('Fix: Use principle of least privilege:');
    console.log('  - List explicit verbs: [get, list, watch] instead of ["*"]');
    console.log('  - List explicit resources: [pods, services] instead of ["*"]');
    console.log('  - Avoid cluster-admin bindings');
  }

  console.log('');

  return violations.length > 0 ? 1 : 0;
}

const exitCode = runCheck();
process.exit(exitCode);
