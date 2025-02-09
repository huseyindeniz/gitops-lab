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

resource "kubernetes_manifest" "self_signed_issuer" {
  manifest = yamldecode(templatefile("${path.module}/values/self-signed-issuer.yaml", {
    issuer_name      = var.issuer_name
    issuer_namespace = var.issuer_namespace
  }))

  depends_on = [helm_release.istio_ingress]
}

resource "kubernetes_manifest" "self_signed_certificate" {
  manifest = yamldecode(templatefile("${path.module}/values/certificate-template.yaml", {
    host             = var.gateway_host
    tls_secret_name  = var.tls_secret_name
    issuer_name      = var.issuer_name
    issuer_namespace = var.issuer_namespace
  }))

  depends_on = [kubernetes_manifest.self_signed_issuer]
}

resource "kubernetes_manifest" "istio_gateway" {
  manifest = yamldecode(templatefile("${path.module}/values/istio-gateway.yaml", {
    host            = var.gateway_host
    tls_secret_name = var.tls_secret_name
  }))

  depends_on = [kubernetes_manifest.self_signed_certificate]
}
