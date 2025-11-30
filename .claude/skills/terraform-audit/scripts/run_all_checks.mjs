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
  if (checkName.includes('Secrets')) {
    const match = output.match(/Hardcoded secrets: (\d+) violation/);
    return match ? `${match[1]} violation(s)` : 'Check output';
  }

  if (checkName.includes('Security')) {
    const match = output.match(/Security issues: (\d+) violation/);
    return match ? `${match[1]} violation(s)` : 'Check output';
  }

  if (checkName.includes('Versions')) {
    const match = output.match(/Missing versions: (\d+) violation/);
    return match ? `${match[1]} violation(s)` : 'Check output';
  }

  if (checkName.includes('Descriptions')) {
    const match = output.match(/Missing descriptions: (\d+) violation/);
    return match ? `${match[1]} violation(s)` : 'Check output';
  }

  if (checkName.includes('Deprecated')) {
    const match = output.match(/Deprecated syntax: (\d+) violation/);
    return match ? `${match[1]} violation(s)` : 'Check output';
  }

  if (checkName.includes('Structure')) {
    const match = output.match(/Structure issues: (\d+) violation/);
    return match ? `${match[1]} violation(s)` : 'Check output';
  }

  if (checkName.includes('Naming')) {
    const match = output.match(/Naming issues: (\d+) violation/);
    return match ? `${match[1]} violation(s)` : 'Check output';
  }

  if (checkName.includes('Lifecycle')) {
    const match = output.match(/Lifecycle issues: (\d+) violation/);
    return match ? `${match[1]} violation(s)` : 'Check output';
  }

  if (checkName.includes('Dependency')) {
    const match = output.match(/Dependency issues: (\d+) violation/);
    return match ? `${match[1]} violation(s)` : 'Check output';
  }

  return 'Check output';
}

/**
 * Main runner
 */
async function runAllChecks() {
  console.log('='.repeat(80));
  console.log('Terraform Audit - Running All Checks');
  console.log('='.repeat(80));
  console.log('');

  const checks = [
    // HIGH severity - must fix before production
    { name: 'Hardcoded Secrets Check', script: path.join(__dirname, 'check_hardcoded_secrets.mjs'), severity: 'HIGH' },
    { name: 'Security Issues Check', script: path.join(__dirname, 'check_security_issues.mjs'), severity: 'HIGH' },
    { name: 'Missing Versions Check', script: path.join(__dirname, 'check_missing_versions.mjs'), severity: 'HIGH' },
    { name: 'Resource Lifecycle Check', script: path.join(__dirname, 'check_resource_lifecycle.mjs'), severity: 'HIGH' },
    { name: 'Deprecated Syntax Check', script: path.join(__dirname, 'check_deprecated_syntax.mjs'), severity: 'HIGH' },
    // MEDIUM severity - should fix
    { name: 'Module Structure Check', script: path.join(__dirname, 'check_module_structure.mjs'), severity: 'MEDIUM' },
    { name: 'Dependency Issues Check', script: path.join(__dirname, 'check_dependency_issues.mjs'), severity: 'MEDIUM' },
    // LOW severity - nice to have
    { name: 'Missing Descriptions Check', script: path.join(__dirname, 'check_missing_descriptions.mjs'), severity: 'LOW' },
    { name: 'Naming Conventions Check', script: path.join(__dirname, 'check_naming_conventions.mjs'), severity: 'LOW' },
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

      console.log(success ? '✅ PASSED' : '❌ FAILED');
      console.log(`   [${check.severity}] ${summary}`);
    } catch (error) {
      console.log('❌ ERROR');
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
    const status = result.success ? '✅ PASSED' : '❌ FAILED';
    console.log(`${status} - ${result.name} [${result.severity}]`);
    if (result.summary) {
      console.log(`   ${result.summary}`);
    }
    if (!result.success) {
      allPassed = false;
    }
  }

  console.log('');

  if (allPassed) {
    console.log('🎉 All Terraform quality checks passed!');
    console.log('');
    process.exit(0);
  } else {
    console.log('❌ Some Terraform quality checks failed.');
    console.log('');
    console.log('💡 Tip: Run individual check scripts for detailed violation reports:');
    console.log('   node ./.claude/skills/terraform-audit/scripts/check_hardcoded_secrets.mjs');
    console.log('   node ./.claude/skills/terraform-audit/scripts/check_security_issues.mjs');
    console.log('   ... etc');
    console.log('');
    process.exit(1);
  }
}

runAllChecks().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
