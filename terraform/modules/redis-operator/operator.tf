# Redis Operator Installation (OT-CONTAINER-KIT)
# This module installs the Redis operator
# Install once per cluster

resource "kubernetes_namespace" "redis_operator" {
  metadata {
    name = var.operator_namespace
  }
}

resource "helm_release" "redis_operator" {
  name             = "redis-operator"
  namespace        = kubernetes_namespace.redis_operator.metadata[0].name
  repository       = "https://ot-container-kit.github.io/helm-charts"
  chart            = "redis-operator"
  version          = var.operator_version
  create_namespace = false
  cleanup_on_fail  = true

  # Ensure operator is ready before Terraform continues
  wait    = true
  timeout = 300

  depends_on = [kubernetes_namespace.redis_operator]
}
