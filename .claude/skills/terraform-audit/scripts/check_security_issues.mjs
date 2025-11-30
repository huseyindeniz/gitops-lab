#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, '../../../..');
const terraformDir = path.join(projectRoot, 'terraform');

function normalizePath(p) {
  return p.replace(/\\/g, '/');
}

function getTerraformFiles(dir, files = []) {
  if (!fs.existsSync(dir)) return files;

  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (!['node_modules', '.git', '.terraform'].includes(item)) {
        getTerraformFiles(fullPath, files);
      }
    } else if (stat.isFile() && item.endsWith('.tf')) {
      files.push(fullPath);
    }
  }
  return files;
}

// Security check patterns - production-grade
const securityChecks = [
  // IAM/RBAC Over-permissive
  { pattern: /"Action"\s*:\s*"\*"/, type: 'overly_permissive_iam', severity: 'HIGH', message: 'IAM policy with Action: "*"' },
  { pattern: /"Resource"\s*:\s*"\*"/, type: 'overly_permissive_iam', severity: 'HIGH', message: 'IAM policy with Resource: "*"' },
  { pattern: /verbs\s*=\s*\["\*"\]/, type: 'overly_permissive_k8s_rbac', severity: 'HIGH', message: 'K8s RBAC with verbs: ["*"]' },
  { pattern: /resources\s*=\s*\["\*"\]/, type: 'overly_permissive_k8s_rbac', severity: 'HIGH', message: 'K8s RBAC with resources: ["*"]' },
  { pattern: /api_groups\s*=\s*\["\*"\]/, type: 'overly_permissive_k8s_rbac', severity: 'HIGH', message: 'K8s RBAC with api_groups: ["*"]' },

  // Network Security
  { pattern: /cidr_blocks\s*=\s*\["0\.0\.0\.0\/0"\]/, type: 'open_security_group', severity: 'HIGH', message: 'Security group open to 0.0.0.0/0' },
  { pattern: /source_ranges\s*=\s*\["0\.0\.0\.0\/0"\]/, type: 'open_firewall', severity: 'HIGH', message: 'GCP firewall open to 0.0.0.0/0' },
  { pattern: /ingress_cidr_blocks\s*=\s*\["0\.0\.0\.0\/0"\]/, type: 'open_ingress', severity: 'HIGH', message: 'Ingress open to 0.0.0.0/0' },

  // Encryption
  { pattern: /encrypted\s*=\s*false/, type: 'unencrypted_storage', severity: 'HIGH', message: 'Storage encryption disabled' },
  { pattern: /kms_key_id\s*=\s*""/, type: 'no_kms_key', severity: 'HIGH', message: 'Empty KMS key - no encryption' },
  { pattern: /storage_encrypted\s*=\s*false/, type: 'unencrypted_rds', severity: 'HIGH', message: 'RDS encryption disabled' },
  { pattern: /encrypt\s*=\s*false/, type: 'unencrypted_backend', severity: 'HIGH', message: 'Backend state encryption disabled' },

  // Public Access
  { pattern: /publicly_accessible\s*=\s*true/, type: 'public_access', severity: 'HIGH', message: 'Resource publicly accessible' },
  { pattern: /block_public_acls\s*=\s*false/, type: 'public_access', severity: 'HIGH', message: 'S3 allows public ACLs' },
  { pattern: /block_public_policy\s*=\s*false/, type: 'public_access', severity: 'HIGH', message: 'S3 allows public policy' },
  { pattern: /ignore_public_acls\s*=\s*false/, type: 'public_access', severity: 'HIGH', message: 'S3 not ignoring public ACLs' },
  { pattern: /restrict_public_buckets\s*=\s*false/, type: 'public_access', severity: 'HIGH', message: 'S3 not restricting public buckets' },

  // Container Security
  { pattern: /privileged\s*=\s*true/, type: 'privileged_container', severity: 'HIGH', message: 'Container running privileged' },
  { pattern: /host_network\s*=\s*true/, type: 'host_access', severity: 'HIGH', message: 'Container using host network' },
  { pattern: /host_pid\s*=\s*true/, type: 'host_access', severity: 'HIGH', message: 'Container using host PID namespace' },
  { pattern: /host_ipc\s*=\s*true/, type: 'host_access', severity: 'HIGH', message: 'Container using host IPC namespace' },
  { pattern: /allow_privilege_escalation\s*=\s*true/, type: 'privilege_escalation', severity: 'HIGH', message: 'Container allows privilege escalation' },
  { pattern: /run_as_non_root\s*=\s*false/, type: 'root_container', severity: 'HIGH', message: 'Container can run as root' },
  { pattern: /read_only_root_filesystem\s*=\s*false/, type: 'writable_rootfs', severity: 'MEDIUM', message: 'Container has writable root filesystem' },

  // Data Protection
  { pattern: /skip_final_snapshot\s*=\s*true/, type: 'no_final_snapshot', severity: 'HIGH', message: 'RDS skip_final_snapshot=true - data loss risk' },
  { pattern: /deletion_protection\s*=\s*false/, type: 'no_deletion_protection', severity: 'HIGH', message: 'Deletion protection disabled' },
  { pattern: /backup_retention_period\s*=\s*0/, type: 'no_backups', severity: 'HIGH', message: 'No backup retention configured' },

  // Logging/Monitoring
  { pattern: /enable_logging\s*=\s*false/, type: 'logging_disabled', severity: 'MEDIUM', message: 'Logging disabled' },
  { pattern: /logging_enabled\s*=\s*false/, type: 'logging_disabled', severity: 'MEDIUM', message: 'Logging disabled' },

  // SSL/TLS
  { pattern: /ssl_policy\s*=\s*"ELBSecurityPolicy-2016-08"/, type: 'weak_ssl', severity: 'MEDIUM', message: 'Weak SSL policy (2016)' },
  { pattern: /minimum_protocol_version\s*=\s*"TLSv1"/, type: 'weak_tls', severity: 'HIGH', message: 'TLS 1.0 - deprecated and insecure' },
  { pattern: /minimum_protocol_version\s*=\s*"TLSv1\.1"/, type: 'weak_tls', severity: 'MEDIUM', message: 'TLS 1.1 - deprecated' },
];

function findSecurityIssues(content, filePath) {
  const lines = content.split('\n');
  const violations = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip comments
    if (/^\s*#/.test(line)) continue;

    for (const check of securityChecks) {
      if (check.pattern.test(line)) {
        violations.push({
          file: normalizePath(path.relative(projectRoot, filePath)),
          line: i + 1,
          type: check.type,
          severity: check.severity,
          message: check.message,
        });
      }
    }
  }

  return violations;
}

function runCheck() {
  console.log('Terraform Security Issues Check');
  console.log('='.repeat(80));
  console.log('');

  const files = getTerraformFiles(terraformDir);
  console.log(`Scanning ${files.length} Terraform files...`);
  console.log('');

  const violations = [];

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    violations.push(...findSecurityIssues(content, file));
  }

  console.log('Security Violations');
  console.log('-'.repeat(80));
  console.log('');

  if (violations.length === 0) {
    console.log('✅ No security issues found!');
  } else {
    const high = violations.filter(v => v.severity === 'HIGH').length;
    const medium = violations.filter(v => v.severity === 'MEDIUM').length;

    console.log(`❌ Found ${violations.length} security issue(s) (HIGH: ${high}, MEDIUM: ${medium})`);
    console.log('');

    const byFile = {};
    for (const v of violations) {
      if (!byFile[v.file]) byFile[v.file] = [];
      byFile[v.file].push(v);
    }

    for (const file of Object.keys(byFile).sort()) {
      console.log(`  ❌ ${file}`);
      for (const v of byFile[file]) {
        console.log(`     Line ${v.line}: [${v.severity}] ${v.message}`);
      }
      console.log('');
    }
  }

  console.log('='.repeat(80));
  console.log('Summary');
  console.log('');
  console.log(`Security issues: ${violations.length} violation(s)`);
  console.log('');

  if (violations.length === 0) {
    console.log('✅ All security checks passed!');
  } else {
    console.log('❌ Security issues found. Apply least-privilege principle.');
  }

  console.log('');

  return violations.length > 0 ? 1 : 0;
}

const exitCode = runCheck();
process.exit(exitCode);
