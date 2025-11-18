
resource "helm_release" "cert_manager" {
  name       = "cert-manager"
  repository = "https://charts.jetstack.io/"
  chart      = "cert-manager"
  version    = var.cert_manager_version
  namespace  = kubernetes_namespace.cert_manager.metadata[0].name

  set = [
    {
      name  = "crds.enabled"
      value = "true"
    },
    {
      name  = "crds.keep"
      value = "false"
    }
  ]
}
