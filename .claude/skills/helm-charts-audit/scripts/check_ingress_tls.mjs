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
 * Check if document is an Ingress
 */
function isIngress(content) {
  return /kind:\s*["']?Ingress["']?/.test(content);
}

/**
 * Check Ingress TLS configuration
 */
function checkIngressTls(content, filePath, chartName) {
  const violations = [];
  const relPath = normalizePath(path.relative(projectRoot, filePath));
  const documents = splitYamlDocuments(content);

  for (const doc of documents) {
    if (!isIngress(doc)) continue;

    const lines = doc.split('\n');
    const docStartLine = content.indexOf(doc);
    const baseLineNum = content.substring(0, docStartLine).split('\n').length;

    // Extract name
    const nameMatch = doc.match(/metadata:[\s\S]*?name:\s*["']?([^"'\s\n]+)["']?/);
    const ingressName = nameMatch ? nameMatch[1] : 'unnamed';

    // Find ingress line
    let ingressLine = baseLineNum;
    for (let i = 0; i < lines.length; i++) {
      if (/kind:\s*["']?Ingress["']?/.test(lines[i])) {
        ingressLine = baseLineNum + i;
        break;
      }
    }

    // Check for TLS section
    const hasTls = /^\s*tls:/m.test(doc);

    // Check if TLS is conditionally included (templated)
    const hasConditionalTls = /\{\{-?\s*if.*\.tls|\{\{-?\s*with.*\.tls/.test(doc);

    if (!hasTls && !hasConditionalTls) {
      // Check if there are hosts defined (not just a wildcard)
      const hasHosts = /hosts:[\s\S]*?-\s*["']?[^"'\s\n]+/.test(doc);

      if (hasHosts) {
        violations.push({
          file: relPath,
          line: ingressLine,
          chart: chartName,
          ingress: ingressName,
          issue: 'no_tls',
          severity: 'MEDIUM',
          message: `Ingress "${ingressName}" has hosts but no TLS configuration - traffic will be unencrypted`,
        });
      }
    }

    // Check TLS configuration
    if (hasTls) {
      // Check for secretName
      const tlsBlock = doc.match(/tls:([\s\S]*?)(?=^\s*[a-z]|\z)/m);
      if (tlsBlock) {
        const tlsContent = tlsBlock[1];

        // Check for secretName in TLS
        const hasSecretName = /secretName:/.test(tlsContent);
        if (!hasSecretName) {
          violations.push({
            file: relPath,
            line: ingressLine,
            chart: chartName,
            ingress: ingressName,
            issue: 'tls_no_secret',
            severity: 'MEDIUM',
            message: `Ingress "${ingressName}" TLS has no secretName - cert must exist or be auto-provisioned`,
          });
        }

        // Check for empty hosts in TLS
        const tlsHosts = tlsContent.match(/hosts:([\s\S]*?)(?=secretName:|$)/);
        if (tlsHosts && !/hosts:[\s\S]*?-/.test(tlsHosts[1])) {
          violations.push({
            file: relPath,
            line: ingressLine,
            chart: chartName,
            ingress: ingressName,
            issue: 'tls_no_hosts',
            severity: 'LOW',
            message: `Ingress "${ingressName}" TLS section has no hosts specified`,
          });
        }
      }
    }

    // Check for cert-manager annotations
    const hasCertManagerAnnotation =
      /cert-manager\.io\/cluster-issuer/.test(doc) ||
      /cert-manager\.io\/issuer/.test(doc) ||
      /kubernetes\.io\/tls-acme/.test(doc) ||
      /certmanager\.k8s\.io/.test(doc);

    // If TLS is configured but no cert-manager
    if (hasTls && !hasCertManagerAnnotation && !hasConditionalTls) {
      violations.push({
        file: relPath,
        line: ingressLine,
        chart: chartName,
        ingress: ingressName,
        issue: 'no_cert_manager',
        severity: 'LOW',
        message: `Ingress "${ingressName}" has TLS but no cert-manager annotation - ensure certificate exists`,
      });
    }

    // Check for deprecated certmanager annotations
    if (/certmanager\.k8s\.io/.test(doc)) {
      violations.push({
        file: relPath,
        line: ingressLine,
        chart: chartName,
        ingress: ingressName,
        issue: 'deprecated_certmanager_annotation',
        severity: 'MEDIUM',
        message: `Ingress "${ingressName}" uses deprecated certmanager.k8s.io annotation - use cert-manager.io`,
      });
    }

    // Check for ingress class
    const hasIngressClass =
      /ingressClassName:/.test(doc) ||
      /kubernetes\.io\/ingress\.class/.test(doc);

    if (!hasIngressClass) {
      violations.push({
        file: relPath,
        line: ingressLine,
        chart: chartName,
        ingress: ingressName,
        issue: 'no_ingress_class',
        severity: 'MEDIUM',
        message: `Ingress "${ingressName}" has no ingressClassName - may use unexpected controller`,
      });
    }

    // Check for deprecated ingress.class annotation
    if (/kubernetes\.io\/ingress\.class/.test(doc) && !/ingressClassName:/.test(doc)) {
      violations.push({
        file: relPath,
        line: ingressLine,
        chart: chartName,
        ingress: ingressName,
        issue: 'deprecated_ingress_class_annotation',
        severity: 'LOW',
        message: `Ingress "${ingressName}" uses deprecated annotation - prefer spec.ingressClassName`,
      });
    }

    // Check for SSL redirect annotation (nginx)
    const hasSslRedirect =
      /nginx\.ingress\.kubernetes\.io\/ssl-redirect/.test(doc) ||
      /nginx\.ingress\.kubernetes\.io\/force-ssl-redirect/.test(doc);

    if (hasTls && !hasSslRedirect) {
      violations.push({
        file: relPath,
        line: ingressLine,
        chart: chartName,
        ingress: ingressName,
        issue: 'no_ssl_redirect',
        severity: 'LOW',
        message: `Ingress "${ingressName}" has TLS but no SSL redirect annotation - HTTP may not redirect to HTTPS`,
      });
    }

    // Check for backend protocol annotation when TLS passthrough is needed
    if (/nginx\.ingress\.kubernetes\.io\/backend-protocol:\s*["']?HTTPS["']?/.test(doc)) {
      // This is fine - backend uses HTTPS
    }

    // Check for wildcard host without TLS
    if (/hosts:[\s\S]*?-\s*["']?\*["']?/.test(doc) && !hasTls) {
      violations.push({
        file: relPath,
        line: ingressLine,
        chart: chartName,
        ingress: ingressName,
        issue: 'wildcard_no_tls',
        severity: 'MEDIUM',
        message: `Ingress "${ingressName}" has wildcard host but no TLS - all traffic unencrypted`,
      });
    }

    // Check for path type (required in networking.k8s.io/v1)
    if (/apiVersion:\s*["']?networking\.k8s\.io\/v1["']?/.test(doc)) {
      if (!/pathType:/.test(doc)) {
        violations.push({
          file: relPath,
          line: ingressLine,
          chart: chartName,
          ingress: ingressName,
          issue: 'no_path_type',
          severity: 'MEDIUM',
          message: `Ingress "${ingressName}" missing pathType - required in networking.k8s.io/v1`,
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
  console.log('Helm Charts Ingress TLS Check');
  console.log('='.repeat(80));
  console.log('');

  const charts = getHelmCharts(helmChartsDir);
  console.log(`Found ${charts.length} Helm charts to scan`);
  console.log('');

  const violations = [];
  let chartsWithIngress = 0;

  for (const chart of charts) {
    let chartHasIngress = false;

    // Check all template files
    const templateFiles = getYamlFiles(chart.path, 'templates');
    for (const file of templateFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      violations.push(...checkIngressTls(content, file, chart.name));

      if (/kind:\s*["']?Ingress["']?/.test(content)) {
        chartHasIngress = true;
      }
    }

    if (chartHasIngress) chartsWithIngress++;
  }

  console.log(`Charts with Ingress: ${chartsWithIngress}`);
  console.log('');
  console.log('Ingress TLS Violations');
  console.log('-'.repeat(80));
  console.log('');

  if (violations.length === 0) {
    if (chartsWithIngress === 0) {
      console.log('No Ingress resources found in charts');
    } else {
      console.log('✅ All Ingress resources are properly configured!');
    }
  } else {
    const high = violations.filter(v => v.severity === 'HIGH').length;
    const medium = violations.filter(v => v.severity === 'MEDIUM').length;
    const low = violations.filter(v => v.severity === 'LOW').length;

    console.log(`❌ Found ${violations.length} Ingress TLS issue(s) (HIGH: ${high}, MEDIUM: ${medium}, LOW: ${low})`);
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
  console.log(`Ingress TLS issues: ${violations.length} violation(s)`);
  console.log('');

  if (violations.length === 0) {
    console.log('✅ All Ingress TLS checks passed!');
  } else {
    console.log('❌ Fix: Ensure Ingress has:');
    console.log('  - TLS section with secretName and hosts');
    console.log('  - cert-manager.io/cluster-issuer annotation for auto certs');
    console.log('  - ingressClassName specified');
    console.log('  - SSL redirect annotation for HTTP->HTTPS');
  }

  console.log('');

  // Only return 1 if there are HIGH severity issues
  const hasHighSeverity = violations.some(v => v.severity === 'HIGH');
  return hasHighSeverity ? 1 : 0;
}

const exitCode = runCheck();
process.exit(exitCode);
