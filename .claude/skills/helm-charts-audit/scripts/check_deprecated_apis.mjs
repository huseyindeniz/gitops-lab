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
 * Deprecated Kubernetes API versions
 * Based on Kubernetes deprecation policy and removal schedule
 */
const deprecatedApis = [
  // Extensions v1beta1 - removed in 1.22
  {
    pattern: /apiVersion:\s*["']?extensions\/v1beta1["']?/,
    kind: /kind:\s*["']?(Deployment|DaemonSet|ReplicaSet|Ingress|NetworkPolicy|PodSecurityPolicy)["']?/,
    replacement: 'apps/v1 or networking.k8s.io/v1',
    removedIn: '1.22',
    severity: 'HIGH',
  },

  // Apps v1beta1 - removed in 1.16
  {
    pattern: /apiVersion:\s*["']?apps\/v1beta1["']?/,
    kind: /kind:\s*["']?(Deployment|StatefulSet|ReplicaSet)["']?/,
    replacement: 'apps/v1',
    removedIn: '1.16',
    severity: 'HIGH',
  },

  // Apps v1beta2 - removed in 1.16
  {
    pattern: /apiVersion:\s*["']?apps\/v1beta2["']?/,
    kind: /kind:\s*["']?(Deployment|StatefulSet|DaemonSet|ReplicaSet)["']?/,
    replacement: 'apps/v1',
    removedIn: '1.16',
    severity: 'HIGH',
  },

  // Networking v1beta1 Ingress - removed in 1.22
  {
    pattern: /apiVersion:\s*["']?networking\.k8s\.io\/v1beta1["']?/,
    kind: /kind:\s*["']?Ingress["']?/,
    replacement: 'networking.k8s.io/v1',
    removedIn: '1.22',
    severity: 'HIGH',
  },

  // Networking v1beta1 IngressClass - removed in 1.22
  {
    pattern: /apiVersion:\s*["']?networking\.k8s\.io\/v1beta1["']?/,
    kind: /kind:\s*["']?IngressClass["']?/,
    replacement: 'networking.k8s.io/v1',
    removedIn: '1.22',
    severity: 'HIGH',
  },

  // RBAC v1beta1 - removed in 1.22
  {
    pattern: /apiVersion:\s*["']?rbac\.authorization\.k8s\.io\/v1beta1["']?/,
    kind: /kind:\s*["']?(Role|ClusterRole|RoleBinding|ClusterRoleBinding)["']?/,
    replacement: 'rbac.authorization.k8s.io/v1',
    removedIn: '1.22',
    severity: 'HIGH',
  },

  // Certificates v1beta1 - removed in 1.22
  {
    pattern: /apiVersion:\s*["']?certificates\.k8s\.io\/v1beta1["']?/,
    kind: /kind:\s*["']?CertificateSigningRequest["']?/,
    replacement: 'certificates.k8s.io/v1',
    removedIn: '1.22',
    severity: 'HIGH',
  },

  // Coordination v1beta1 - removed in 1.22
  {
    pattern: /apiVersion:\s*["']?coordination\.k8s\.io\/v1beta1["']?/,
    kind: /kind:\s*["']?Lease["']?/,
    replacement: 'coordination.k8s.io/v1',
    removedIn: '1.22',
    severity: 'HIGH',
  },

  // Admission v1beta1 - removed in 1.22
  {
    pattern: /apiVersion:\s*["']?admissionregistration\.k8s\.io\/v1beta1["']?/,
    kind: /kind:\s*["']?(ValidatingWebhookConfiguration|MutatingWebhookConfiguration)["']?/,
    replacement: 'admissionregistration.k8s.io/v1',
    removedIn: '1.22',
    severity: 'HIGH',
  },

  // APIextensions v1beta1 - removed in 1.22
  {
    pattern: /apiVersion:\s*["']?apiextensions\.k8s\.io\/v1beta1["']?/,
    kind: /kind:\s*["']?CustomResourceDefinition["']?/,
    replacement: 'apiextensions.k8s.io/v1',
    removedIn: '1.22',
    severity: 'HIGH',
  },

  // Scheduling v1beta1 - removed in 1.22
  {
    pattern: /apiVersion:\s*["']?scheduling\.k8s\.io\/v1beta1["']?/,
    kind: /kind:\s*["']?PriorityClass["']?/,
    replacement: 'scheduling.k8s.io/v1',
    removedIn: '1.22',
    severity: 'HIGH',
  },

  // Storage v1beta1 CSIDriver/CSINode - removed in 1.22
  {
    pattern: /apiVersion:\s*["']?storage\.k8s\.io\/v1beta1["']?/,
    kind: /kind:\s*["']?(CSIDriver|CSINode|StorageClass|VolumeAttachment)["']?/,
    replacement: 'storage.k8s.io/v1',
    removedIn: '1.22',
    severity: 'HIGH',
  },

  // Batch v1beta1 CronJob - removed in 1.25
  {
    pattern: /apiVersion:\s*["']?batch\/v1beta1["']?/,
    kind: /kind:\s*["']?CronJob["']?/,
    replacement: 'batch/v1',
    removedIn: '1.25',
    severity: 'HIGH',
  },

  // Discovery v1beta1 - removed in 1.25
  {
    pattern: /apiVersion:\s*["']?discovery\.k8s\.io\/v1beta1["']?/,
    kind: /kind:\s*["']?EndpointSlice["']?/,
    replacement: 'discovery.k8s.io/v1',
    removedIn: '1.25',
    severity: 'HIGH',
  },

  // Events v1beta1 - removed in 1.25
  {
    pattern: /apiVersion:\s*["']?events\.k8s\.io\/v1beta1["']?/,
    kind: /kind:\s*["']?Event["']?/,
    replacement: 'events.k8s.io/v1',
    removedIn: '1.25',
    severity: 'HIGH',
  },

  // Autoscaling v2beta1 - deprecated, v2 is stable
  {
    pattern: /apiVersion:\s*["']?autoscaling\/v2beta1["']?/,
    kind: /kind:\s*["']?HorizontalPodAutoscaler["']?/,
    replacement: 'autoscaling/v2',
    removedIn: '1.25',
    severity: 'HIGH',
  },

  // Autoscaling v2beta2 - deprecated, v2 is stable
  {
    pattern: /apiVersion:\s*["']?autoscaling\/v2beta2["']?/,
    kind: /kind:\s*["']?HorizontalPodAutoscaler["']?/,
    replacement: 'autoscaling/v2',
    removedIn: '1.26',
    severity: 'HIGH',
  },

  // PodSecurityPolicy - removed in 1.25
  {
    pattern: /apiVersion:\s*["']?policy\/v1beta1["']?/,
    kind: /kind:\s*["']?PodSecurityPolicy["']?/,
    replacement: 'Use Pod Security Admission instead',
    removedIn: '1.25',
    severity: 'HIGH',
  },

  // PodDisruptionBudget v1beta1 - removed in 1.25
  {
    pattern: /apiVersion:\s*["']?policy\/v1beta1["']?/,
    kind: /kind:\s*["']?PodDisruptionBudget["']?/,
    replacement: 'policy/v1',
    removedIn: '1.25',
    severity: 'HIGH',
  },

  // FlowSchema/PriorityLevelConfiguration v1beta1 - deprecated
  {
    pattern: /apiVersion:\s*["']?flowcontrol\.apiserver\.k8s\.io\/v1beta1["']?/,
    kind: /kind:\s*["']?(FlowSchema|PriorityLevelConfiguration)["']?/,
    replacement: 'flowcontrol.apiserver.k8s.io/v1beta3 or v1',
    removedIn: '1.29',
    severity: 'MEDIUM',
  },

  // HorizontalPodAutoscaler v1 - still works but v2 is recommended
  {
    pattern: /apiVersion:\s*["']?autoscaling\/v1["']?/,
    kind: /kind:\s*["']?HorizontalPodAutoscaler["']?/,
    replacement: 'autoscaling/v2 for extended metrics',
    removedIn: 'N/A (limited features)',
    severity: 'LOW',
  },
];

/**
 * Split content into multiple YAML documents
 */
function splitYamlDocuments(content) {
  return content.split(/^---\s*$/m).filter(doc => doc.trim());
}

/**
 * Check for deprecated APIs in content
 */
function checkDeprecatedApis(content, filePath, chartName) {
  const violations = [];
  const relPath = normalizePath(path.relative(projectRoot, filePath));
  const documents = splitYamlDocuments(content);

  for (const doc of documents) {
    const lines = doc.split('\n');
    const docStartLine = content.indexOf(doc);
    const baseLineNum = content.substring(0, docStartLine).split('\n').length;

    // Extract the kind for context
    const kindMatch = doc.match(/kind:\s*["']?([^"'\s\n]+)["']?/);
    const kind = kindMatch ? kindMatch[1] : 'unknown';

    for (const deprecated of deprecatedApis) {
      // Match the pattern against each line individually
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Check if this line contains the deprecated apiVersion
        if (deprecated.pattern.test(line)) {
          // Also verify the kind matches somewhere in the document
          if (!deprecated.kind.test(doc)) continue;

          const lineNum = baseLineNum + i;

          // Extract the actual apiVersion from the matched line
          const apiVersionMatch = line.match(/apiVersion:\s*["']?([^"'\s\n]+)["']?/);
          const apiVersion = apiVersionMatch ? apiVersionMatch[1] : 'unknown';

          violations.push({
            file: relPath,
            line: lineNum,
            chart: chartName,
            apiVersion,
            kind,
            replacement: deprecated.replacement,
            removedIn: deprecated.removedIn,
            issue: 'deprecated_api',
            severity: deprecated.severity,
            message: `${apiVersion} ${kind} is deprecated (removed in ${deprecated.removedIn}) - use ${deprecated.replacement}`,
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
  console.log('Helm Charts Deprecated APIs Check');
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
      violations.push(...checkDeprecatedApis(content, file, chart.name));
    }

    // Check crds directory too
    const crdFiles = getYamlFiles(chart.path, 'crds');
    for (const file of crdFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      violations.push(...checkDeprecatedApis(content, file, chart.name));
    }
  }

  console.log('Deprecated APIs Violations');
  console.log('-'.repeat(80));
  console.log('');

  if (violations.length === 0) {
    console.log('✅ No deprecated APIs found!');
  } else {
    const high = violations.filter(v => v.severity === 'HIGH').length;
    const medium = violations.filter(v => v.severity === 'MEDIUM').length;
    const low = violations.filter(v => v.severity === 'LOW').length;

    console.log(`❌ Found ${violations.length} deprecated API(s) (HIGH: ${high}, MEDIUM: ${medium}, LOW: ${low})`);
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
  console.log(`Deprecated API issues: ${violations.length} violation(s)`);
  console.log('');

  if (violations.length === 0) {
    console.log('✅ All API version checks passed!');
  } else {
    console.log('❌ Fix: Update apiVersion fields to use stable APIs:');
    console.log('  - extensions/v1beta1 Deployment -> apps/v1');
    console.log('  - networking.k8s.io/v1beta1 Ingress -> networking.k8s.io/v1');
    console.log('  - batch/v1beta1 CronJob -> batch/v1');
    console.log('  - policy/v1beta1 PodSecurityPolicy -> Pod Security Admission');
    console.log('');
    console.log('Run: kubectl convert -f <file> --output-version <api-version>');
  }

  console.log('');

  // Return 1 if there are HIGH severity issues
  const hasHighSeverity = violations.some(v => v.severity === 'HIGH');
  return hasHighSeverity ? 1 : 0;
}

const exitCode = runCheck();
process.exit(exitCode);
