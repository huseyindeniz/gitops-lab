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
 * Check if document is an Argo Rollout
 */
function isArgoRollout(content) {
  return /apiVersion:\s*["']?argoproj\.io\/v1alpha1["']?/.test(content) &&
         /kind:\s*["']?Rollout["']?/.test(content);
}

/**
 * Check if document is an AnalysisTemplate
 */
function isAnalysisTemplate(content) {
  return /apiVersion:\s*["']?argoproj\.io\/v1alpha1["']?/.test(content) &&
         /kind:\s*["']?(AnalysisTemplate|ClusterAnalysisTemplate)["']?/.test(content);
}

/**
 * Check Argo Rollouts configuration
 */
function checkArgoRollouts(content, filePath, chartName) {
  const violations = [];
  const relPath = normalizePath(path.relative(projectRoot, filePath));
  const documents = splitYamlDocuments(content);

  let hasRollout = false;
  let hasAnalysisTemplate = false;
  const rolloutNames = [];
  const analysisTemplateNames = [];

  for (const doc of documents) {
    if (isAnalysisTemplate(doc)) {
      hasAnalysisTemplate = true;
      const nameMatch = doc.match(/metadata:[\s\S]*?name:\s*["']?([^"'\s\n]+)["']?/);
      if (nameMatch) analysisTemplateNames.push(nameMatch[1]);
    }

    if (!isArgoRollout(doc)) continue;
    hasRollout = true;

    const lines = doc.split('\n');
    const docStartLine = content.indexOf(doc);
    const baseLineNum = content.substring(0, docStartLine).split('\n').length;

    // Extract name
    const nameMatch = doc.match(/metadata:[\s\S]*?name:\s*["']?([^"'\s\n]+)["']?/);
    const rolloutName = nameMatch ? nameMatch[1] : 'unnamed';
    rolloutNames.push(rolloutName);

    // Find rollout line
    let rolloutLine = baseLineNum;
    for (let i = 0; i < lines.length; i++) {
      if (/kind:\s*["']?Rollout["']?/.test(lines[i])) {
        rolloutLine = baseLineNum + i;
        break;
      }
    }

    // Check for strategy
    const hasStrategy = /strategy:/.test(doc);
    if (!hasStrategy) {
      violations.push({
        file: relPath,
        line: rolloutLine,
        chart: chartName,
        rollout: rolloutName,
        issue: 'no_strategy',
        severity: 'HIGH',
        message: `Rollout "${rolloutName}" has no strategy defined`,
      });
      continue;
    }

    // Check strategy type
    const hasCanary = /canary:/.test(doc);
    const hasBlueGreen = /blueGreen:/.test(doc);

    if (!hasCanary && !hasBlueGreen) {
      violations.push({
        file: relPath,
        line: rolloutLine,
        chart: chartName,
        rollout: rolloutName,
        issue: 'invalid_strategy',
        severity: 'HIGH',
        message: `Rollout "${rolloutName}" has strategy but no canary or blueGreen config`,
      });
      continue;
    }

    // Check canary configuration
    if (hasCanary) {
      // Check for steps
      const hasSteps = /steps:/.test(doc);
      if (!hasSteps) {
        violations.push({
          file: relPath,
          line: rolloutLine,
          chart: chartName,
          rollout: rolloutName,
          issue: 'canary_no_steps',
          severity: 'MEDIUM',
          message: `Canary rollout "${rolloutName}" has no steps defined - will use default`,
        });
      } else {
        // Check for setWeight steps
        const setWeightMatches = doc.match(/setWeight:\s*(\d+)/g) || [];
        if (setWeightMatches.length > 0) {
          // Check for pause after setWeight
          const hasPause = /pause:/.test(doc);
          if (!hasPause) {
            violations.push({
              file: relPath,
              line: rolloutLine,
              chart: chartName,
              rollout: rolloutName,
              issue: 'canary_no_pause',
              severity: 'LOW',
              message: `Canary rollout "${rolloutName}" has setWeight but no pause - consider adding pauses`,
            });
          }
        }

        // Check for analysis in canary steps
        const hasAnalysisStep = /analysis:/.test(doc);
        if (!hasAnalysisStep) {
          violations.push({
            file: relPath,
            line: rolloutLine,
            chart: chartName,
            rollout: rolloutName,
            issue: 'canary_no_analysis',
            severity: 'MEDIUM',
            message: `Canary rollout "${rolloutName}" has no analysis step - consider adding automated analysis`,
          });
        }
      }

      // Check for maxSurge/maxUnavailable
      if (!/maxSurge:/.test(doc) && !/maxUnavailable:/.test(doc)) {
        violations.push({
          file: relPath,
          line: rolloutLine,
          chart: chartName,
          rollout: rolloutName,
          issue: 'canary_no_surge',
          severity: 'LOW',
          message: `Canary rollout "${rolloutName}" has no maxSurge/maxUnavailable - using defaults`,
        });
      }

      // Check for trafficRouting
      const hasTrafficRouting = /trafficRouting:/.test(doc);
      if (!hasTrafficRouting) {
        violations.push({
          file: relPath,
          line: rolloutLine,
          chart: chartName,
          rollout: rolloutName,
          issue: 'canary_no_traffic_routing',
          severity: 'LOW',
          message: `Canary rollout "${rolloutName}" has no trafficRouting - using pod-based canary only`,
        });
      }
    }

    // Check blueGreen configuration
    if (hasBlueGreen) {
      // Check for activeService
      const hasActiveService = /activeService:/.test(doc);
      if (!hasActiveService) {
        violations.push({
          file: relPath,
          line: rolloutLine,
          chart: chartName,
          rollout: rolloutName,
          issue: 'bluegreen_no_active_service',
          severity: 'HIGH',
          message: `BlueGreen rollout "${rolloutName}" has no activeService defined`,
        });
      }

      // Check for previewService
      const hasPreviewService = /previewService:/.test(doc);
      if (!hasPreviewService) {
        violations.push({
          file: relPath,
          line: rolloutLine,
          chart: chartName,
          rollout: rolloutName,
          issue: 'bluegreen_no_preview_service',
          severity: 'MEDIUM',
          message: `BlueGreen rollout "${rolloutName}" has no previewService - cannot preview before promotion`,
        });
      }

      // Check for autoPromotionEnabled: false (manual promotion)
      if (/autoPromotionEnabled:\s*false/.test(doc)) {
        // This is fine but note it
        const hasAutoPromotionSeconds = /autoPromotionSeconds:/.test(doc);
        if (!hasAutoPromotionSeconds) {
          // Manual promotion without auto-fallback - OK but risky
        }
      }

      // Check for prePromotionAnalysis
      const hasPrePromoAnalysis = /prePromotionAnalysis:/.test(doc);
      if (!hasPrePromoAnalysis) {
        violations.push({
          file: relPath,
          line: rolloutLine,
          chart: chartName,
          rollout: rolloutName,
          issue: 'bluegreen_no_pre_analysis',
          severity: 'MEDIUM',
          message: `BlueGreen rollout "${rolloutName}" has no prePromotionAnalysis - consider adding`,
        });
      }
    }

    // Check for revisionHistoryLimit
    if (!/revisionHistoryLimit:/.test(doc)) {
      violations.push({
        file: relPath,
        line: rolloutLine,
        chart: chartName,
        rollout: rolloutName,
        issue: 'no_revision_history_limit',
        severity: 'LOW',
        message: `Rollout "${rolloutName}" has no revisionHistoryLimit - old ReplicaSets may accumulate`,
      });
    }

    // Check for progressDeadlineSeconds
    if (!/progressDeadlineSeconds:/.test(doc)) {
      violations.push({
        file: relPath,
        line: rolloutLine,
        chart: chartName,
        rollout: rolloutName,
        issue: 'no_progress_deadline',
        severity: 'LOW',
        message: `Rollout "${rolloutName}" has no progressDeadlineSeconds - stuck rollouts may not timeout`,
      });
    }
  }

  return violations;
}

/**
 * Main check function
 */
function runCheck() {
  console.log('Helm Charts Argo Rollouts Check');
  console.log('='.repeat(80));
  console.log('');

  const charts = getHelmCharts(helmChartsDir);
  console.log(`Found ${charts.length} Helm charts to scan`);
  console.log('');

  const violations = [];
  let chartsWithRollouts = 0;

  for (const chart of charts) {
    let chartHasRollouts = false;

    // Check all template files
    const templateFiles = getYamlFiles(chart.path, 'templates');
    for (const file of templateFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const fileViolations = checkArgoRollouts(content, file, chart.name);
      violations.push(...fileViolations);

      if (/kind:\s*["']?Rollout["']?/.test(content)) {
        chartHasRollouts = true;
      }
    }

    if (chartHasRollouts) chartsWithRollouts++;
  }

  console.log(`Charts using Argo Rollouts: ${chartsWithRollouts}`);
  console.log('');
  console.log('Argo Rollouts Violations');
  console.log('-'.repeat(80));
  console.log('');

  if (violations.length === 0) {
    if (chartsWithRollouts === 0) {
      console.log('No Argo Rollouts found in charts');
    } else {
      console.log('✅ All Argo Rollouts are properly configured!');
    }
  } else {
    const high = violations.filter(v => v.severity === 'HIGH').length;
    const medium = violations.filter(v => v.severity === 'MEDIUM').length;
    const low = violations.filter(v => v.severity === 'LOW').length;

    console.log(`❌ Found ${violations.length} Argo Rollouts issue(s) (HIGH: ${high}, MEDIUM: ${medium}, LOW: ${low})`);
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
  console.log(`Argo Rollouts issues: ${violations.length} violation(s)`);
  console.log('');

  if (violations.length === 0) {
    console.log('✅ All Argo Rollouts checks passed!');
  } else {
    console.log('❌ Fix: Ensure Argo Rollouts have:');
    console.log('  - Valid strategy (canary or blueGreen)');
    console.log('  - Canary: steps with setWeight, pause, and analysis');
    console.log('  - BlueGreen: activeService and previewService');
    console.log('  - Analysis templates for automated validation');
  }

  console.log('');

  // Only return 1 if there are HIGH severity issues
  const hasHighSeverity = violations.some(v => v.severity === 'HIGH');
  return hasHighSeverity ? 1 : 0;
}

const exitCode = runCheck();
process.exit(exitCode);
