# Versions Module

This module provides centralized version management for all Helm charts and operators used across the GitOps lab infrastructure.

## Purpose

- **Single Source of Truth**: All version definitions in one place
- **Shared Across Clusters**: Used by local-management, local-staging, and local-production
- **Easy Updates**: Change version once, affects all clusters
- **Testing Strategy**: Test new versions in staging before promoting to production

## Usage

```hcl
module "versions" {
  source = "../modules/versions"
}

module "cert_manager" {
  source  = "../modules/cert-manager"
  version = module.versions.cert_manager_version
}
```

## Available Versions

See `outputs.tf` for the complete list of available version outputs.

## Updating Versions

1. Update the version in `outputs.tf`
2. Test in staging cluster first
3. Review Helm chart changelog for breaking changes
4. Apply to production after validation

## Per-Cluster Overrides

If a specific cluster needs a different version:

```hcl
module "versions" {
  source = "../modules/versions"
}

# Override for this cluster only
module "cert_manager" {
  source  = "../modules/cert-manager"
  version = "v1.18.0"  # Use specific version instead of module.versions
}
```

## Version History

Tracked via Git commits to this module.

Last Updated: 2025-11-18
