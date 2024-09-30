resource "kubernetes_namespace" "argo_cd_local" {
  metadata {
    name = "argo-cd-local"
  }
}
