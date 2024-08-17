# main.tf for installing Argo CD

resource "helm_release" "argo_cd" {
  name       = "argo-cd"
  repository = "https://argoproj.github.io/argo-helm"
  chart      = "argo-cd"
  version    = "5.4.7" # Check for the latest version
  namespace  = kubernetes_namespace.argo_cd.metadata[0].name

  values = [file("values/argo-cd.yaml")]

  depends_on = [kubernetes_namespace.argo_cd]
}

# Retrieve the initial admin password from the Argo CD secret
data "kubernetes_secret" "argo_cd_admin_secret" {
  metadata {
    name      = "argocd-initial-admin-secret"
    namespace = kubernetes_namespace.argo_cd.metadata[0].name
  }
  depends_on = [helm_release.argo_cd]
}
