resource "helm_release" "project_001_staging_argo_cd" {
  name       = "project-001-staging-argo-cd"
  repository = "https://argoproj.github.io/argo-helm"
  chart      = "argo-cd"
  namespace  = kubernetes_namespace.project_001_staging_argo_cd.metadata[0].name
  values     = [file("${path.module}/values/argo-cd-values.yaml")]
}

# Retrieve the initial admin password from the Argo CD secret
data "kubernetes_secret" "project_001_staging_argo_cd_admin_secret" {
  metadata {
    name      = "argocd-initial-admin-secret"
    namespace = kubernetes_namespace.project_001_staging_argo_cd.metadata[0].name
  }
  depends_on = [helm_release.project_001_staging_argo_cd]
}
