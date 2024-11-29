
resource "kubernetes_namespace" "argo_cd" {
  metadata {
    name = var.argo_namespace
  }
}
