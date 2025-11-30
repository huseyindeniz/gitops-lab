# Helm Charts Audit Report

**Generated:** 2025-11-30T14:19:55.380Z
**Project:** gitops-lab

## Executive Summary

| Metric | Value |
|--------|-------|
| **Total Checks** | 13 |
| **Passed** | ✅ 3 |
| **Failed** | ❌ 10 |
| **Success Rate** | 23% |

## Results by Check

| Check | Severity | Status | Summary |
|-------|----------|--------|---------|
| Image Tags | HIGH | ❌ FAILED | 6 violation(s) |
| Security Context | HIGH | ✅ PASSED | 0 violation(s) |
| Resource Limits | HIGH | ❌ FAILED | 11 violation(s) |
| RBAC Wildcards | HIGH | ✅ PASSED | 0 violation(s) |
| Health Probes | HIGH | ❌ FAILED | 14 violation(s) |
| Helm Lint | HIGH | ❌ FAILED | 2 violation(s) |
| Chart Metadata | MEDIUM | ❌ FAILED | 13 violation(s) |
| Chart Structure | MEDIUM | ❌ FAILED | 39 violation(s) |
| Dependencies | MEDIUM | ✅ PASSED | 0 violation(s) |
| Deprecated APIs | MEDIUM | ❌ FAILED | 6 violation(s) |
| Argo Rollouts | MEDIUM | ❌ FAILED | 8 violation(s) |
| Ingress TLS | MEDIUM | ❌ FAILED | 13 violation(s) |
| GPU Resources | LOW | ❌ FAILED | 8 violation(s) |

## Passed Checks

- ✅ **Security Context** - 0 violation(s)
- ✅ **RBAC Wildcards** - 0 violation(s)
- ✅ **Dependencies** - 0 violation(s)

## Failed Checks

### ❌ Image Tags

**Severity:** HIGH
**Summary:** 6 violation(s)

<details>
<summary>View Details</summary>

```
Helm Charts Image Tags Check
================================================================================

Found 9 Helm charts to scan

Image Tags Violations
--------------------------------------------------------------------------------

❌ Found 6 image tag issue(s) (HIGH: 3, MEDIUM: 3)

  ❌ dotnet-core-webapi/
     Line 64: [HIGH] Mutable default tag "latest" in values - use immutable tags

  ❌ networking-debug-pod/
     Line 5: [HIGH] Mutable default tag "latest" in values - use immutable tags

  ❌ nodejs-app/
     Line 14: [MEDIUM] Empty tag field - ensure a valid tag is provided at deploy time

  ❌ python-app/
     Line 11: [MEDIUM] Empty tag field - ensure a valid tag is provided at deploy time
     Line 12: [HIGH] Image "busybox" has no tag (defaults to :latest)

  ❌ static-website/
     Line 11: [MEDIUM] Empty tag field - ensure a valid tag is provided at deploy time

================================================================================
Summary

Image tag issues: 6 violation(s)

❌ Image tag issues found.

Fix: Use immutable tags (SemVer like v1.2.3 or SHA digests)
```

</details>

---

### ❌ Resource Limits

**Severity:** HIGH
**Summary:** 11 violation(s)

<details>
<summary>View Details</summary>

```
Helm Charts Resource Limits Check
================================================================================

Found 9 Helm charts to scan

Resource Limits Violations
--------------------------------------------------------------------------------

❌ Found 11 resource limit issue(s) (HIGH: 11, MEDIUM: 0)

  ❌ gputest/
     Line 13: [HIGH] No resource requests defined - scheduler cannot make informed decisions
     Line 13: [HIGH] No memory limit defined - container can cause node OOM

  ❌ networking-debug-pod/
     Line 9: [HIGH] Empty resources block - no limits or requests defined

  ❌ nodejs-app/
     Line 51: [HIGH] No resource requests defined - scheduler cannot make informed decisions
     Line 51: [HIGH] No resource limits defined - container can consume all node resources

  ❌ ntis/
     Line 55: [HIGH] No resource requests defined - scheduler cannot make informed decisions
     Line 55: [HIGH] No memory limit defined - container can cause node OOM

  ❌ python-app/
     Line 62: [HIGH] No resource requests defined - scheduler cannot make informed decisions
     Line 62: [HIGH] No resource limits defined - container can consume all node resources

  ❌ static-website/
     Line 46: [HIGH] No resource requests defined - scheduler cannot make informed decisions
     Line 46: [HIGH] No resource limits defined - container can consume all node resources

================================================================================
Summary

Resource limits issues: 11 violation(s)

❌ Resource limit issues found.

Fix: Define proper resources with:
  resources:
    requests:
      cpu: 100m
      memory: 128Mi
    limits:
      memory: 256Mi
```

</details>

---

### ❌ Health Probes

**Severity:** HIGH
**Summary:** 14 violation(s)

<details>
<summary>View Details</summary>

```
Helm Charts Health Probes Check
================================================================================

Found 9 Helm charts to scan

Health Probes Violations
--------------------------------------------------------------------------------

❌ Found 14 health probe issue(s) (HIGH: 14, MEDIUM: 0, LOW: 0)

  ❌ dotnet-core-webapi/
     Line 3: [HIGH] Deployment/{{ - No livenessProbe defined - stuck containers won't be restarted
     Line 3: [HIGH] Deployment/{{ - No readinessProbe defined - traffic may be sent to unready pods
     Line 12: [HIGH] HorizontalPodAutoscaler/{{ - No livenessProbe defined - stuck containers won't be restarted
     Line 12: [HIGH] HorizontalPodAutoscaler/{{ - No readinessProbe defined - traffic may be sent to unready pods
     Line 12: [HIGH] VerticalPodAutoscaler/{{ - No livenessProbe defined - stuck containers won't be restarted
     Line 12: [HIGH] VerticalPodAutoscaler/{{ - No readinessProbe defined - traffic may be sent to unready pods

  ❌ networking-debug-pod/
     Line 2: [HIGH] Deployment/{{ - No livenessProbe defined - stuck containers won't be restarted
     Line 2: [HIGH] Deployment/{{ - No readinessProbe defined - traffic may be sent to unready pods

  ❌ nodejs-app/
     Line 11: [HIGH] HorizontalPodAutoscaler/{{ - No livenessProbe defined - stuck containers won't be restarted
     Line 11: [HIGH] HorizontalPodAutoscaler/{{ - No readinessProbe defined - traffic may be sent to unready pods

  ❌ python-app/
     Line 11: [HIGH] HorizontalPodAutoscaler/{{ - No livenessProbe defined - stuck containers won't be restarted
     Line 11: [HIGH] HorizontalPodAutoscaler/{{ - No readinessProbe defined - traffic may be sent to unready pods

  ❌ static-website/
     Line 11: [HIGH] HorizontalPodAutoscaler/{{ - No livenessProbe defined - stuck containers won't be restarted
     Line 11: [HIGH] HorizontalPodAutoscaler/{{ - No readinessProbe defined - traffic may be sent to unready pods

================================================================================
Summary

Health probe issues: 14 violation(s)

❌ Health probe issues found.

Fix: Add proper health probes:
  livenessProbe:
    httpGet:
      path: /healthz
      port: 8080
    initialDelaySeconds: 10
    periodSeconds: 10
  readinessProbe:
    httpGet:
      path: /ready
      port: 8080
    initialDelaySeconds: 5
    periodSeconds: 5
```

</details>

---

### ❌ Helm Lint

**Severity:** HIGH
**Summary:** 2 violation(s)

<details>
<summary>View Details</summary>

```
Helm Charts Lint Check
================================================================================

Helm version: v3.17.0+g301108e

Found 9 Helm charts to lint

Linting dotnet-core-webapi... OK
Linting gputest... OK
Linting networking-debug-pod... OK
Linting nodejs-app... OK
Linting ntis... OK
Linting python-app... FAILED
Linting sample-ai... FAILED
Linting sample-game... OK
Linting static-website... OK

Helm Lint Violations
--------------------------------------------------------------------------------

❌ Found 12 lint issue(s) (HIGH: 2, MEDIUM: 0, LOW: 10)

  ❌ dotnet-core-webapi/
     [LOW] Chart.yaml: icon is recommended

  ❌ gputest/
     [LOW] Chart.yaml: icon is recommended
     [LOW] values.yaml: file does not exist

  ❌ networking-debug-pod/
     [LOW] Chart.yaml: icon is recommended

  ❌ nodejs-app/
     [LOW] Chart.yaml: icon is recommended

  ❌ ntis/
     [LOW] Chart.yaml: icon is recommended

  ❌ python-app/
     [LOW] Chart.yaml: icon is recommended
     [HIGH] templates/: template: python-app/templates/deployment.yaml:45:32: executing "python-app/templates/deployment.yaml" at <.Values.env.FLASK_ENV>: nil pointer evaluating interface {}.FLASK_ENV

  ❌ sample-ai/
     [LOW] Chart.yaml: icon is recommended
     [HIGH] templates/: template: sample-ai/charts/inference-api/templates/deployment.yaml:45:32: executing "sample-ai/charts/inference-api/templates/deployment.yaml" at <.Values.env.FLASK_ENV>: nil pointer evaluating interface {}.FLASK_ENV

  ❌ sample-game/
     [LOW] Chart.yaml: icon is recommended

  ❌ static-website/
     [LOW] Chart.yaml: icon is recommended

================================================================================
Summary

Helm lint: 2 failed, 0 warnings, 7 passed

❌ Helm lint issues found.

Failed charts:
  - python-app
  - sample-ai

Fix: Run "helm lint <chart-path>" for detailed error messages
```

</details>

---

### ❌ Chart Metadata

**Severity:** MEDIUM
**Summary:** 13 violation(s)

<details>
<summary>View Details</summary>

```
Helm Charts Metadata Check
================================================================================

Found 9 Helm charts to scan

Chart Metadata Violations
--------------------------------------------------------------------------------

❌ Found 13 metadata issue(s) (HIGH: 0, MEDIUM: 12, LOW: 1)

  ❌ dotnet-core-webapi/
     helm-charts/dotnet-core-webapi/Chart.yaml:1: [MEDIUM] Missing maintainers section - important for chart ownership

  ❌ gputest/
     helm-charts/gputest/Chart.yaml:1: [LOW] Missing appVersion in Chart.yaml - recommended for tracking application version
     helm-charts/gputest/Chart.yaml:1: [MEDIUM] Missing maintainers section - important for chart ownership

  ❌ networking-debug-pod/
     helm-charts/networking-debug-pod/Chart.yaml:2: [MEDIUM] Chart name "debug-pod" doesn't match directory name "networking-debug-pod"
     helm-charts/networking-debug-pod/Chart.yaml:1: [MEDIUM] Missing maintainers section - important for chart ownership

  ❌ nodejs-app/
     helm-charts/nodejs-app/Chart.yaml:1: [MEDIUM] Missing maintainers section - important for chart ownership

  ❌ ntis/
     helm-charts/ntis/Chart.yaml:27: [MEDIUM] Using apiVersion: v1 (Helm 2) - upgrade to apiVersion: v2 (Helm 3)
     helm-charts/ntis/Chart.yaml:30: [MEDIUM] Chart name "triton-inference-server" doesn't match directory name "ntis"
     helm-charts/ntis/Chart.yaml:1: [MEDIUM] Missing maintainers section - important for chart ownership

  ❌ python-app/
     helm-charts/python-app/Chart.yaml:1: [MEDIUM] Missing maintainers section - important for chart ownership

  ❌ sample-ai/
     helm-charts/sample-ai/Chart.yaml:1: [MEDIUM] Missing maintainers section - important for chart ownership

  ❌ sample-game/
     helm-charts/sample-game/Chart.yaml:1: [MEDIUM] Missing maintainers section - important for chart ownership

  ❌ static-website/
     helm-charts/static-website/Chart.yaml:1: [MEDIUM] Missing maintainers section - important for chart ownership

================================================================================
Summary

Metadata issues: 13 violation(s)

❌ Fix: Ensure Chart.yaml has:
  - apiVersion: v2
  - name: matching-directory-name
  - version: 1.0.0 (SemVer)
  - description: A meaningful description
  - maintainers: with name and email
```

</details>

---

### ❌ Chart Structure

**Severity:** MEDIUM
**Summary:** 39 violation(s)

<details>
<summary>View Details</summary>

```
Helm Charts Structure Check
================================================================================

Found 9 Helm charts to scan

Chart Structure Violations
--------------------------------------------------------------------------------

❌ Found 39 structure issue(s) (HIGH: 0, MEDIUM: 10, LOW: 29)

  ❌ dotnet-core-webapi/
     [MEDIUM] Missing README.md: README.md helps users understand how to use the chart
     [LOW] Missing templates/NOTES.txt: NOTES.txt provides post-install instructions
     [LOW] Missing .helmignore: .helmignore excludes files from packaged chart
     [LOW] values.schema.json provides validation for values.yaml
     [LOW] No test templates found - consider adding helm test hooks

  ❌ gputest/
     [MEDIUM] Missing values.yaml: values.yaml is recommended for configurable charts
     [MEDIUM] Missing README.md: README.md helps users understand how to use the chart
     [LOW] Missing templates/NOTES.txt: NOTES.txt provides post-install instructions
     [LOW] Missing templates/_helpers.tpl: _helpers.tpl organizes template helpers
     [LOW] Missing .helmignore: .helmignore excludes files from packaged chart
     [LOW] values.schema.json provides validation for values.yaml
     [LOW] No test templates found - consider adding helm test hooks

  ❌ networking-debug-pod/
     [MEDIUM] Missing README.md: README.md helps users understand how to use the chart
     [LOW] Missing templates/NOTES.txt: NOTES.txt provides post-install instructions
     [LOW] Missing templates/_helpers.tpl: _helpers.tpl organizes template helpers
     [LOW] Missing .helmignore: .helmignore excludes files from packaged chart
     [LOW] values.schema.json provides validation for values.yaml
     [LOW] No test templates found - consider adding helm test hooks

  ❌ nodejs-app/
     [MEDIUM] Missing README.md: README.md helps users understand how to use the chart
     [LOW] values.schema.json provides validation for values.yaml
     [LOW] No test templates found - consider adding helm test hooks

  ❌ ntis/
     [MEDIUM] Missing README.md: README.md helps users understand how to use the chart
     [LOW] Missing templates/NOTES.txt: NOTES.txt provides post-install instructions
     [LOW] Missing .helmignore: .helmignore excludes files from packaged chart
     [LOW] values.schema.json provides validation for values.yaml
     [LOW] No test templates found - consider adding helm test hooks

  ❌ python-app/
     [MEDIUM] Missing README.md: README.md helps users understand how to use the chart
     [LOW] values.schema.json provides validation for values.yaml

  ❌ sample-ai/
     [MEDIUM] Missing README.md: README.md helps users understand how to use the chart
     [LOW] Missing templates/NOTES.txt: NOTES.txt provides post-install instructions
     [LOW] values.schema.json provides validation for values.yaml
     [LOW] No test templates found - consider adding helm test hooks

  ❌ sample-game/
     [MEDIUM] Missing README.md: README.md helps users understand how to use the chart
     [LOW] Missing templates/NOTES.txt: NOTES.txt provides post-install instructions
     [LOW] values.schema.json provides validation for values.yaml
     [LOW] No test templates found - consider adding helm test hooks

  ❌ static-website/
     [MEDIUM] Missing README.md: README.md helps users understand how to use the chart
     [LOW] values.schema.json provides validation for values.yaml
     [LOW] No test templates found - consider adding helm test hooks

================================================================================
Summary

Structure issues: 39 violation(s)

❌ Fix: Ensure each chart has:
  - Chart.yaml
  - values.yaml
  - templates/ directory
  - README.md
  - templates/NOTES.txt
  - templates/_helpers.tpl
```

</details>

---

### ❌ Deprecated APIs

**Severity:** MEDIUM
**Summary:** 6 violation(s)

<details>
<summary>View Details</summary>

```
Helm Charts Deprecated APIs Check
================================================================================

Found 9 Helm charts to scan

Deprecated APIs Violations
--------------------------------------------------------------------------------

❌ Found 6 deprecated API(s) (HIGH: 6, MEDIUM: 0, LOW: 0)

  ❌ nodejs-app/
     helm-charts/nodejs-app/templates/ingress.yaml:14: [HIGH] extensions/v1beta1 Ingress is deprecated (removed in 1.22) - use apps/v1 or networking.k8s.io/v1
     helm-charts/nodejs-app/templates/ingress.yaml:12: [HIGH] networking.k8s.io/v1beta1 Ingress is deprecated (removed in 1.22) - use networking.k8s.io/v1

  ❌ python-app/
     helm-charts/python-app/templates/ingress.yaml:14: [HIGH] extensions/v1beta1 Ingress is deprecated (removed in 1.22) - use apps/v1 or networking.k8s.io/v1
     helm-charts/python-app/templates/ingress.yaml:12: [HIGH] networking.k8s.io/v1beta1 Ingress is deprecated (removed in 1.22) - use networking.k8s.io/v1

  ❌ static-website/
     helm-charts/static-website/templates/ingress.yaml:14: [HIGH] extensions/v1beta1 Ingress is deprecated (removed in 1.22) - use apps/v1 or networking.k8s.io/v1
     helm-charts/static-website/templates/ingress.yaml:12: [HIGH] networking.k8s.io/v1beta1 Ingress is deprecated (removed in 1.22) - use networking.k8s.io/v1

================================================================================
Summary

Deprecated API issues: 6 violation(s)

❌ Fix: Update apiVersion fields to use stable APIs:
  - extensions/v1beta1 Deployment -> apps/v1
  - networking.k8s.io/v1beta1 Ingress -> networking.k8s.io/v1
  - batch/v1beta1 CronJob -> batch/v1
  - policy/v1beta1 PodSecurityPolicy -> Pod Security Admission

Run: kubectl convert -f <file> --output-version <api-version>
```

</details>

---

### ❌ Argo Rollouts

**Severity:** MEDIUM
**Summary:** 8 violation(s)

<details>
<summary>View Details</summary>

```
Helm Charts Argo Rollouts Check
================================================================================

Found 9 Helm charts to scan

Charts using Argo Rollouts: 1

Argo Rollouts Violations
--------------------------------------------------------------------------------

❌ Found 8 Argo Rollouts issue(s) (HIGH: 2, MEDIUM: 2, LOW: 4)

  ❌ dotnet-core-webapi/
     helm-charts/dotnet-core-webapi/templates/deployment.yaml:6: [MEDIUM] Canary rollout "{{" has no analysis step - consider adding automated analysis
     helm-charts/dotnet-core-webapi/templates/deployment.yaml:6: [LOW] Canary rollout "{{" has no maxSurge/maxUnavailable - using defaults
     helm-charts/dotnet-core-webapi/templates/deployment.yaml:6: [LOW] Canary rollout "{{" has no trafficRouting - using pod-based canary only
     helm-charts/dotnet-core-webapi/templates/deployment.yaml:6: [MEDIUM] BlueGreen rollout "{{" has no prePromotionAnalysis - consider adding
     helm-charts/dotnet-core-webapi/templates/deployment.yaml:6: [LOW] Rollout "{{" has no revisionHistoryLimit - old ReplicaSets may accumulate
     helm-charts/dotnet-core-webapi/templates/deployment.yaml:6: [LOW] Rollout "{{" has no progressDeadlineSeconds - stuck rollouts may not timeout
     helm-charts/dotnet-core-webapi/templates/hpa.yaml:15: [HIGH] Rollout "{{" has no strategy defined
     helm-charts/dotnet-core-webapi/templates/vpa.yaml:15: [HIGH] Rollout "{{" has no strategy defined

================================================================================
Summary

Argo Rollouts issues: 8 violation(s)

❌ Fix: Ensure Argo Rollouts have:
  - Valid strategy (canary or blueGreen)
  - Canary: steps with setWeight, pause, and analysis
  - BlueGreen: activeService and previewService
  - Analysis templates for automated validation
```

</details>

---

### ❌ Ingress TLS

**Severity:** MEDIUM
**Summary:** 13 violation(s)

<details>
<summary>View Details</summary>

```
Helm Charts Ingress TLS Check
================================================================================

Found 9 Helm charts to scan

Charts with Ingress: 4

Ingress TLS Violations
--------------------------------------------------------------------------------

❌ Found 13 Ingress TLS issue(s) (HIGH: 0, MEDIUM: 5, LOW: 8)

  ❌ dotnet-core-webapi/
     helm-charts/dotnet-core-webapi/templates/ingress.yaml:3: [MEDIUM] Ingress "{{" TLS has no secretName - cert must exist or be auto-provisioned
     helm-charts/dotnet-core-webapi/templates/ingress.yaml:3: [LOW] Ingress "{{" TLS section has no hosts specified
     helm-charts/dotnet-core-webapi/templates/ingress.yaml:3: [MEDIUM] Ingress "{{" has no ingressClassName - may use unexpected controller
     helm-charts/dotnet-core-webapi/templates/ingress.yaml:3: [LOW] Ingress "{{" has TLS but no SSL redirect annotation - HTTP may not redirect to HTTPS

  ❌ nodejs-app/
     helm-charts/nodejs-app/templates/ingress.yaml:16: [MEDIUM] Ingress "{{" TLS has no secretName - cert must exist or be auto-provisioned
     helm-charts/nodejs-app/templates/ingress.yaml:16: [LOW] Ingress "{{" TLS section has no hosts specified
     helm-charts/nodejs-app/templates/ingress.yaml:16: [LOW] Ingress "{{" has TLS but no SSL redirect annotation - HTTP may not redirect to HTTPS

  ❌ python-app/
     helm-charts/python-app/templates/ingress.yaml:16: [MEDIUM] Ingress "{{" TLS has no secretName - cert must exist or be auto-provisioned
     helm-charts/python-app/templates/ingress.yaml:16: [LOW] Ingress "{{" TLS section has no hosts specified
     helm-charts/python-app/templates/ingress.yaml:16: [LOW] Ingress "{{" has TLS but no SSL redirect annotation - HTTP may not redirect to HTTPS

  ❌ static-website/
     helm-charts/static-website/templates/ingress.yaml:16: [MEDIUM] Ingress "{{" TLS has no secretName - cert must exist or be auto-provisioned
     helm-charts/static-website/templates/ingress.yaml:16: [LOW] Ingress "{{" TLS section has no hosts specified
     helm-charts/static-website/templates/ingress.yaml:16: [LOW] Ingress "{{" has TLS but no SSL redirect annotation - HTTP may not redirect to HTTPS

================================================================================
Summary

Ingress TLS issues: 13 violation(s)

❌ Fix: Ensure Ingress has:
  - TLS section with secretName and hosts
  - cert-manager.io/cluster-issuer annotation for auto certs
  - ingressClassName specified
  - SSL redirect annotation for HTTP->HTTPS
```

</details>

---

### ❌ GPU Resources

**Severity:** LOW
**Summary:** 8 violation(s)

<details>
<summary>View Details</summary>

```
Helm Charts GPU Resources Check
================================================================================

Found 9 Helm charts to scan

Charts using GPU resources: 2

GPU Resources Violations
--------------------------------------------------------------------------------

❌ Found 8 GPU resource issue(s) (HIGH: 0, MEDIUM: 0, LOW: 8)

  ❌ gputest/
     helm-charts/gputest/templates/gpujob.yaml:2: [LOW] Job "gpu-test-job" has GPU limits but no requests - requests should equal limits for GPUs
     helm-charts/gputest/templates/gpujob.yaml:2: [LOW] Job "gpu-test-job" uses GPU but no GPU toleration - may not schedule on GPU nodes
     helm-charts/gputest/templates/gpujob.yaml:2: [LOW] Job "gpu-test-job" uses GPU but no GPU nodeSelector/affinity - relies on resource availability only
     helm-charts/gputest/templates/gpujob.yaml:2: [LOW] Job "gpu-test-job" uses GPU but no runtimeClassName - consider nvidia runtime

  ❌ ntis/
     helm-charts/ntis/templates/deployment.yaml:28: [LOW] Deployment "{{" has GPU limits but no requests - requests should equal limits for GPUs
     helm-charts/ntis/templates/deployment.yaml:28: [LOW] Deployment "{{" uses GPU but no GPU toleration - may not schedule on GPU nodes
     helm-charts/ntis/templates/deployment.yaml:28: [LOW] Deployment "{{" uses GPU but no GPU nodeSelector/affinity - relies on resource availability only
     helm-charts/ntis/templates/deployment.yaml:28: [LOW] Deployment "{{" uses GPU but no runtimeClassName - consider nvidia runtime

================================================================================
Summary

GPU resource issues: 8 violation(s)

❌ Fix: Ensure GPU workloads have:
  resources:
    limits:
      nvidia.com/gpu: 1
    requests:
      nvidia.com/gpu: 1
  tolerations:
    - key: nvidia.com/gpu
      operator: Exists
      effect: NoSchedule
  nodeSelector:
    accelerator: nvidia-tesla-v100
```

</details>

---

## Recommendations

1. **Immediate (HIGH):** Fix image tags, resource limits, health probes, helm lint
2. **Short-term (MEDIUM):** Address chart metadata, chart structure, deprecated apis, argo rollouts, ingress tls
3. **Long-term (LOW):** Improve gpu resources

## Next Steps

1. Address failed checks in priority order (HIGH -> MEDIUM -> LOW)
2. Run individual check scripts for detailed violation analysis
3. Re-run `generate_report.mjs` after fixes to verify improvements

---

*Generated by helm-charts-audit skill*
