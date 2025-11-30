# Terraform Audit Report

**Generated:** 2025-11-30T14:19:30.863Z
**Project:** gitops-lab

## Executive Summary

| Metric | Value |
|--------|-------|
| **Total Checks** | 9 |
| **Passed** | ✅ 2 |
| **Failed** | ❌ 7 |
| **Success Rate** | 22% |

## Results by Check

| Check | Severity | Status | Summary |
|-------|----------|--------|---------|
| Hardcoded Secrets | HIGH | ❌ FAILED | 6 violation(s) |
| Security Issues | HIGH | ❌ FAILED | 8 violation(s) |
| Missing Versions | HIGH | ✅ PASSED | 0 violation(s) |
| Resource Lifecycle | HIGH | ❌ FAILED | 19 violation(s) |
| Deprecated Syntax | HIGH | ✅ PASSED | 0 violation(s) |
| Module Structure | MEDIUM | ❌ FAILED | 30 violation(s) |
| Dependency Issues | MEDIUM | ❌ FAILED | 3 violation(s) |
| Missing Descriptions | LOW | ❌ FAILED | 27 violation(s) |
| Naming Conventions | LOW | ❌ FAILED | 2 violation(s) |

## Passed Checks

- ✅ **Missing Versions** - 0 violation(s)
- ✅ **Deprecated Syntax** - 0 violation(s)

## Failed Checks

### ❌ Hardcoded Secrets

**Severity:** HIGH
**Summary:** 6 violation(s)

<details>
<summary>View Details</summary>

```
Terraform Hardcoded Secrets Check
================================================================================

Scanning 114 Terraform files...

Hardcoded Secrets Violations
--------------------------------------------------------------------------------

❌ Found 6 hardcoded secret(s) (HIGH: 5, MEDIUM: 1, LOW: 0)

  ❌ terraform/local-management/terraform.tfvars
     Line 8: [HIGH] flux_github_pat (github_fine_grained_pat)
     Line 10: [HIGH] local_staging_cluster_bearer_token (jwt_token)
     Line 12: [HIGH] local_production_cluster_bearer_token (jwt_token)
     Line 14: [MEDIUM] github_oauth_client_secret (potential_oauth_secret)

  ❌ terraform/local-production/terraform.tfvars
     Line 8: [HIGH] github_arc_pat (github_classic_pat)

  ❌ terraform/local-staging/terraform.tfvars
     Line 6: [HIGH] github_arc_pat (github_classic_pat)

================================================================================
Summary

Hardcoded secrets: 6 violation(s)

❌ Hardcoded secrets found.

Fix: Use variables, random_password, or secret managers instead.
```

</details>

---

### ❌ Security Issues

**Severity:** HIGH
**Summary:** 8 violation(s)

<details>
<summary>View Details</summary>

```
Terraform Security Issues Check
================================================================================

Scanning 111 Terraform files...

Security Violations
--------------------------------------------------------------------------------

❌ Found 8 security issue(s) (HIGH: 8, MEDIUM: 0)

  ❌ terraform/local-production/argo.tf
     Line 44: [HIGH] K8s RBAC with api_groups: ["*"]
     Line 45: [HIGH] K8s RBAC with resources: ["*"]
     Line 46: [HIGH] K8s RBAC with verbs: ["*"]
     Line 51: [HIGH] K8s RBAC with verbs: ["*"]

  ❌ terraform/local-staging/argo.tf
     Line 44: [HIGH] K8s RBAC with api_groups: ["*"]
     Line 45: [HIGH] K8s RBAC with resources: ["*"]
     Line 46: [HIGH] K8s RBAC with verbs: ["*"]
     Line 51: [HIGH] K8s RBAC with verbs: ["*"]

================================================================================
Summary

Security issues: 8 violation(s)

❌ Security issues found. Apply least-privilege principle.
```

</details>

---

### ❌ Resource Lifecycle

**Severity:** HIGH
**Summary:** 19 violation(s)

<details>
<summary>View Details</summary>

```
Terraform Resource Lifecycle Check
================================================================================

Scanning 111 Terraform files...

Resource Lifecycle Violations
--------------------------------------------------------------------------------

❌ Found 19 lifecycle issue(s) (HIGH: 14, MEDIUM: 5)

  ❌ terraform/azure/cluster.tf
     Line 19: [HIGH] Critical resource "azurerm_kubernetes_cluster.default" needs lifecycle { prevent_destroy = true }

  ❌ terraform/gke/cluster.tf
     Line 7: [HIGH] Critical resource "google_container_cluster.primary" needs lifecycle { prevent_destroy = true }
     Line 22: [HIGH] Critical resource "google_container_node_pool.primary_nodes" needs lifecycle { prevent_destroy = true }
     Line 49: [HIGH] Critical resource "google_container_node_pool.secondary_nodes" needs lifecycle { prevent_destroy = true }

  ❌ terraform/local-management/main.tf
     Line 99: [MEDIUM] kubectl_manifest "argo_management_root" - add wait_for_rollout for proper ordering

  ❌ terraform/modules/arc-runners/main.tf
     Line 14: [HIGH] Helm release "arc_scale_set_controller" needs timeout (default is infinite - can hang CI/CD)
     Line 27: [HIGH] Helm release "dynamic_provision_volume_openebs" needs timeout (default is infinite - can hang CI/CD)
     Line 50: [HIGH] Helm release "arc_runner" needs timeout (default is infinite - can hang CI/CD)

  ❌ terraform/modules/argo-rollouts/main.tf
     Line 1: [HIGH] Helm release "argo_rollouts" needs timeout (default is infinite - can hang CI/CD)

  ❌ terraform/modules/argo/main.tf
     Line 3: [HIGH] Helm release "argo_cd" needs timeout (default is infinite - can hang CI/CD)

  ❌ terraform/modules/cert-manager/main.tf
     Line 2: [HIGH] Helm release "cert_manager" needs timeout (default is infinite - can hang CI/CD)

  ❌ terraform/modules/istio/main.tf
     Line 1: [HIGH] Helm release "istio_base" needs timeout (default is infinite - can hang CI/CD)
     Line 13: [HIGH] Helm release "istiod" needs timeout (default is infinite - can hang CI/CD)
     Line 27: [MEDIUM] kubernetes_manifest "self_signed_issuer" - consider server_side_apply for large manifests
     Line 37: [MEDIUM] kubernetes_manifest "self_signed_certificate" - consider server_side_apply for large manifests
     Line 48: [HIGH] Helm release "istio_ingress" needs timeout (default is infinite - can hang CI/CD)

  ❌ terraform/modules/metalLB/main.tf
     Line 1: [HIGH] Helm release "metallb" needs timeout (default is infinite - can hang CI/CD)

  ❌ terraform/modules/postgresql/postgresql.tf
     Line 46: [MEDIUM] kubectl_manifest "postgresql_cluster" - add wait_for_rollout for proper ordering

  ❌ terraform/modules/redis/redis.tf
     Line 3: [MEDIUM] kubectl_manifest "redis_standalone" - add wait_for_rollout for proper ordering

================================================================================
Summary

Lifecycle issues: 19 violation(s)

❌ Add lifecycle blocks to protect critical resources.
```

</details>

---

### ❌ Module Structure

**Severity:** MEDIUM
**Summary:** 30 violation(s)

<details>
<summary>View Details</summary>

```
Terraform Module Structure Check
================================================================================

Checking 15 module(s) in terraform/modules/...
Checking 6 root module(s)...

Module Structure Violations
--------------------------------------------------------------------------------

❌ Found 30 structure issue(s)

  ❌ terraform/modules/arc-runners
     Module "arc-runners" missing README.md

  ❌ terraform/modules/argo
     Module "argo" missing README.md

  ❌ terraform/modules/argo-rollouts
     Module "argo-rollouts" missing README.md

  ❌ terraform/modules/cert-manager
     Module "cert-manager" missing README.md

  ❌ terraform/modules/cloudnative-pg-operator
     Module "cloudnative-pg-operator" missing README.md

  ❌ terraform/modules/flux
     Module "flux" missing README.md

  ❌ terraform/modules/istio
     Module "istio" missing README.md

  ❌ terraform/modules/metalLB
     Module "metalLB" missing README.md

  ❌ terraform/modules/minio-operator
     Module "minio-operator" missing README.md

  ❌ terraform/modules/postgresql
     Module "postgresql" missing README.md

  ❌ terraform/modules/redis
     Module "redis" missing README.md

  ❌ terraform/modules/redis-operator
     Module "redis-operator" missing README.md

  ❌ terraform/modules/sample-dotnet
     Module "sample-dotnet" missing README.md

  ❌ terraform/modules/versions
     Module "versions" missing versions.tf

  ❌ terraform/aws
     Module "aws" missing README.md

  ❌ terraform/aws
     Module "aws" missing versions.tf

  ❌ terraform/aws
     Root module "aws" has no backend (uses local state)

  ❌ terraform/azure
     Module "azure" missing README.md

  ❌ terraform/azure
     Module "azure" missing versions.tf

  ❌ terraform/azure
     Root module "azure" has no backend (uses local state)

  ❌ terraform/gke
     Module "gke" missing README.md

  ❌ terraform/gke
     Module "gke" missing versions.tf

  ❌ terraform/gke
     Root module "gke" has no backend (uses local state)

  ❌ terraform/local-management
     Module "local-management" missing README.md

  ❌ terraform/local-management
     Root module "local-management" has no backend (uses local state)

  ❌ terraform/local-production
     Module "local-production" missing README.md

  ❌ terraform/local-production
     Module "local-production" has 12 .tf files - consider splitting

  ❌ terraform/local-production
     Root module "local-production" has no backend (uses local state)

  ❌ terraform/local-staging
     Module "local-staging" missing README.md

  ❌ terraform/local-staging
     Module "local-staging" has 16 .tf files - consider splitting

================================================================================
Summary

Structure issues: 30 violation(s)

❌ Fix module structure issues for consistency.
```

</details>

---

### ❌ Dependency Issues

**Severity:** MEDIUM
**Summary:** 3 violation(s)

<details>
<summary>View Details</summary>

```
Terraform Dependency Issues Check
================================================================================

Scanning 111 Terraform files...

Dependency Issue Violations
--------------------------------------------------------------------------------

❌ Found 3 dependency issue(s)

  ❌ terraform/local-management/main.tf
     Line 1: File has 7 depends_on blocks - consider implicit dependencies

  ❌ terraform/local-production/main.tf
     Line 1: File has 7 depends_on blocks - consider implicit dependencies

  ❌ terraform/local-staging/main.tf
     Line 1: File has 6 depends_on blocks - consider implicit dependencies

================================================================================
Summary

Dependency issues: 3 violation(s)

❌ Use implicit dependencies where possible.
```

</details>

---

### ❌ Missing Descriptions

**Severity:** LOW
**Summary:** 27 violation(s)

<details>
<summary>View Details</summary>

```
Terraform Missing Descriptions Check
================================================================================

Scanning 111 Terraform files...

Missing Descriptions
--------------------------------------------------------------------------------

❌ Found 27 missing description(s) (variables: 17, outputs: 10)

  ❌ terraform/azure/outputs.tf
     Line 1: Output "resource_group_name" has no description
     Line 5: Output "kubernetes_cluster_name" has no description

  ❌ terraform/gke/variables.tf
     Line 6: Variable "region" has no description
     Line 11: Variable "zone" has no description
     Line 16: Variable "project" has no description

  ❌ terraform/local-management/outputs.tf
     Line 8: Output "dashboard_token" has no description

  ❌ terraform/local-management/variables.tf
     Line 3: Variable "kubeconfig_path" has no description
     Line 8: Variable "kubeconfig_context" has no description
     Line 54: Variable "local_staging_cluster_bearer_token" has no description
     Line 59: Variable "local_staging_cluster_server_url" has no description
     Line 63: Variable "local_production_cluster_bearer_token" has no description
     Line 68: Variable "local_production_cluster_server_url" has no description

  ❌ terraform/local-production/outputs.tf
     Line 9: Output "dashboard_token" has no description
     Line 16: Output "sample_dotnet_wf_postgresql_db_info" has no description

  ❌ terraform/local-production/variables.tf
     Line 3: Variable "kubeconfig_path" has no description
     Line 8: Variable "kubeconfig_context" has no description

  ❌ terraform/local-staging/outputs.tf
     Line 9: Output "dashboard_token" has no description
     Line 16: Output "sample_dotnet_wf_postgresql_db_info" has no description

  ❌ terraform/local-staging/variables.tf
     Line 3: Variable "kubeconfig_path" has no description
     Line 8: Variable "kubeconfig_context" has no description

  ❌ terraform/modules/argo-rollouts/outputs.tf
     Line 1: Output "argo_rollouts_release" has no description

  ❌ terraform/modules/flux/variables.tf
     Line 3: Variable "kubeconfig_path" has no description
     Line 7: Variable "kubeconfig_context" has no description

  ❌ terraform/modules/postgresql/outputs.tf
     Line 1: Output "postgresql_db_info" has no description

  ❌ terraform/modules/sample-dotnet/outputs.tf
     Line 1: Output "sample_dotnet_wf_postgresql_db_info" has no description

  ❌ terraform/modules/sample-dotnet/variables.tf
     Line 1: Variable "app_ns_prefix_sample_dotnet_wf" has no description
     Line 5: Variable "env_list" has no description

================================================================================
Summary

Missing descriptions: 27 violation(s)

❌ Add descriptions for better documentation.
```

</details>

---

### ❌ Naming Conventions

**Severity:** LOW
**Summary:** 2 violation(s)

<details>
<summary>View Details</summary>

```
Terraform Naming Conventions Check
================================================================================

Scanning 111 Terraform files...

Naming Convention Violations
--------------------------------------------------------------------------------

❌ Found 2 naming issue(s) (camelCase: 2, kebab-case: 0)

  ❌ terraform/azure/variables.tf
     Line 6: Variable "subscriptionId" uses camelCase - use snake_case
     Line 11: Variable "appId" uses camelCase - use snake_case

================================================================================
Summary

Naming issues: 2 violation(s)

❌ Use snake_case for all Terraform identifiers.
```

</details>

---

## Recommendations

1. **Immediate (HIGH):** Fix hardcoded secrets, security issues, resource lifecycle
2. **Short-term (MEDIUM):** Address module structure, dependency issues
3. **Long-term (LOW):** Improve missing descriptions, naming conventions

## Next Steps

1. Address failed checks in priority order (HIGH → MEDIUM → LOW)
2. Run individual check scripts for detailed violation analysis
3. Re-run `generate_report.mjs` after fixes to verify improvements

---

*Generated by terraform-audit skill*
