# CloudNativePG Operator Installation
# This module installs the CloudNativePG operator in cluster-wide mode
# Install once per cluster

resource "kubernetes_namespace" "cnpg_system" {
  metadata {
    name = var.operator_namespace
  }
}

resource "helm_release" "cloudnative_pg_operator" {
  name             = "cnpg"
  namespace        = kubernetes_namespace.cnpg_system.metadata[0].name
  repository       = "https://cloudnative-pg.github.io/charts"
  chart            = "cloudnative-pg"
  version          = var.operator_version
  create_namespace = false
  cleanup_on_fail  = true

  # Install in cluster-wide mode so it can manage PostgreSQL clusters in all namespaces
  set {
    name  = "config.clusterWide"
    value = "true"
  }

  # Ensure operator is ready before Terraform continues
  wait    = true
  timeout = 300

  depends_on = [kubernetes_namespace.cnpg_system]
}
