resource "kubernetes_namespace" "istio" {
  metadata {
    name = var.istio_namespace
  }
}

resource "kubernetes_namespace" "metallb" {
  metadata {
    name = var.metallb_namespace
  }
}
