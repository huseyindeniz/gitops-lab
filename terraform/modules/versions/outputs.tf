# Centralized Version Management
# This module provides a single source of truth for all Helm chart and operator versions
# Used across all clusters: local-management, local-staging, local-production

# ============================================================================
# INFRASTRUCTURE COMPONENTS
# ============================================================================

output "cert_manager_version" {
  description = "cert-manager Helm chart version"
  value       = "v1.19.1"
}

output "istio_version" {
  description = "Istio Helm chart version (base, istiod, gateway)"
  value       = "1.28.0"
}

output "metallb_version" {
  description = "MetalLB Helm chart version"
  value       = "0.15.2"
}

# ============================================================================
# GITOPS & CD TOOLS
# ============================================================================

output "argocd_version" {
  description = "Argo CD Helm chart version"
  value       = "9.1.3"
}

output "argo_rollouts_version" {
  description = "Argo Rollouts Helm chart version"
  value       = "2.40.5"
}

output "flux_version" {
  description = "Flux version (if needed in future)"
  value       = "2.12.0"
}

# ============================================================================
# KUBERNETES OPERATORS
# ============================================================================

output "cnpg_operator_version" {
  description = "CloudNativePG operator Helm chart version"
  value       = "0.26.1"
}

output "redis_operator_version" {
  description = "Redis operator (OT-CONTAINER-KIT) Helm chart version"
  value       = "0.22.2"
}

output "minio_operator_version" {
  description = "MinIO operator Helm chart version"
  value       = "6.0.4"
}

# ============================================================================
# GITHUB ACTIONS RUNNER CONTROLLER
# ============================================================================

output "arc_controller_version" {
  description = "Actions Runner Controller Helm chart version"
  value       = "0.9.3"
}

output "arc_scale_set_controller_version" {
  description = "ARC gha-runner-scale-set-controller Helm chart version"
  value       = "0.13.0"
}

output "arc_runner_scale_set_version" {
  description = "ARC gha-runner-scale-set Helm chart version"
  value       = "0.13.0"
}

# ============================================================================
# VERSION METADATA
# ============================================================================

output "last_updated" {
  description = "Last update date for version configurations"
  value       = "2025-11-18"
}

output "all_versions" {
  description = "Map of all versions for reference"
  value = {
    # Infrastructure
    cert_manager = "v1.19.1"
    istio        = "1.28.0"
    metallb      = "0.15.2"

    # GitOps
    argocd         = "9.1.3"
    argo_rollouts  = "2.40.5"
    flux           = "2.12.0"

    # Operators
    cnpg_operator  = "0.26.1"
    redis_operator = "0.22.2"
    minio_operator = "6.0.4"

    # ARC
    arc_controller              = "0.9.3"
    arc_scale_set_controller   = "0.13.0"
    arc_runner_scale_set       = "0.13.0"
  }
}
