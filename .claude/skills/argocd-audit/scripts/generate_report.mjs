#!/usr/bin/env node

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CWD = process.cwd();

// Get date-only timestamp for report (YYYY-MM-DD)
const date = new Date();
const timestamp = date.toISOString().slice(0, 10);
const REPORT_DIR = path.join(CWD, 'reports', timestamp);
const REPORT_FILE = path.join(REPORT_DIR, 'argocd-audit.md');

// Ensure report directory exists
fs.mkdirSync(REPORT_DIR, { recursive: true });

/**
 * Run a check script and capture full output
 */
function runCheck(scriptPath) {
  return new Promise((resolve) => {
    let stdout = '';
    let stderr = '';

    const proc = spawn('node', [scriptPath], {
      stdio: 'pipe',
      shell: true,
    });

    proc.stdout.on('data', (data) => {
      const text = data.toString();
      stdout += text;
      process.stdout.write(text);
    });

    proc.stderr.on('data', (data) => {
      const text = data.toString();
      stderr += text;
      process.stderr.write(text);
    });

    proc.on('close', (code) => {
      resolve({
        code,
        output: stdout + stderr,
        stdout,
        stderr,
      });
    });

    proc.on('error', (error) => {
      resolve({
        code: 1,
        output: error.message,
        error: error.message,
      });
    });
  });
}

/**
 * Extract summary from check output
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
      return match ? `${match[1]} violation(s)` : '0 violation(s)';
    }
  }

  return '0 violation(s)';
}

/**
 * Main report generator
 */
async function generateReport() {
  console.log('='.repeat(80));
  console.log('ArgoCD Audit - Generating Report');
  console.log('='.repeat(80));
  console.log('');

  const checks = [
    // HIGH severity - must fix before production
    { name: 'Application Source', script: path.join(__dirname, 'check_application_source.mjs'), severity: 'HIGH' },
    { name: 'SyncPolicy', script: path.join(__dirname, 'check_sync_policy.mjs'), severity: 'HIGH' },
    { name: 'Hardcoded Secrets', script: path.join(__dirname, 'check_hardcoded_secrets.mjs'), severity: 'HIGH' },
    { name: 'RBAC Wildcards', script: path.join(__dirname, 'check_rbac_wildcards.mjs'), severity: 'HIGH' },
    { name: 'Istio Gateway TLS', script: path.join(__dirname, 'check_istio_gateway_tls.mjs'), severity: 'HIGH' },
    // MEDIUM severity - should fix
    { name: 'Application Project', script: path.join(__dirname, 'check_application_project.mjs'), severity: 'MEDIUM' },
    { name: 'ApplicationSet', script: path.join(__dirname, 'check_applicationset.mjs'), severity: 'MEDIUM' },
    { name: 'VirtualService', script: path.join(__dirname, 'check_virtualservice.mjs'), severity: 'MEDIUM' },
    { name: 'Deprecated APIs', script: path.join(__dirname, 'check_deprecated_apis.mjs'), severity: 'MEDIUM' },
    // LOW severity - nice to have
    { name: 'Namespace Spec', script: path.join(__dirname, 'check_namespace_spec.mjs'), severity: 'LOW' },
    { name: 'Metadata', script: path.join(__dirname, 'check_metadata.mjs'), severity: 'LOW' },
  ];

  const results = [];

  for (const check of checks) {
    console.log(`\nRunning: ${check.name}...`);
    console.log('-'.repeat(80));

    const { code, output } = await runCheck(check.script);
    const summary = extractSummary(output, check.name);

    results.push({
      name: check.name,
      exitCode: code,
      summary,
      severity: check.severity,
      details: output,
    });

    if (summary === '0 violation(s)') {
      console.log(`\nPASSED: ${check.name}`);
    } else {
      console.log(`\nFAILED: ${check.name} - ${summary}`);
    }
  }

  // Generate markdown report
  const reportContent = generateMarkdown(results);

  // Write report
  fs.writeFileSync(REPORT_FILE, reportContent);

  const totalPassed = results.filter(r => r.summary === '0 violation(s)').length;
  const totalFailed = results.filter(r => r.summary !== '0 violation(s)').length;

  console.log('');
  console.log('='.repeat(80));
  console.log('Report Generation Complete');
  console.log('='.repeat(80));
  console.log('');
  console.log(`Report saved to: ${REPORT_FILE}`);
  console.log('');
  console.log(`Summary: ${totalPassed} passed, ${totalFailed} failed`);
  console.log('');

  process.exit(totalFailed > 0 ? 1 : 0);
}

/**
 * Generate markdown report content
 */
function generateMarkdown(results) {
  const ts = new Date().toISOString();
  const totalChecks = results.length;
  const totalPassed = results.filter(r => r.summary === '0 violation(s)').length;
  const totalFailed = results.filter(r => r.summary !== '0 violation(s)').length;

  let md = `# ArgoCD Audit Report

**Generated:** ${ts}
**Project:** ${path.basename(CWD)}

## Executive Summary

| Metric | Value |
|--------|-------|
| **Total Checks** | ${totalChecks} |
| **Passed** | ✅ ${totalPassed} |
| **Failed** | ❌ ${totalFailed} |
| **Success Rate** | ${totalChecks > 0 ? Math.round((totalPassed / totalChecks) * 100) : 0}% |

## Results by Check

| Check | Severity | Status | Summary |
|-------|----------|--------|---------|
`;

  for (const result of results) {
    const status = result.summary === '0 violation(s)' ? '✅ PASSED' : '❌ FAILED';
    md += `| ${result.name} | ${result.severity} | ${status} | ${result.summary} |\n`;
  }

  md += `\n`;

  // Passed checks
  const passedChecks = results.filter(r => r.summary === '0 violation(s)');
  if (passedChecks.length > 0) {
    md += `## Passed Checks\n\n`;
    for (const result of passedChecks) {
      md += `- ✅ **${result.name}** - ${result.summary}\n`;
    }
    md += `\n`;
  }

  // Failed checks with details
  const failedChecks = results.filter(r => r.summary !== '0 violation(s)');
  if (failedChecks.length > 0) {
    md += `## Failed Checks\n\n`;

    for (const result of failedChecks) {
      md += `### ❌ ${result.name}\n\n`;
      md += `**Severity:** ${result.severity}\n`;
      md += `**Summary:** ${result.summary}\n\n`;

      // Clean up the output for markdown
      const cleanOutput = result.details
        .replace(/\x1B\[\d+m/g, '') // Remove color codes
        .trim();

      md += `<details>\n<summary>View Details</summary>\n\n\`\`\`\n${cleanOutput}\n\`\`\`\n\n</details>\n\n`;
      md += `---\n\n`;
    }
  }

  // Recommendations
  md += `## Recommendations\n\n`;

  if (failedChecks.length > 0) {
    const high = failedChecks.filter(r => r.severity === 'HIGH');
    const medium = failedChecks.filter(r => r.severity === 'MEDIUM');
    const low = failedChecks.filter(r => r.severity === 'LOW');

    if (high.length > 0) {
      md += `1. **Immediate (HIGH):** Fix ${high.map(r => r.name.toLowerCase()).join(', ')}\n`;
    }
    if (medium.length > 0) {
      md += `2. **Short-term (MEDIUM):** Address ${medium.map(r => r.name.toLowerCase()).join(', ')}\n`;
    }
    if (low.length > 0) {
      md += `3. **Long-term (LOW):** Improve ${low.map(r => r.name.toLowerCase()).join(', ')}\n`;
    }
  } else {
    md += `✅ **All checks passed!** Your ArgoCD configuration is excellent.\n`;
  }

  md += `
## Next Steps

1. Address failed checks in priority order (HIGH -> MEDIUM -> LOW)
2. Run individual check scripts for detailed violation analysis
3. Re-run \`generate_report.mjs\` after fixes to verify improvements

---

*Generated by argocd-audit skill*
`;

  return md;
}

// Run report generation
generateReport().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
