resource "kubernetes_manifest" "argo_root_workflows" {
  manifest = {
    "apiVersion" = "argoproj.io/v1alpha1"
    "kind"       = "Application"
    "metadata" = {
      "name"      = "argo-root-workflows-templates"
      "namespace" = var.argo_namespace
    }
    "spec" = {
      "project" = "default"
      "source" = {
        "repoURL"        = var.argo_workflows_templates_source_repo_url
        "targetRevision" = "main"
        "path"           = var.argo_workflows_templates_source_repo_path
        "directory" = {
          "recurse" = true
        }
      }
      "destination" = {
        "server"    = var.argo_workflows_templates_destination_server
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
  depends_on = [helm_release.argo_workflows]
}
