resource "helm_release" "argo_cd_local" {
  name       = "argo-cd-local"
  repository = "https://argoproj.github.io/argo-helm"
  chart      = "argo-cd"
  namespace  = kubernetes_namespace.argo_cd_local.metadata[0].name
  values     = [file("${path.module}/values/argo-cd-values.yaml")]
}

# Retrieve the initial admin password from the Argo CD secret
data "kubernetes_secret" "argo_cd_local_admin_secret" {
  metadata {
    name      = "argocd-initial-admin-secret"
    namespace = kubernetes_namespace.argo_cd_local.metadata[0].name
  }
  depends_on = [helm_release.argo_cd_local]
}
