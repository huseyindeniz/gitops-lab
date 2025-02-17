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

resource "kubernetes_manifest" "self_signed_issuer" {
  manifest = yamldecode(templatefile("${path.module}/manifests/self-signed-issuer.yaml", {
    istio_namespace = var.istio_namespace
    issuer_name     = var.issuer_name
    id              = helm_release.istiod.id // fake id for this resource to depend on the helm_release istiod
  }))
}

resource "kubernetes_manifest" "self_signed_certificate" {
  manifest = yamldecode(templatefile("${path.module}/manifests/certificate-template.yaml", {
    istio_namespace = var.istio_namespace
    issuer_name     = var.issuer_name
    tls_secret_name = var.tls_secret_name
    dns_name        = var.dns_name
  }))

  depends_on = [kubernetes_manifest.self_signed_issuer]
}

resource "helm_release" "istio_ingress" {
  name       = "istio-ingress"
  namespace  = var.istio_namespace
  repository = "https://istio-release.storage.googleapis.com/charts"
  chart      = "gateway"
  version    = "1.25.0-alpha.0"
  values = [
    file("${path.module}/values/istio-ingressgateway.yaml"),
    var.istio_ingressgateway_values_file != "" ? file(var.istio_ingressgateway_values_file) : null,
  ]

  depends_on = [kubernetes_manifest.self_signed_certificate]
}
