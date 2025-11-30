# ArgoCD Audit Report

**Generated:** 2025-11-30T14:19:20.301Z
**Project:** gitops-lab

## Executive Summary

| Metric | Value |
|--------|-------|
| **Total Checks** | 11 |
| **Passed** | ✅ 4 |
| **Failed** | ❌ 7 |
| **Success Rate** | 36% |

## Results by Check

| Check | Severity | Status | Summary |
|-------|----------|--------|---------|
| Application Source | HIGH | ✅ PASSED | 0 violation(s) |
| SyncPolicy | HIGH | ❌ FAILED | 25 violation(s) |
| Hardcoded Secrets | HIGH | ❌ FAILED | 3 violation(s) |
| RBAC Wildcards | HIGH | ✅ PASSED | 0 violation(s) |
| Istio Gateway TLS | HIGH | ❌ FAILED | 3 violation(s) |
| Application Project | MEDIUM | ❌ FAILED | 38 violation(s) |
| ApplicationSet | MEDIUM | ❌ FAILED | 2 violation(s) |
| VirtualService | MEDIUM | ❌ FAILED | 35 violation(s) |
| Deprecated APIs | MEDIUM | ✅ PASSED | 0 violation(s) |
| Namespace Spec | LOW | ❌ FAILED | 1 violation(s) |
| Metadata | LOW | ✅ PASSED | 0 violation(s) |

## Passed Checks

- ✅ **Application Source** - 0 violation(s)
- ✅ **RBAC Wildcards** - 0 violation(s)
- ✅ **Deprecated APIs** - 0 violation(s)
- ✅ **Metadata** - 0 violation(s)

## Failed Checks

### ❌ SyncPolicy

**Severity:** HIGH
**Summary:** 25 violation(s)

<details>
<summary>View Details</summary>

```
ArgoCD SyncPolicy Check
================================================================================

Found 62 YAML files to scan

Found 38 Application/ApplicationSet resources

SyncPolicy Violations
--------------------------------------------------------------------------------

❌ Found 25 syncPolicy issue(s) (HIGH: 0, MEDIUM: 0, LOW: 25)

  ❌ flux\apps\local-management\argocd\management.yaml
     Line 17: [LOW] Application "argocd-management" has automated sync but no retry configuration

  ❌ flux\apps\local-management\k8sdashboard\k8sdashboard.yaml
     Line 27: [LOW] Application "k8sdashboard-management" has automated sync but no retry configuration

  ❌ flux\apps\local-management\metallb\management.yaml
     Line 17: [LOW] Application "metallb-management" has automated sync but no retry configuration

  ❌ flux\apps\local-management\metallb\production.yaml
     Line 17: [LOW] Application "metallb-production" has automated sync but no retry configuration

  ❌ flux\apps\local-management\metallb\staging.yaml
     Line 17: [LOW] Application "metallb-staging" has automated sync but no retry configuration

  ❌ flux\apps\local-management\metrics-server\metrics-server.yaml
     Line 19: [LOW] Application "metrics-server-management" has automated sync but no retry configuration

  ❌ flux\apps\local-management\network-debug-app\network-debug-app.yaml
     Line 38: [LOW] ApplicationSet "network-debug-app-management-set" has automated sync but no retry configuration

  ❌ flux\apps\local-management\sample-dotnet\production.yaml
     Line 17: [LOW] Application "sample-dotnet-production-raw-manifests" has automated sync but no retry configuration

  ❌ flux\apps\local-management\sample-dotnet\staging.yaml
     Line 17: [LOW] Application "sample-dotnet-staging-raw-manifests" has automated sync but no retry configuration

  ❌ flux\apps\local-production\k8sdashboard\k8sdashboard.yaml
     Line 27: [LOW] Application "k8sdashboard-prod" has automated sync but no retry configuration

  ❌ flux\apps\local-production\metrics-server\metrics-server.yaml
     Line 19: [LOW] Application "metrics-server-production" has automated sync but no retry configuration

  ❌ flux\apps\local-production\minIO\minio.yaml
     Line 26: [LOW] Application "minio-production" has automated sync but no retry configuration

  ❌ flux\apps\local-production\monitoring\loki-app.yaml
     Line 27: [LOW] Application "mon-loki-production" has automated sync but no retry configuration

  ❌ flux\apps\local-production\monitoring\prometheus-app.yaml
     Line 27: [LOW] Application "mon-prometheus-production" has automated sync but no retry configuration

  ❌ flux\apps\local-production\monitoring\tempo.yaml
     Line 27: [LOW] Application "mon-tempo-production" has automated sync but no retry configuration

  ❌ flux\apps\local-staging\argo-workflows\aw.yaml
     Line 26: [LOW] Application "argo-workflows-staging" has automated sync but no retry configuration

  ❌ flux\apps\local-staging\k8sdashboard\k8sdashboard.yaml
     Line 27: [LOW] Application "k8sdashboard-staging" has automated sync but no retry configuration

  ❌ flux\apps\local-staging\metrics-server\metrics-server.yaml
     Line 19: [LOW] Application "metrics-server-staging" has automated sync but no retry configuration

  ❌ flux\apps\local-staging\minIO\minio.yaml
     Line 26: [LOW] Application "minio-staging" has automated sync but no retry configuration

  ❌ flux\apps\local-staging\monitoring\loki-app.yaml
     Line 27: [LOW] Application "mon-loki-staging" has automated sync but no retry configuration

  ❌ flux\apps\local-staging\monitoring\prometheus-app.yaml
     Line 27: [LOW] Application "mon-prometheus-staging" has automated sync but no retry configuration

  ❌ flux\apps\local-staging\monitoring\tempo.yaml
     Line 27: [LOW] Application "mon-tempo-staging" has automated sync but no retry configuration

  ❌ flux\apps\local-staging\network-debug-app\network-debug.app.yaml
     Line 38: [LOW] ApplicationSet "network-debug-app-staging-set" has automated sync but no retry configuration

  ❌ flux\apps\local-staging\ollama-mcp\ollama.yaml
     Line 26: [LOW] Application "ollama-staging" has automated sync but no retry configuration

  ❌ flux\apps\local-staging\triton\triton.yaml
     Line 27: [LOW] Application "nvidia-triton-staging" has automated sync but no retry configuration

================================================================================
Summary

SyncPolicy issues: 25 violation(s)

❌ SyncPolicy issues found.

Fix: Add syncPolicy with automated: { prune: true, selfHeal: true }
     Add retry configuration for transient failure handling
```

</details>

---

### ❌ Hardcoded Secrets

**Severity:** HIGH
**Summary:** 3 violation(s)

<details>
<summary>View Details</summary>

```
ArgoCD Hardcoded Secrets Check
================================================================================

Found 134 YAML files to scan

Hardcoded Secrets Violations
--------------------------------------------------------------------------------

❌ Found 3 hardcoded secret issue(s) (HIGH: 3, MEDIUM: 0, LOW: 0)

  ❌ flux\apps\local-staging\harbor\values\harbor-values.yaml
     Line 94: [HIGH] Hardcoded password value
     Line 128: [HIGH] Hardcoded secret key

  ❌ raw-manifests\local-staging\argo-workflows\minio-creds.yaml
     Line 7: [HIGH] Secret with stringData: field - plaintext secrets in Git

================================================================================
Summary

Hardcoded secrets issues: 3 violation(s)

❌ Hardcoded secrets found.

Fix: Use External Secrets, Sealed Secrets, or HashiCorp Vault
     Never commit secrets to Git - base64 is encoding, not encryption!
```

</details>

---

### ❌ Istio Gateway TLS

**Severity:** HIGH
**Summary:** 3 violation(s)

<details>
<summary>View Details</summary>

```
ArgoCD Istio Gateway TLS Check
================================================================================

Found 134 YAML files to scan

Found 3 Istio Gateway resources

Istio Gateway TLS Violations
--------------------------------------------------------------------------------

❌ Found 3 Istio Gateway TLS issue(s) (HIGH: 0, MEDIUM: 3, LOW: 0)

  ❌ raw-manifests\local-management\istio\gateway.yaml
     Line 10: [MEDIUM] Gateway "istio-ingressgateway-management # this should match the label of the istio-ingressgateway deployment" has HTTP server without HTTPS counterpart

  ❌ raw-manifests\local-production\istio\gateway.yaml
     Line 10: [MEDIUM] Gateway "istio-ingressgateway-production # this should match the label of the istio-ingressgateway deployment" has HTTP server without HTTPS counterpart

  ❌ raw-manifests\local-staging\istio\gateway.yaml
     Line 10: [MEDIUM] Gateway "istio-ingressgateway-staging # this should match the label of the istio-ingressgateway deployment" has HTTP server without HTTPS counterpart

================================================================================
Summary

Istio Gateway TLS issues: 3 violation(s)

❌ Istio Gateway TLS issues found.

Fix: Add HTTPS server with tls.mode: SIMPLE and credentialName
     Use specific hosts instead of wildcards
```

</details>

---

### ❌ Application Project

**Severity:** MEDIUM
**Summary:** 38 violation(s)

<details>
<summary>View Details</summary>

```
ArgoCD Application Project Check
================================================================================

Found 62 YAML files to scan

Found 38 Application/ApplicationSet resources

Application Project Violations
--------------------------------------------------------------------------------

❌ Found 38 application project issue(s) (HIGH: 0, MEDIUM: 38, LOW: 0)

  ❌ flux\apps\local-management\argocd\management.yaml
     Line 7: [MEDIUM] Application "argocd-management" uses project: default - no source/destination restrictions

  ❌ flux\apps\local-management\istio\istio-ingressgateway.yaml
     Line 7: [MEDIUM] Application "istio-ingressgateway-management" uses project: default - no source/destination restrictions

  ❌ flux\apps\local-management\k8sdashboard\k8sdashboard.yaml
     Line 7: [MEDIUM] Application "k8sdashboard-management" uses project: default - no source/destination restrictions

  ❌ flux\apps\local-management\metallb\management.yaml
     Line 7: [MEDIUM] Application "metallb-management" uses project: default - no source/destination restrictions

  ❌ flux\apps\local-management\metallb\production.yaml
     Line 7: [MEDIUM] Application "metallb-production" uses project: default - no source/destination restrictions

  ❌ flux\apps\local-management\metallb\staging.yaml
     Line 7: [MEDIUM] Application "metallb-staging" uses project: default - no source/destination restrictions

  ❌ flux\apps\local-management\metrics-server\metrics-server.yaml
     Line 7: [MEDIUM] Application "metrics-server-management" uses project: default - no source/destination restrictions

  ❌ flux\apps\local-management\network-debug-app\network-debug-app.yaml
     Line 22: [MEDIUM] ApplicationSet "network-debug-app-management-set" uses project: default - no source/destination restrictions

  ❌ flux\apps\local-management\roots\production-root.yaml
     Line 7: [MEDIUM] Application "argo-production-root" uses project: default - no source/destination restrictions

  ❌ flux\apps\local-management\roots\staging-root.yaml
     Line 7: [MEDIUM] Application "argo-staging-root" uses project: default - no source/destination restrictions

  ❌ flux\apps\local-management\roots\staging-workflows.yaml
     Line 7: [MEDIUM] Application "argo-workflows-staging-root" uses project: default - no source/destination restrictions

  ❌ flux\apps\local-management\sample-dotnet\production.yaml
     Line 7: [MEDIUM] Application "sample-dotnet-production-raw-manifests" uses project: default - no source/destination restrictions

  ❌ flux\apps\local-management\sample-dotnet\staging.yaml
     Line 7: [MEDIUM] Application "sample-dotnet-staging-raw-manifests" uses project: default - no source/destination restrictions

  ❌ flux\apps\local-production\gputest\gputestapp.yaml
     Line 17: [MEDIUM] ApplicationSet "test-gpu-appset-local-production" uses project: default - no source/destination restrictions

  ❌ flux\apps\local-production\istio\istio-ingressgateway.yaml
     Line 7: [MEDIUM] Application "istio-ingressgateway-production" uses project: default - no source/destination restrictions

  ❌ flux\apps\local-production\k8sdashboard\k8sdashboard.yaml
     Line 7: [MEDIUM] Application "k8sdashboard-prod" uses project: default - no source/destination restrictions

  ❌ flux\apps\local-production\metrics-server\metrics-server.yaml
     Line 7: [MEDIUM] Application "metrics-server-production" uses project: default - no source/destination restrictions

  ❌ flux\apps\local-production\minIO\minio.yaml
     Line 7: [MEDIUM] Application "minio-production" uses project: default - no source/destination restrictions

  ❌ flux\apps\local-production\monitoring\loki-app.yaml
     Line 7: [MEDIUM] Application "mon-loki-production" uses project: default - no source/destination restrictions

  ❌ flux\apps\local-production\monitoring\prometheus-app.yaml
     Line 7: [MEDIUM] Application "mon-prometheus-production" uses project: default - no source/destination restrictions

  ❌ flux\apps\local-production\monitoring\tempo.yaml
     Line 7: [MEDIUM] Application "mon-tempo-production" uses project: default - no source/destination restrictions

  ❌ flux\apps\local-production\sample-dotnet\wf.yaml
     Line 34: [MEDIUM] ApplicationSet "sample-dotnet-wf-prod-appset" uses project: default - no source/destination restrictions

  ❌ flux\apps\local-staging\argo-workflows\aw.yaml
     Line 7: [MEDIUM] Application "argo-workflows-staging" uses project: default - no source/destination restrictions

  ❌ flux\apps\local-staging\gputest\gputestapp.yaml
     Line 17: [MEDIUM] ApplicationSet "test-gpu-appset-local-staging" uses project: default - no source/destination restrictions

  ❌ flux\apps\local-staging\harbor\harbor.yaml
     Line 17: [MEDIUM] ApplicationSet "harbor-management" uses project: default - no source/destination restrictions

  ❌ flux\apps\local-staging\istio\istio-ingressgateway.yaml
     Line 7: [MEDIUM] Application "istio-ingressgateway-staging" uses project: default - no source/destination restrictions

  ❌ flux\apps\local-staging\k8sdashboard\k8sdashboard.yaml
     Line 7: [MEDIUM] Application "k8sdashboard-staging" uses project: default - no source/destination restrictions

  ❌ flux\apps\local-staging\metrics-server\metrics-server.yaml
     Line 7: [MEDIUM] Application "metrics-server-staging" uses project: default - no source/destination restrictions

  ❌ flux\apps\local-staging\minIO\minio.yaml
     Line 7: [MEDIUM] Application "minio-staging" uses project: default - no source/destination restrictions

  ❌ flux\apps\local-staging\monitoring\loki-app.yaml
     Line 7: [MEDIUM] Application "mon-loki-staging" uses project: default - no source/destination restrictions

  ❌ flux\apps\local-staging\monitoring\prometheus-app.yaml
     Line 7: [MEDIUM] Application "mon-prometheus-staging" uses project: default - no source/destination restrictions

  ❌ flux\apps\local-staging\monitoring\tempo.yaml
     Line 7: [MEDIUM] Application "mon-tempo-staging" uses project: default - no source/destination restrictions

  ❌ flux\apps\local-staging\network-debug-app\network-debug.app.yaml
     Line 22: [MEDIUM] ApplicationSet "network-debug-app-staging-set" uses project: default - no source/destination restrictions

  ❌ flux\apps\local-staging\ollama-mcp\ollama.yaml
     Line 7: [MEDIUM] Application "ollama-staging" uses project: default - no source/destination restrictions

  ❌ flux\apps\local-staging\sample-ai\sample-ai.yaml
     Line 17: [MEDIUM] ApplicationSet "sample-ai-staging" uses project: default - no source/destination restrictions

  ❌ flux\apps\local-staging\sample-dotnet\wf.yaml
     Line 36: [MEDIUM] ApplicationSet "sample-dotnet-wf-staging-appset" uses project: default - no source/destination restrictions

  ❌ flux\apps\local-staging\sample-game\sample-game.yaml
     Line 17: [MEDIUM] ApplicationSet "sample-game-staging" uses project: default - no source/destination restrictions

  ❌ flux\apps\local-staging\triton\triton.yaml
     Line 7: [MEDIUM] Application "nvidia-triton-staging" uses project: default - no source/destination restrictions

================================================================================
Summary

Application project issues: 38 violation(s)

❌ Application project issues found.

Fix: Create dedicated AppProject with proper sourceRepos and destinations restrictions
     Avoid using the default project for production applications
```

</details>

---

### ❌ ApplicationSet

**Severity:** MEDIUM
**Summary:** 2 violation(s)

<details>
<summary>View Details</summary>

```
ArgoCD ApplicationSet Check
================================================================================

Found 62 YAML files to scan

Found 9 ApplicationSet resources

ApplicationSet Violations
--------------------------------------------------------------------------------

❌ Found 2 ApplicationSet issue(s) (HIGH: 0, MEDIUM: 2, LOW: 0)

  ❌ flux\apps\local-management\network-debug-app\network-debug-app.yaml
     Line 1: [MEDIUM] ApplicationSet "network-debug-app-management-set" missing goTemplate: true - using legacy template engine

  ❌ flux\apps\local-staging\network-debug-app\network-debug.app.yaml
     Line 1: [MEDIUM] ApplicationSet "network-debug-app-staging-set" missing goTemplate: true - using legacy template engine

================================================================================
Summary

ApplicationSet issues: 2 violation(s)

❌ ApplicationSet issues found.

Fix: Enable goTemplate: true with goTemplateOptions: ["missingkey=error"]
     Ensure generators and template are properly defined
```

</details>

---

### ❌ VirtualService

**Severity:** MEDIUM
**Summary:** 35 violation(s)

<details>
<summary>View Details</summary>

```
ArgoCD VirtualService Check
================================================================================

Found 134 YAML files to scan

Found 31 VirtualService resources

VirtualService Violations
--------------------------------------------------------------------------------

❌ Found 35 VirtualService issue(s) (HIGH: 0, MEDIUM: 4, LOW: 31)

  ❌ raw-manifests\local-management\argocd\virtual-service.yaml
     Line 1: [LOW] VirtualService "argocd-vs" has no timeout configured - using default

  ❌ raw-manifests\local-management\k8sdashboard\virtual-service.yaml
     Line 1: [LOW] VirtualService "k8s-dashboard-vs" has no timeout configured - using default

  ❌ raw-manifests\local-management\network-debug-app\local-1\virtual-service-1.yaml
     Line 1: [MEDIUM] VirtualService "network-debug-app-vs-1" has no gateways defined - may be orphaned
     Line 1: [LOW] VirtualService "network-debug-app-vs-1" has no timeout configured - using default

  ❌ raw-manifests\local-management\network-debug-app\local-2\virtual-service-2.yaml
     Line 1: [MEDIUM] VirtualService "network-debug-app-vs-2" has no gateways defined - may be orphaned
     Line 1: [LOW] VirtualService "network-debug-app-vs-2" has no timeout configured - using default

  ❌ raw-manifests\local-production\k8sdashboard\virtual-service.yaml
     Line 1: [LOW] VirtualService "k8s-dashboard-vs" has no timeout configured - using default

  ❌ raw-manifests\local-production\minio\virtual-service-api.yaml
     Line 1: [LOW] VirtualService "minio-api-prod-vs" has no timeout configured - using default

  ❌ raw-manifests\local-production\minio\virtual-service-ui.yaml
     Line 1: [LOW] VirtualService "minio-ui-prod-vs" has no timeout configured - using default

  ❌ raw-manifests\local-production\monitoring\loki\virtual-service.yaml
     Line 1: [LOW] VirtualService "loki-production-vs" has no timeout configured - using default

  ❌ raw-manifests\local-production\monitoring\prometheus\virtual-service.yaml
     Line 1: [LOW] VirtualService "prometheus-production-vs" has no timeout configured - using default

  ❌ raw-manifests\local-production\monitoring\tempo\virtual-service.yaml
     Line 1: [LOW] VirtualService "tempo-production-vs" has no timeout configured - using default

  ❌ raw-manifests\local-production\sample-dotnet\prod-bluegreen\wf-bg-preview-vs.yaml
     Line 1: [LOW] VirtualService "sample-dotnet-wf-prod-bluegreen-preview-vs" has no timeout configured - using default

  ❌ raw-manifests\local-production\sample-dotnet\prod-bluegreen\wf-bg-ws.yaml
     Line 1: [LOW] VirtualService "sample-dotnet-wf-prod-bluegreen-vs" has no timeout configured - using default

  ❌ raw-manifests\local-production\sample-dotnet\prod-canary\wf-canary-ws.yaml
     Line 1: [LOW] VirtualService "sample-dotnet-wf-prod-canary-vs" has no timeout configured - using default

  ❌ raw-manifests\local-staging\argo-workflows\virtual-service.yaml
     Line 1: [LOW] VirtualService "argo-workflows-vs" has no timeout configured - using default

  ❌ raw-manifests\local-staging\harbor\virtual-service.yaml
     Line 1: [LOW] VirtualService "harbor-vs" has no timeout configured - using default

  ❌ raw-manifests\local-staging\k8sdashboard\virtual-service.yaml
     Line 1: [LOW] VirtualService "k8s-dashboard-vs" has no timeout configured - using default

  ❌ raw-manifests\local-staging\minio\virtual-service-api.yaml
     Line 1: [LOW] VirtualService "minio-api-staging-vs" has no timeout configured - using default

  ❌ raw-manifests\local-staging\minio\virtual-service-ui.yaml
     Line 1: [LOW] VirtualService "minio-ui-staging-vs" has no timeout configured - using default

  ❌ raw-manifests\local-staging\monitoring\loki\virtual-service.yaml
     Line 1: [LOW] VirtualService "loki-staging-vs" has no timeout configured - using default

  ❌ raw-manifests\local-staging\monitoring\prometheus\virtual-service.yaml
     Line 1: [LOW] VirtualService "prometheus-staging-vs" has no timeout configured - using default

  ❌ raw-manifests\local-staging\monitoring\tempo\virtual-service.yaml
     Line 1: [LOW] VirtualService "tempo-staging-vs" has no timeout configured - using default

  ❌ raw-manifests\local-staging\network-debug-app\local-3\virtual-service-3.yaml
     Line 1: [MEDIUM] VirtualService "network-debug-app-vs-3" has no gateways defined - may be orphaned
     Line 1: [LOW] VirtualService "network-debug-app-vs-3" has no timeout configured - using default

  ❌ raw-manifests\local-staging\network-debug-app\local-4\virtual-service-4.yaml
     Line 1: [MEDIUM] VirtualService "network-debug-app-vs-4" has no gateways defined - may be orphaned
     Line 1: [LOW] VirtualService "network-debug-app-vs-4" has no timeout configured - using default

  ❌ raw-manifests\local-staging\ollama-mcp\ollama\virtual-service-ui.yaml
     Line 1: [LOW] VirtualService "ollama-staging-vs" has no timeout configured - using default

  ❌ raw-manifests\local-staging\sample-ai\frontend-vs.yaml
     Line 1: [LOW] VirtualService "sample-ai-frontend-vs" has no timeout configured - using default

  ❌ raw-manifests\local-staging\sample-ai\inference-api-vs.yaml
     Line 1: [LOW] VirtualService "sample-ai-inference-api-vs" has no timeout configured - using default

  ❌ raw-manifests\local-staging\sample-dotnet\stag-1\wf-vs.yaml
     Line 1: [LOW] VirtualService "sample-dotnet-wf-stag-1-vs" has no timeout configured - using default

  ❌ raw-manifests\local-staging\sample-dotnet\stag-2\wf-vs.yaml
     Line 1: [LOW] VirtualService "sample-dotnet-wf-stag-2-vs" has no timeout configured - using default

  ❌ raw-manifests\local-staging\sample-game\backend-vs.yaml
     Line 1: [LOW] VirtualService "sample-game-backend-vs" has no timeout configured - using default

  ❌ raw-manifests\local-staging\sample-game\frontend-vs.yaml
     Line 1: [LOW] VirtualService "sample-game-frontend-vs" has no timeout configured - using default

  ❌ raw-manifests\local-staging\triton\virtual-service.yaml
     Line 1: [LOW] VirtualService "triton-staging-vs" has no timeout configured - using default

================================================================================
Summary

VirtualService issues: 35 violation(s)

❌ VirtualService issues found.

Fix: Associate VirtualService with valid Gateway
     Use specific hosts instead of wildcards
     Ensure routes have proper destinations
```

</details>

---

### ❌ Namespace Spec

**Severity:** LOW
**Summary:** 1 violation(s)

<details>
<summary>View Details</summary>

```
ArgoCD Namespace Specification Check
================================================================================

Found 134 YAML files to scan

Namespace Specification Violations
--------------------------------------------------------------------------------

❌ Found 1 namespace specification issue(s) (HIGH: 0, MEDIUM: 0, LOW: 1)

  ❌ flux\apps\argo-workflow-templates\local-staging\tests\mySampleApp1-fitness-tests.yaml
     Line 1: [LOW] WorkflowTemplate "my-sample-app-1-fitness-tests" has no namespace specified - relies on kubectl context

================================================================================
Summary

Namespace specification issues: 1 violation(s)

❌ Namespace specification issues found.

Fix: Add explicit namespace field to metadata:
     metadata:
       name: my-resource
       namespace: my-namespace
```

</details>

---

## Recommendations

1. **Immediate (HIGH):** Fix syncpolicy, hardcoded secrets, istio gateway tls
2. **Short-term (MEDIUM):** Address application project, applicationset, virtualservice
3. **Long-term (LOW):** Improve namespace spec

## Next Steps

1. Address failed checks in priority order (HIGH -> MEDIUM -> LOW)
2. Run individual check scripts for detailed violation analysis
3. Re-run `generate_report.mjs` after fixes to verify improvements

---

*Generated by argocd-audit skill*
