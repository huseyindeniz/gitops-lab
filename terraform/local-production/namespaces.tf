resource "kubernetes_namespace" "istio" {
  metadata {
    name = var.istio_namespace
  }
}
