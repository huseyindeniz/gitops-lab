# MinIO Operator Installation
# This module installs the MinIO operator
# Install once per cluster

resource "kubernetes_namespace" "minio_operator" {
  metadata {
    name = var.operator_namespace
  }
}

resource "helm_release" "minio_operator" {
  name             = "minio-operator"
  namespace        = kubernetes_namespace.minio_operator.metadata[0].name
  repository       = "https://operator.min.io"
  chart            = "operator"
  version          = var.operator_version
  create_namespace = false
  cleanup_on_fail  = true

  # Ensure operator is ready before Terraform continues
  wait    = true
  timeout = 300

  depends_on = [kubernetes_namespace.minio_operator]
}
