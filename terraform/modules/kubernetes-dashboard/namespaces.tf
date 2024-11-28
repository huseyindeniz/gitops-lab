
resource "kubernetes_namespace" "kubernetes_dashboard" {
  metadata {
    name = "kubernetes-dashboard"
  }
}
