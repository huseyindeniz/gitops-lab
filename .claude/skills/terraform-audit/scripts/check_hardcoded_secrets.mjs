#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get project root (4 levels up from script location)
const projectRoot = path.resolve(__dirname, '../../../..');
const terraformDir = path.join(projectRoot, 'terraform');

/**
 * Normalize path for consistent display
 */
function normalizePath(p) {
  return p.replace(/\\/g, '/');
}

/**
 * Recursively get all .tf and .tfvars files
 */
function getTerraformFiles(dir, files = []) {
  if (!fs.existsSync(dir)) {
    return files;
  }

  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (!['node_modules', '.git', '.terraform'].includes(item)) {
        getTerraformFiles(fullPath, files);
      }
    } else if (stat.isFile()) {
      if (item.endsWith('.tf') || item.endsWith('.tfvars')) {
        files.push(fullPath);
      }
    }
  }

  return files;
}

/**
 * VALUE-BASED secret detection patterns
 * These patterns look at the VALUE, not the variable name
 * This ensures new variables with secrets are automatically detected
 */
const secretValuePatterns = [
  // GitHub Classic PAT (ghp_)
  { regex: /ghp_[A-Za-z0-9]{36}/, type: 'github_classic_pat', severity: 'HIGH' },
  // GitHub Fine-grained PAT (github_pat_)
  { regex: /github_pat_[A-Za-z0-9_]{22,}/, type: 'github_fine_grained_pat', severity: 'HIGH' },
  // GitHub OAuth tokens (gho_, ghu_, ghs_, ghr_)
  { regex: /gh[ousr]_[A-Za-z0-9]{36,}/, type: 'github_oauth_token', severity: 'HIGH' },
  // JWT tokens (eyJ header indicates base64 JSON)
  { regex: /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/, type: 'jwt_token', severity: 'HIGH' },
  // AWS Access Key ID
  { regex: /AKIA[0-9A-Z]{16}/, type: 'aws_access_key', severity: 'HIGH' },
  // AWS Secret Access Key (40 char base64)
  { regex: /[A-Za-z0-9/+=]{40}/, type: 'potential_aws_secret', severity: 'MEDIUM', minEntropy: true },
  // Azure/GCP Service Account private key
  { regex: /-----BEGIN\s*(RSA\s*)?PRIVATE\s*KEY-----/, type: 'private_key', severity: 'HIGH' },
  { regex: /-----BEGIN\s*EC\s*PRIVATE\s*KEY-----/, type: 'ec_private_key', severity: 'HIGH' },
  // Slack tokens
  { regex: /xox[baprs]-[0-9]{10,}-[A-Za-z0-9]{10,}/, type: 'slack_token', severity: 'HIGH' },
  // Stripe keys
  { regex: /sk_live_[A-Za-z0-9]{20,}/, type: 'stripe_secret_key', severity: 'HIGH' },
  { regex: /rk_live_[A-Za-z0-9]{20,}/, type: 'stripe_restricted_key', severity: 'HIGH' },
  // SendGrid
  { regex: /SG\.[A-Za-z0-9_-]{22}\.[A-Za-z0-9_-]{43}/, type: 'sendgrid_api_key', severity: 'HIGH' },
  // Twilio
  { regex: /SK[a-f0-9]{32}/, type: 'twilio_api_key', severity: 'HIGH' },
  // NPM tokens
  { regex: /npm_[A-Za-z0-9]{36}/, type: 'npm_token', severity: 'HIGH' },
  // PyPI tokens
  { regex: /pypi-AgEIcHlwaS5vcmc[A-Za-z0-9_-]{50,}/, type: 'pypi_token', severity: 'HIGH' },
  // Generic OAuth client secret (40 char hex)
  { regex: /[a-f0-9]{40}/, type: 'potential_oauth_secret', severity: 'MEDIUM', context: 'secret' },
  // Long hex strings (potential secrets) - 64+ chars
  { regex: /[a-f0-9]{64,}/, type: 'long_hex_secret', severity: 'MEDIUM' },
  // Base64 encoded secrets (long, looks random)
  { regex: /[A-Za-z0-9+/]{50,}={0,2}/, type: 'potential_base64_secret', severity: 'LOW', minEntropy: true },
];

/**
 * Check if a value looks like it has high entropy (random-looking)
 */
function hasHighEntropy(str) {
  if (str.length < 20) return false;

  const charSet = new Set(str.split(''));
  const uniqueRatio = charSet.size / str.length;

  // High entropy = many unique characters relative to length
  // Normal text has lower ratio, random strings have higher
  return uniqueRatio > 0.4 && charSet.size > 10;
}

/**
 * Check if line should be excluded (not a real hardcoded secret)
 */
function shouldExcludeLine(line) {
  // Skip comments
  if (/^\s*#/.test(line)) return true;
  // Skip empty values
  if (/=\s*""\s*$/.test(line)) return true;
  // Skip variable references
  if (/=\s*var\./.test(line)) return true;
  if (/=\s*local\./.test(line)) return true;
  if (/=\s*data\./.test(line)) return true;
  if (/=\s*module\./.test(line)) return true;
  // Skip interpolation references
  if (/=\s*"\$\{(var|local|data|module)\./.test(line)) return true;
  // Skip random resource references
  if (/random_password\./.test(line)) return true;
  if (/random_string\./.test(line)) return true;

  return false;
}

/**
 * Extract value from a line like: variable = "value"
 */
function extractValue(line) {
  const match = line.match(/=\s*"([^"]+)"/);
  return match ? match[1] : null;
}

/**
 * Extract variable name from a line
 */
function extractVarName(line) {
  const match = line.match(/^\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*=/);
  return match ? match[1] : 'unknown';
}

/**
 * Find hardcoded secrets in content - VALUE BASED DETECTION
 */
function findSecrets(content, filePath) {
  const lines = content.split('\n');
  const violations = [];
  const relPath = normalizePath(path.relative(projectRoot, filePath));
  const seenLines = new Set(); // Avoid duplicate reports for same line

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (shouldExcludeLine(line)) continue;

    const value = extractValue(line);
    if (!value) continue;

    // Skip short values (unlikely to be secrets)
    if (value.length < 10) continue;

    for (const pattern of secretValuePatterns) {
      if (pattern.regex.test(value)) {
        // For patterns that need high entropy check
        if (pattern.minEntropy && !hasHighEntropy(value)) continue;

        // For patterns that need context (like oauth secret needing 'secret' in var name)
        if (pattern.context === 'secret') {
          const varName = extractVarName(line).toLowerCase();
          if (!varName.includes('secret') && !varName.includes('key') && !varName.includes('token')) {
            continue;
          }
        }

        const lineKey = `${relPath}:${i + 1}`;
        if (seenLines.has(lineKey)) continue;
        seenLines.add(lineKey);

        violations.push({
          file: relPath,
          line: i + 1,
          variable: extractVarName(line),
          type: pattern.type,
          severity: pattern.severity,
        });
        break; // One violation per line is enough
      }
    }
  }

  return violations;
}

/**
 * Main check function
 */
function runCheck() {
  console.log('Terraform Hardcoded Secrets Check');
  console.log('='.repeat(80));
  console.log('');

  const files = getTerraformFiles(terraformDir);
  console.log(`Scanning ${files.length} Terraform files...`);
  console.log('');

  const violations = [];

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const fileViolations = findSecrets(content, file);
    violations.push(...fileViolations);
  }

  console.log('Hardcoded Secrets Violations');
  console.log('-'.repeat(80));
  console.log('');

  if (violations.length === 0) {
    console.log('✅ No hardcoded secrets found!');
  } else {
    const high = violations.filter(v => v.severity === 'HIGH').length;
    const medium = violations.filter(v => v.severity === 'MEDIUM').length;
    const low = violations.filter(v => v.severity === 'LOW').length;

    console.log(`❌ Found ${violations.length} hardcoded secret(s) (HIGH: ${high}, MEDIUM: ${medium}, LOW: ${low})`);
    console.log('');

    // Group by file
    const byFile = {};
    for (const v of violations) {
      if (!byFile[v.file]) byFile[v.file] = [];
      byFile[v.file].push(v);
    }

    for (const file of Object.keys(byFile).sort()) {
      console.log(`  ❌ ${file}`);
      for (const v of byFile[file]) {
        console.log(`     Line ${v.line}: [${v.severity}] ${v.variable} (${v.type})`);
      }
      console.log('');
    }
  }

  console.log('='.repeat(80));
  console.log('Summary');
  console.log('');
  console.log(`Hardcoded secrets: ${violations.length} violation(s)`);
  console.log('');

  if (violations.length === 0) {
    console.log('✅ All hardcoded secrets checks passed!');
  } else {
    console.log('❌ Hardcoded secrets found.');
    console.log('');
    console.log('Fix: Use variables, random_password, or secret managers instead.');
  }

  console.log('');

  return violations.length > 0 ? 1 : 0;
}

const exitCode = runCheck();
process.exit(exitCode);
