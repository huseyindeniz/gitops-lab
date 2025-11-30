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

// Critical resources that MUST have lifecycle { prevent_destroy = true }
const criticalResources = [
  // Databases - data loss risk
  'aws_db_instance', 'aws_rds_cluster', 'aws_rds_cluster_instance',
  'aws_dynamodb_table', 'aws_dynamodb_global_table',
  'google_sql_database_instance', 'google_sql_database',
  'azurerm_mssql_server', 'azurerm_mssql_database', 'azurerm_postgresql_server',
  'azurerm_cosmosdb_account',

  // Storage - data loss risk
  'aws_s3_bucket', 'aws_efs_file_system', 'aws_fsx_lustre_file_system',
  'google_storage_bucket', 'google_filestore_instance',
  'azurerm_storage_account', 'azurerm_storage_container',

  // Encryption keys - losing these = data unrecoverable
  'aws_kms_key', 'aws_kms_alias',
  'google_kms_crypto_key', 'google_kms_key_ring',
  'azurerm_key_vault', 'azurerm_key_vault_key',

  // Networking - recreation causes downtime
  'aws_vpc', 'aws_subnet', 'aws_internet_gateway',
  'google_compute_network', 'google_compute_subnetwork',
  'azurerm_virtual_network', 'azurerm_subnet',

  // Kubernetes clusters - major downtime
  'aws_eks_cluster', 'aws_eks_node_group',
  'google_container_cluster', 'google_container_node_pool',
  'azurerm_kubernetes_cluster',

  // IAM/Identity - security critical
  'aws_iam_role', 'aws_iam_policy',
  'google_service_account',
  'azurerm_user_assigned_identity',

  // DNS - propagation delays
  'aws_route53_zone', 'google_dns_managed_zone', 'azurerm_dns_zone',

  // Secrets - losing these = service outage
  'aws_secretsmanager_secret',
  'google_secret_manager_secret',
  'azurerm_key_vault_secret',
];

function parseResourceBlock(content, startIndex) {
  let braceCount = 0;
  let started = false;
  let block = '';
  let i = startIndex;

  while (i < content.length) {
    const char = content[i];
    if (char === '{') { braceCount++; started = true; }
    if (char === '}') { braceCount--; }
    if (started) block += char;
    if (started && braceCount === 0) break;
    i++;
  }
  return block;
}

function findLifecycleIssues(content, filePath) {
  const violations = [];
  const relPath = normalizePath(path.relative(projectRoot, filePath));

  const resourceRegex = /resource\s+"([^"]+)"\s+"([^"]+)"\s*\{/g;
  let match;

  while ((match = resourceRegex.exec(content)) !== null) {
    const resourceType = match[1];
    const resourceName = match[2];
    const lineNum = content.substring(0, match.index).split('\n').length;
    const block = parseResourceBlock(content, match.index + match[0].length - 1);

    const hasLifecycle = /lifecycle\s*\{/.test(block);
    const hasPreventDestroy = /prevent_destroy\s*=\s*true/.test(block);

    // Check critical resources need lifecycle with prevent_destroy
    if (criticalResources.includes(resourceType)) {
      if (!hasLifecycle || !hasPreventDestroy) {
        violations.push({
          file: relPath,
          line: lineNum,
          resource: `${resourceType}.${resourceName}`,
          type: 'missing_lifecycle',
          severity: 'HIGH',
          message: `Critical resource "${resourceType}.${resourceName}" needs lifecycle { prevent_destroy = true }`,
        });
      }
    }

    // Check Helm releases need timeout
    if (resourceType === 'helm_release') {
      if (!/timeout\s*=/.test(block)) {
        violations.push({
          file: relPath,
          line: lineNum,
          resource: `${resourceType}.${resourceName}`,
          type: 'helm_missing_timeout',
          severity: 'HIGH',
          message: `Helm release "${resourceName}" needs timeout (default is infinite - can hang CI/CD)`,
        });
      }

      // Check wait = false without timeout is dangerous
      if (/wait\s*=\s*false/.test(block) && !/timeout\s*=/.test(block)) {
        violations.push({
          file: relPath,
          line: lineNum,
          resource: `${resourceType}.${resourceName}`,
          type: 'helm_wait_false',
          severity: 'MEDIUM',
          message: `Helm release "${resourceName}" has wait=false - deployment issues may go unnoticed`,
        });
      }
    }

    // Check kubernetes_manifest needs server_side_apply for large manifests
    if (resourceType === 'kubernetes_manifest') {
      if (!/server_side_apply/.test(block)) {
        violations.push({
          file: relPath,
          line: lineNum,
          resource: `${resourceType}.${resourceName}`,
          type: 'k8s_manifest_no_ssa',
          severity: 'MEDIUM',
          message: `kubernetes_manifest "${resourceName}" - consider server_side_apply for large manifests`,
        });
      }
    }

    // Check kubectl_manifest needs wait
    if (resourceType === 'kubectl_manifest') {
      if (!/wait_for_rollout/.test(block) && !/wait\s*=/.test(block)) {
        violations.push({
          file: relPath,
          line: lineNum,
          resource: `${resourceType}.${resourceName}`,
          type: 'kubectl_no_wait',
          severity: 'MEDIUM',
          message: `kubectl_manifest "${resourceName}" - add wait_for_rollout for proper ordering`,
        });
      }
    }
  }

  return violations;
}

function runCheck() {
  console.log('Terraform Resource Lifecycle Check');
  console.log('='.repeat(80));
  console.log('');

  const files = getTerraformFiles(terraformDir);
  console.log(`Scanning ${files.length} Terraform files...`);
  console.log('');

  const violations = [];

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    violations.push(...findLifecycleIssues(content, file));
  }

  console.log('Resource Lifecycle Violations');
  console.log('-'.repeat(80));
  console.log('');

  if (violations.length === 0) {
    console.log('✅ All critical resources have proper lifecycle configuration!');
  } else {
    const high = violations.filter(v => v.severity === 'HIGH').length;
    const medium = violations.filter(v => v.severity === 'MEDIUM').length;

    console.log(`❌ Found ${violations.length} lifecycle issue(s) (HIGH: ${high}, MEDIUM: ${medium})`);
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
  console.log(`Lifecycle issues: ${violations.length} violation(s)`);
  console.log('');

  if (violations.length === 0) {
    console.log('✅ All lifecycle checks passed!');
  } else {
    console.log('❌ Add lifecycle blocks to protect critical resources.');
  }

  console.log('');

  return violations.length > 0 ? 1 : 0;
}

const exitCode = runCheck();
process.exit(exitCode);
