# Centralized Version Management

## Overview

This repository now uses a centralized version management system for all Helm charts and operators across all clusters (local-management, local-staging, local-production).

## Architecture

```
terraform/
├── modules/
│   └── versions/           # ✨ Centralized version module
│       ├── outputs.tf      # All version definitions
│       ├── main.tf         # Empty (no resources)
│       └── README.md       # Documentation
├── local-management/
│   └── main.tf            # Uses module.versions
├── local-staging/
│   ├── main.tf            # Uses module.versions
│   └── operators.tf       # Uses module.versions
└── local-production/
    ├── main.tf            # Uses module.versions
    └── operators.tf       # Uses module.versions
```

## Managed Versions

### Infrastructure Components
- **cert-manager**: v1.19.1 (upgraded from v1.12.0)
- **Istio**: 1.28.0 (upgraded from 1.25.0-alpha.0)
- **MetalLB**: 0.15.2 (upgraded from 0.14.9)

### GitOps & CD Tools
- **Argo CD**: 9.1.3 (now pinned, was floating)
- **Argo Rollouts**: 2.40.5 (now pinned, was floating)

### Kubernetes Operators
- **CloudNativePG**: 0.26.1 (already up-to-date)
- **Redis Operator**: 0.22.2 (already up-to-date)
- **MinIO Operator**: 6.0.4 (already up-to-date)

### GitHub Actions Runner Controller
- **ARC Controller**: 0.9.3 (now pinned, was floating)
- **ARC Scale Set Controller**: 0.13.0 (now pinned, was floating)
- **ARC Runner Scale Set**: 0.13.0 (now pinned, was floating)

## Usage

### For Regular Updates

1. **Update version in one place**:
   ```bash
   vim terraform/modules/versions/outputs.tf
   ```

2. **Change the version output**:
   ```hcl
   output "cert_manager_version" {
     description = "cert-manager Helm chart version"
     value       = "v1.20.0"  # Update here
   }
   ```

3. **Apply to all clusters automatically**:
   ```bash
   # Staging first (recommended)
   cd terraform/local-staging
   terraform plan   # Review changes
   terraform apply

   # Production after validation
   cd terraform/local-production
   terraform plan
   terraform apply
   ```

### Per-Cluster Overrides (When Needed)

If a specific cluster needs a different version (e.g., testing in staging):

```hcl
# In local-staging/main.tf
module "local_cert_manager" {
  source = "../modules/cert-manager"

  cert_manager_version = "v1.20.0-beta.1"  # Override for testing

  providers = {
    kubernetes = kubernetes
    helm       = helm
    kubectl    = kubectl
  }
}
```

## Migration Complete

### What Changed

#### Files Created
- `terraform/modules/versions/outputs.tf`
- `terraform/modules/versions/main.tf`
- `terraform/modules/versions/README.md`
- `terraform/modules/cert-manager/variables.tf`

#### Files Modified
**Modules** (added version variables):
- `terraform/modules/cert-manager/main.tf`
- `terraform/modules/istio/main.tf` + `variables.tf`
- `terraform/modules/metallb/main.tf` + `variables.tf`
- `terraform/modules/argo/main.tf` + `variables.tf`
- `terraform/modules/argo-rollouts/main.tf` + `variables.tf`
- `terraform/modules/arc-runners/main.tf` + `variables.tf`

**Cluster Configurations** (now use versions module):
- `terraform/local-management/main.tf`
- `terraform/local-staging/main.tf`
- `terraform/local-staging/operators.tf`
- `terraform/local-production/main.tf`
- `terraform/local-production/operators.tf`

## First Apply After Migration

### What to Expect

When you run `terraform plan` for the first time after this migration:

1. **Version changes will be detected**:
   - cert-manager: v1.12.0 → v1.19.1
   - Istio: 1.25.0-alpha.0 → 1.28.0
   - MetalLB: 0.14.9 → 0.15.2
   - Argo CD: (none) → 9.1.3
   - Argo Rollouts: (none) → 2.40.5
   - ARC charts: (none) → specific versions

2. **Terraform will show Helm release updates**:
   ```
   ~ helm_release.cert_manager will be updated in-place
     ~ version = "v1.12.0" -> "v1.19.1"
   ```

3. **This is expected and safe** ✓

### Testing Strategy

**Recommended Order**:

```bash
# 1. TEST IN STAGING FIRST
cd terraform/local-staging
terraform init -upgrade
terraform plan > /tmp/staging-plan.txt
# Review the plan carefully
terraform apply

# 2. Validate staging cluster
kubectl get pods -A  # Check all pods are running
# Run your integration tests

# 3. APPLY TO PRODUCTION
cd terraform/local-production
terraform init -upgrade
terraform plan > /tmp/production-plan.txt
# Review the plan carefully
terraform apply

# 4. Validate production cluster
kubectl get pods -A  # Check all pods are running
```

## Breaking Changes Review

Before applying the major version updates, review changelogs:

### cert-manager (v1.12.0 → v1.19.1)
- [Changelog](https://github.com/cert-manager/cert-manager/releases)
- **Note**: v1.19.1 fixes a bug in v1.19.0
- Generally backward compatible

### Istio (1.25.0-alpha → 1.28.0)
- [Changelog](https://istio.io/latest/news/releases/)
- Moving from alpha to stable
- Review values.yaml compatibility

### Helm Provider (v2 → v3)
- Your provider versions were already updated
- Helm charts should work with both

## Benefits Achieved

1. ✅ **Single Source of Truth** - All versions in `modules/versions/outputs.tf`
2. ✅ **Accessible to All Clusters** - Shared `modules` folder
3. ✅ **Easy Updates** - Change once, affects all
4. ✅ **Version Pinning** - No more floating versions
5. ✅ **Testing Strategy** - Test in staging first
6. ✅ **Git History** - Track all version changes
7. ✅ **Per-Cluster Flexibility** - Override when needed

## Troubleshooting

### Issue: Helm chart upgrade fails

**Solution**: Review the chart's changelog for breaking changes. You may need to update values.yaml files.

### Issue: "version not found" error

**Check**:
```bash
helm search repo <repo-name>/<chart-name> --versions
```

### Issue: Want to rollback a version

**Simple**:
```hcl
# In modules/versions/outputs.tf
output "cert_manager_version" {
  value = "v1.18.0"  # Rollback
}
```

Then `terraform apply`

## Maintenance

### Monthly Version Check

```bash
# Check for newer versions
helm repo update
helm search repo cert-manager/cert-manager
helm search repo istio/base
helm search repo metallb/metallb
helm search repo argo/argo-cd
# etc.
```

### Update Process

1. Update `modules/versions/outputs.tf`
2. Test in local-management or local-staging
3. Review in staging
4. Deploy to production

## Last Updated

- **Date**: 2025-11-18
- **Updated By**: Claude Code (Automated Refactoring)
- **Status**: ✅ Complete and Ready for Use
