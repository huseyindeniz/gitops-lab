# resource "helm_release" "project_001_staging_app_of_apps" {
#   name       = "project-001-staging-app-of-apps"
#   repository = "https://argoproj.github.io/argo-helm"
#   chart      = "argocd-apps"
#   namespace  = kubernetes_namespace.project_001_staging_app_of_apps.metadata[0].name
#   values     = [file("${path.module}/values/app-of-apps-values.yaml")]
# }
