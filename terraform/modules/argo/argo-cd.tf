# helm repo add argo https://argoproj.github.io/argo-helm
# helm repo update
resource "helm_release" "argo_cd" {
  name       = "argo-cd-local"
  repository = "https://argoproj.github.io/argo-helm"
  chart      = "argo-cd"
  namespace  = kubernetes_namespace.argo_cd.metadata[0].name
  values     = [file(var.argo_cd_values_file)]
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
