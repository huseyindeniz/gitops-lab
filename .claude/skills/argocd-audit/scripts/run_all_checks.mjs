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
    'Application Source': /Application source issues: (\d+) violation/,
    'SyncPolicy': /SyncPolicy issues: (\d+) violation/,
    'Hardcoded Secrets': /Hardcoded secrets issues: (\d+) violation/,
    'RBAC Wildcards': /RBAC wildcard issues: (\d+) violation/,
    'Istio Gateway TLS': /Istio Gateway TLS issues: (\d+) violation/,
    'Application Project': /Application project issues: (\d+) violation/,
    'ApplicationSet': /ApplicationSet issues: (\d+) violation/,
    'VirtualService': /VirtualService issues: (\d+) violation/,
    'Deprecated APIs': /Deprecated API issues: (\d+) violation/,
    'Namespace Spec': /Namespace specification issues: (\d+) violation/,
    'Metadata': /Metadata issues: (\d+) violation/,
  };

  for (const [key, pattern] of Object.entries(patterns)) {
    if (checkName.includes(key)) {
      const match = output.match(pattern);
      return match ? `${match[1]} violation(s)` : 'Check completed';
    }
  }

  return 'Check completed';
}

/**
 * Main runner
 */
async function runAllChecks() {
  console.log('='.repeat(80));
  console.log('ArgoCD Audit - Running All Checks');
  console.log('='.repeat(80));
  console.log('');

  const checks = [
    // HIGH severity - must fix before production
    { name: 'Application Source Check', script: path.join(__dirname, 'check_application_source.mjs'), severity: 'HIGH' },
    { name: 'SyncPolicy Check', script: path.join(__dirname, 'check_sync_policy.mjs'), severity: 'HIGH' },
    { name: 'Hardcoded Secrets Check', script: path.join(__dirname, 'check_hardcoded_secrets.mjs'), severity: 'HIGH' },
    { name: 'RBAC Wildcards Check', script: path.join(__dirname, 'check_rbac_wildcards.mjs'), severity: 'HIGH' },
    { name: 'Istio Gateway TLS Check', script: path.join(__dirname, 'check_istio_gateway_tls.mjs'), severity: 'HIGH' },
    // MEDIUM severity - should fix
    { name: 'Application Project Check', script: path.join(__dirname, 'check_application_project.mjs'), severity: 'MEDIUM' },
    { name: 'ApplicationSet Check', script: path.join(__dirname, 'check_applicationset.mjs'), severity: 'MEDIUM' },
    { name: 'VirtualService Check', script: path.join(__dirname, 'check_virtualservice.mjs'), severity: 'MEDIUM' },
    { name: 'Deprecated APIs Check', script: path.join(__dirname, 'check_deprecated_apis.mjs'), severity: 'MEDIUM' },
    // LOW severity - nice to have
    { name: 'Namespace Spec Check', script: path.join(__dirname, 'check_namespace_spec.mjs'), severity: 'LOW' },
    { name: 'Metadata Check', script: path.join(__dirname, 'check_metadata.mjs'), severity: 'LOW' },
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

      console.log(success ? 'PASSED' : 'FAILED');
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
    const status = result.success ? 'PASSED' : 'FAILED';
    console.log(`${status} - ${result.name} [${result.severity}]`);
    if (result.summary) {
      console.log(`   ${result.summary}`);
    }
    if (!result.success) {
      allPassed = false;
    }
  }

  console.log('');

  // Count by severity
  const highFailed = results.filter(r => r.severity === 'HIGH' && !r.success).length;
  const mediumFailed = results.filter(r => r.severity === 'MEDIUM' && !r.success).length;
  const lowFailed = results.filter(r => r.severity === 'LOW' && !r.success).length;

  console.log(`Failed by severity: HIGH: ${highFailed}, MEDIUM: ${mediumFailed}, LOW: ${lowFailed}`);
  console.log('');

  if (allPassed) {
    console.log('✅ All ArgoCD audit checks passed!');
    console.log('');
    process.exit(0);
  } else {
    console.log('❌ Some ArgoCD audit checks failed.');
    console.log('');
    console.log('Run individual check scripts for detailed violation reports:');
    console.log('   node ./.claude/skills/argocd-audit/scripts/check_application_source.mjs');
    console.log('   node ./.claude/skills/argocd-audit/scripts/check_sync_policy.mjs');
    console.log('   ... etc');
    console.log('');
    process.exit(1);
  }
}

runAllChecks().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
