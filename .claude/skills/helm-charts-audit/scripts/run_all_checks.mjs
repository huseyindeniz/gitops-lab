#!/usr/bin/env node

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Run a script and capture output
 */
function runScript(scriptPath) {
  return new Promise((resolve, reject) => {
    let stdout = '';
    let stderr = '';

    const proc = spawn('node', [scriptPath], {
      stdio: 'pipe',
      shell: true,
    });

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      resolve({ code, output: stdout + stderr });
    });

    proc.on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Extract summary from output
 */
function extractSummary(output, checkName) {
  const patterns = {
    'Image Tags': /Image tag issues: (\d+) violation/,
    'Security Context': /Security context issues: (\d+) violation/,
    'Resource Limits': /Resource limits issues: (\d+) violation/,
    'RBAC Wildcards': /RBAC wildcard issues: (\d+) violation/,
    'Health Probes': /Health probe issues: (\d+) violation/,
    'Helm Lint': /Helm lint: (\d+) failed/,
    'Chart Metadata': /Metadata issues: (\d+) violation/,
    'Chart Structure': /Structure issues: (\d+) violation/,
    'Dependencies': /Dependency issues: (\d+) violation/,
    'Deprecated APIs': /Deprecated API issues: (\d+) violation/,
    'Argo Rollouts': /Argo Rollouts issues: (\d+) violation/,
    'Ingress TLS': /Ingress TLS issues: (\d+) violation/,
    'GPU Resources': /GPU resource issues: (\d+) violation/,
  };

  for (const [key, pattern] of Object.entries(patterns)) {
    if (checkName.includes(key)) {
      const match = output.match(pattern);
      return match ? `${match[1]} violation(s)` : 'Check completed';
    }
  }

  // Check for SKIPPED
  if (/SKIPPED/.test(output)) {
    return 'SKIPPED';
  }

  return 'Check completed';
}

/**
 * Main runner
 */
async function runAllChecks() {
  console.log('='.repeat(80));
  console.log('Helm Charts Audit - Running All Checks');
  console.log('='.repeat(80));
  console.log('');

  const checks = [
    // HIGH severity - must fix before production
    { name: 'Image Tags Check', script: path.join(__dirname, 'check_image_tags.mjs'), severity: 'HIGH' },
    { name: 'Security Context Check', script: path.join(__dirname, 'check_security_context.mjs'), severity: 'HIGH' },
    { name: 'Resource Limits Check', script: path.join(__dirname, 'check_resource_limits.mjs'), severity: 'HIGH' },
    { name: 'RBAC Wildcards Check', script: path.join(__dirname, 'check_rbac_wildcards.mjs'), severity: 'HIGH' },
    { name: 'Health Probes Check', script: path.join(__dirname, 'check_health_probes.mjs'), severity: 'HIGH' },
    { name: 'Helm Lint Check', script: path.join(__dirname, 'check_helm_lint.mjs'), severity: 'HIGH' },
    // MEDIUM severity - should fix
    { name: 'Chart Metadata Check', script: path.join(__dirname, 'check_chart_metadata.mjs'), severity: 'MEDIUM' },
    { name: 'Chart Structure Check', script: path.join(__dirname, 'check_chart_structure.mjs'), severity: 'MEDIUM' },
    { name: 'Dependencies Check', script: path.join(__dirname, 'check_dependencies.mjs'), severity: 'MEDIUM' },
    { name: 'Deprecated APIs Check', script: path.join(__dirname, 'check_deprecated_apis.mjs'), severity: 'MEDIUM' },
    { name: 'Argo Rollouts Check', script: path.join(__dirname, 'check_argo_rollouts.mjs'), severity: 'MEDIUM' },
    { name: 'Ingress TLS Check', script: path.join(__dirname, 'check_ingress_tls.mjs'), severity: 'MEDIUM' },
    // LOW severity - nice to have
    { name: 'GPU Resources Check', script: path.join(__dirname, 'check_gpu_resources.mjs'), severity: 'LOW' },
  ];

  const results = [];

  for (const check of checks) {
    process.stdout.write(`Running ${check.name}... `);

    try {
      const { code, output } = await runScript(check.script);
      const summary = extractSummary(output, check.name);
      const success = code === 0;

      results.push({
        name: check.name,
        success,
        exitCode: code,
        summary,
        severity: check.severity,
      });

      if (summary === 'SKIPPED') {
        console.log('SKIPPED');
      } else {
        console.log(success ? 'PASSED' : 'FAILED');
      }
      console.log(`   [${check.severity}] ${summary}`);
    } catch (error) {
      console.log('ERROR');
      console.error(`   Error: ${error.message}`);
      results.push({
        name: check.name,
        success: false,
        error: error.message,
        severity: check.severity,
      });
    }
  }

  // Final summary
  console.log('');
  console.log('='.repeat(80));
  console.log('Final Summary');
  console.log('='.repeat(80));
  console.log('');

  let allPassed = true;

  for (const result of results) {
    const status = result.summary === 'SKIPPED'
      ? 'SKIPPED'
      : result.success ? 'PASSED' : 'FAILED';
    console.log(`${status} - ${result.name} [${result.severity}]`);
    if (result.summary && result.summary !== 'SKIPPED') {
      console.log(`   ${result.summary}`);
    }
    if (!result.success && result.summary !== 'SKIPPED') {
      allPassed = false;
    }
  }

  console.log('');

  // Count by severity
  const highFailed = results.filter(r => r.severity === 'HIGH' && !r.success && r.summary !== 'SKIPPED').length;
  const mediumFailed = results.filter(r => r.severity === 'MEDIUM' && !r.success).length;
  const lowFailed = results.filter(r => r.severity === 'LOW' && !r.success).length;

  console.log(`Failed by severity: HIGH: ${highFailed}, MEDIUM: ${mediumFailed}, LOW: ${lowFailed}`);
  console.log('');

  if (allPassed) {
    console.log('✅ All Helm chart quality checks passed!');
    console.log('');
    process.exit(0);
  } else {
    console.log('❌ Some Helm chart quality checks failed.');
    console.log('');
    console.log('Run individual check scripts for detailed violation reports:');
    console.log('   node ./.claude/skills/helm-charts-audit/scripts/check_image_tags.mjs');
    console.log('   node ./.claude/skills/helm-charts-audit/scripts/check_security_context.mjs');
    console.log('   ... etc');
    console.log('');
    process.exit(1);
  }
}

runAllChecks().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
