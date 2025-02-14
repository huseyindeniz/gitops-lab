# helm repo add argo https://argoproj.github.io/argo-helm
# helm repo update
resource "helm_release" "argo_cd" {
  name       = "argo-cd"
  repository = "https://argoproj.github.io/argo-helm"
  chart      = "argo-cd"
  namespace  = var.argo_namespace
  values = [
    file("${path.module}/values/values.yaml"),
    var.argo_cd_values_file != "" ? file(var.argo_cd_values_file) : null,
  ]
}

# Retrieve the initial admin password from the Argo CD secret
data "kubernetes_secret" "argo_cd_admin_secret" {
  metadata {
    name      = "argocd-initial-admin-secret"
    namespace = var.argo_namespace
  }
  depends_on = [helm_release.argo_cd]
}

