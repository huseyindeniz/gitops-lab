resource "kubernetes_manifest" "app_of_apps" {
  manifest = {
    "apiVersion" = "argoproj.io/v1alpha1"
    "kind"       = "Application"
    "metadata" = {
      "name"      = "app-of-apps"
      "namespace" = kubernetes_namespace.argo_cd_local.metadata[0].name
    }
    "spec" = {
      "project" = "default"
      "source" = {
        "repoURL"        = "https://github.com/huseyindeniz/cicd-lab.git"
        "targetRevision" = "main"
        "path"           = "helm-charts/appsets"
      }
      "destination" = {
        "server"    = "https://kubernetes.default.svc"
        "namespace" = kubernetes_namespace.argo_cd_local.metadata[0].name
      }
      "syncPolicy" = {
        "automated" = {
          "prune"    = true
          "selfHeal" = true
        }
      }
    }
  }
}
