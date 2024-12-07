resource "kubernetes_namespace" "cert_manager" {
  metadata {
    name = "cert-manager"
  }
}
