resource "kubernetes_manifest" "argocd_project_hdk_staging" {
  manifest = {
    apiVersion = "argoproj.io/v1alpha1"
    kind       = "AppProject"
    metadata = {
      name      = "hdk-staging"
      namespace = kubernetes_namespace.argo_cd.metadata[0].name
    }
    spec = {
      description = "Argo CD project for staging environment"
      sourceRepos = ["*"]
      destinations = [
        {
          server    = "*"
          namespace = "*"
        }
      ]
    }
  }
}
