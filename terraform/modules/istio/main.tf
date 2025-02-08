resource "helm_release" "istio_base" {
  name       = "istio-base"
  namespace  = var.istio_namespace
  repository = "https://istio-release.storage.googleapis.com/charts"
  chart      = "base"
  version    = "1.25.0-alpha.0"
  values = [
    file("${path.module}/values/base.yaml"),
    var.istio_base_values_file != "" ? file(var.istio_base_values_file) : null,
  ]
}

resource "helm_release" "istiod" {
  name       = "istiod"
  namespace  = var.istio_namespace
  repository = "https://istio-release.storage.googleapis.com/charts"
  chart      = "istiod"
  version    = "1.25.0-alpha.0"
  values = [
    file("${path.module}/values/istiod.yaml"),
    var.istiod_values_file != "" ? file(var.istiod_values_file) : null,
  ]

  depends_on = [helm_release.istio_base]
}

resource "helm_release" "istio_ingress" {
  name       = "istio-ingress"
  namespace  = var.istio_namespace
  repository = "https://istio-release.storage.googleapis.com/charts"
  chart      = "gateway"
  version    = "1.25.0-alpha.0"
  values = [
    file("${path.module}/values/istio-ingress.yaml")
  ]

  depends_on = [helm_release.istiod]
}
