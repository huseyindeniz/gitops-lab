resource "kubernetes_manifest" "argo_root_workflows" {
  manifest = {
    "apiVersion" = "argoproj.io/v1alpha1"
    "kind"       = "Application"
    "metadata" = {
      "name"      = "argo-root-workflows-templates"
      "namespace" = kubernetes_namespace.argo_cd_local.metadata[0].name
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
