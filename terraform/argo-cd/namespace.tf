resource "kubernetes_namespace" "argo_cd" {
  metadata {
    name = "argo-cd"
  }
}
