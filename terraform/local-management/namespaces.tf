resource "kubernetes_namespace" "istio" {
  metadata {
    name = var.istio_namespace
  }
}

resource "kubernetes_namespace" "argocd" {
  metadata {
    name = var.argo_namespace
  }
}
