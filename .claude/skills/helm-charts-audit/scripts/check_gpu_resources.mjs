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
 * Check if document is a workload resource
 */
function isWorkloadResource(content) {
  return /kind:\s*["']?(Deployment|StatefulSet|DaemonSet|Job|CronJob|Pod)["']?/.test(content);
}

/**
 * Check if content uses GPU resources
 */
function usesGpuResources(content) {
  return /nvidia\.com\/gpu/.test(content) ||
         /amd\.com\/gpu/.test(content) ||
         /gpu/i.test(content);
}

/**
 * Check GPU resource configuration
 */
function checkGpuResources(content, filePath, chartName) {
  const violations = [];
  const relPath = normalizePath(path.relative(projectRoot, filePath));
  const documents = splitYamlDocuments(content);

  for (const doc of documents) {
    if (!isWorkloadResource(doc)) continue;
    if (!usesGpuResources(doc)) continue;

    const lines = doc.split('\n');
    const docStartLine = content.indexOf(doc);
    const baseLineNum = content.substring(0, docStartLine).split('\n').length;

    // Extract kind and name
    const kindMatch = doc.match(/kind:\s*["']?(\w+)["']?/);
    const kind = kindMatch ? kindMatch[1] : 'Unknown';

    const nameMatch = doc.match(/metadata:[\s\S]*?name:\s*["']?([^"'\s\n]+)["']?/);
    const resourceName = nameMatch ? nameMatch[1] : 'unnamed';

    // Find resource line
    let resourceLine = baseLineNum;
    for (let i = 0; i < lines.length; i++) {
      if (/kind:/.test(lines[i])) {
        resourceLine = baseLineNum + i;
        break;
      }
    }

    // Check for nvidia.com/gpu in resources
    const hasNvidiaGpu = /nvidia\.com\/gpu/.test(doc);
    const hasAmdGpu = /amd\.com\/gpu/.test(doc);

    if (hasNvidiaGpu || hasAmdGpu) {
      // Check for GPU in limits
      const hasGpuLimits = /limits:[\s\S]*?(nvidia\.com\/gpu|amd\.com\/gpu)/.test(doc);
      if (!hasGpuLimits) {
        violations.push({
          file: relPath,
          line: resourceLine,
          chart: chartName,
          resource: `${kind}/${resourceName}`,
          issue: 'gpu_no_limits',
          severity: 'MEDIUM',
          message: `${kind} "${resourceName}" uses GPU but no limits specified`,
        });
      }

      // Check for GPU in requests (should match limits for GPUs)
      const hasGpuRequests = /requests:[\s\S]*?(nvidia\.com\/gpu|amd\.com\/gpu)/.test(doc);
      if (hasGpuLimits && !hasGpuRequests) {
        violations.push({
          file: relPath,
          line: resourceLine,
          chart: chartName,
          resource: `${kind}/${resourceName}`,
          issue: 'gpu_no_requests',
          severity: 'LOW',
          message: `${kind} "${resourceName}" has GPU limits but no requests - requests should equal limits for GPUs`,
        });
      }

      // Check for GPU tolerations
      const hasTolerations = /tolerations:/.test(doc);
      const hasGpuToleration = /tolerations:[\s\S]*?(nvidia\.com\/gpu|gpu)/.test(doc);

      if (!hasGpuToleration) {
        violations.push({
          file: relPath,
          line: resourceLine,
          chart: chartName,
          resource: `${kind}/${resourceName}`,
          issue: 'gpu_no_toleration',
          severity: 'LOW',
          message: `${kind} "${resourceName}" uses GPU but no GPU toleration - may not schedule on GPU nodes`,
        });
      }

      // Check for nodeSelector or nodeAffinity
      const hasNodeSelector = /nodeSelector:/.test(doc);
      const hasNodeAffinity = /nodeAffinity:/.test(doc);
      const hasGpuNodeSelector = /nodeSelector:[\s\S]*?(gpu|nvidia|accelerator)/.test(doc);
      const hasGpuAffinity = /nodeAffinity:[\s\S]*?(gpu|nvidia|accelerator)/.test(doc);

      if (!hasGpuNodeSelector && !hasGpuAffinity) {
        violations.push({
          file: relPath,
          line: resourceLine,
          chart: chartName,
          resource: `${kind}/${resourceName}`,
          issue: 'gpu_no_node_selector',
          severity: 'LOW',
          message: `${kind} "${resourceName}" uses GPU but no GPU nodeSelector/affinity - relies on resource availability only`,
        });
      }

      // Check for runtime class (for GPU workloads with specific runtimes)
      const hasRuntimeClass = /runtimeClassName:/.test(doc);
      if (!hasRuntimeClass) {
        violations.push({
          file: relPath,
          line: resourceLine,
          chart: chartName,
          resource: `${kind}/${resourceName}`,
          issue: 'gpu_no_runtime_class',
          severity: 'LOW',
          message: `${kind} "${resourceName}" uses GPU but no runtimeClassName - consider nvidia runtime`,
        });
      }

      // Check for GPU memory limits (NVIDIA MIG or memory fraction)
      // This is advanced and optional
      const hasGpuMemory = /nvidia\.com\/(mig|memory|mig-)/.test(doc);
      // Not a violation, just informational

      // Check if request > 1 GPU (potential cost issue)
      const gpuLimitMatch = doc.match(/(nvidia\.com\/gpu|amd\.com\/gpu):\s*["']?(\d+)["']?/);
      if (gpuLimitMatch && parseInt(gpuLimitMatch[2]) > 1) {
        violations.push({
          file: relPath,
          line: resourceLine,
          chart: chartName,
          resource: `${kind}/${resourceName}`,
          issue: 'multi_gpu',
          severity: 'LOW',
          message: `${kind} "${resourceName}" requests ${gpuLimitMatch[2]} GPUs - verify multi-GPU is needed`,
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
  console.log('Helm Charts GPU Resources Check');
  console.log('='.repeat(80));
  console.log('');

  const charts = getHelmCharts(helmChartsDir);
  console.log(`Found ${charts.length} Helm charts to scan`);
  console.log('');

  const violations = [];
  let chartsWithGpu = 0;

  for (const chart of charts) {
    let chartHasGpu = false;

    // Check values.yaml for GPU defaults
    const valuesFile = path.join(chart.path, 'values.yaml');
    if (fs.existsSync(valuesFile)) {
      const content = fs.readFileSync(valuesFile, 'utf-8');
      if (usesGpuResources(content)) {
        chartHasGpu = true;
      }
    }

    // Check all template files
    const templateFiles = getYamlFiles(chart.path, 'templates');
    for (const file of templateFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      violations.push(...checkGpuResources(content, file, chart.name));

      if (usesGpuResources(content)) {
        chartHasGpu = true;
      }
    }

    if (chartHasGpu) chartsWithGpu++;
  }

  console.log(`Charts using GPU resources: ${chartsWithGpu}`);
  console.log('');
  console.log('GPU Resources Violations');
  console.log('-'.repeat(80));
  console.log('');

  if (violations.length === 0) {
    if (chartsWithGpu === 0) {
      console.log('No GPU resources found in charts');
    } else {
      console.log('✅ All GPU resources are properly configured!');
    }
  } else {
    const high = violations.filter(v => v.severity === 'HIGH').length;
    const medium = violations.filter(v => v.severity === 'MEDIUM').length;
    const low = violations.filter(v => v.severity === 'LOW').length;

    console.log(`❌ Found ${violations.length} GPU resource issue(s) (HIGH: ${high}, MEDIUM: ${medium}, LOW: ${low})`);
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
  console.log(`GPU resource issues: ${violations.length} violation(s)`);
  console.log('');

  if (violations.length === 0) {
    console.log('✅ All GPU resource checks passed!');
  } else {
    console.log('❌ Fix: Ensure GPU workloads have:');
    console.log('  resources:');
    console.log('    limits:');
    console.log('      nvidia.com/gpu: 1');
    console.log('    requests:');
    console.log('      nvidia.com/gpu: 1');
    console.log('  tolerations:');
    console.log('    - key: nvidia.com/gpu');
    console.log('      operator: Exists');
    console.log('      effect: NoSchedule');
    console.log('  nodeSelector:');
    console.log('    accelerator: nvidia-tesla-v100');
  }

  console.log('');

  // GPU issues are LOW severity, always return 0
  return 0;
}

const exitCode = runCheck();
process.exit(exitCode);
