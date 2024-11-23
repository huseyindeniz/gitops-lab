resource "kubernetes_manifest" "argo_root_applications" {
  manifest = {
    "apiVersion" = "argoproj.io/v1alpha1"
    "kind"       = "Application"
    "metadata" = {
      "name"      = "argo-root-applications"
      "namespace" = var.argo_namespace
    }
    "spec" = {
      "project" = "default"
      "source" = {
        "repoURL"        = var.argo_cd_applications_source_repo_url
        "targetRevision" = "main"
        "path"           = var.argo_cd_applications_source_repo_path
        "directory" = {
          "recurse" = true
        }
      }
      "destination" = {
        "server"    = var.argo_cd_applications_destination_server
        "namespace" = var.argo_namespace
      }
      "syncPolicy" = {
        "automated" = {
          "prune"    = true
          "selfHeal" = true
        }
      }
    }
  }
  depends_on = [helm_release.argo_cd]
}
