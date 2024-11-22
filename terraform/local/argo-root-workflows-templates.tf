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
        "repoURL"        = "https://github.com/huseyindeniz/cicd-lab.git"
        "targetRevision" = "main"
        "path"           = "${var.flux_path}/workflows-templates"
        "directory" = {
          "recurse" = true
        }
      }
      "destination" = {
        "server"    = "https://kubernetes.default.svc"
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
  depends_on = [module.argo, flux_bootstrap_git.flux_bootstrap]
}
