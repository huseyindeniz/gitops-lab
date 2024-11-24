# resource "kubernetes_manifest" "argo_root_workflows" {
#   manifest = {
#     "apiVersion" = "argoproj.io/v1alpha1"
#     "kind"       = "Application"
#     "metadata" = {
#       "name"      = "argo-root-workflows-templates"
#       "namespace" = var.argo_namespace
#     }
#     "spec" = {
#       "project" = "default"
#       "source" = {
#         "repoURL"        = "https://github.com/${var.flux_github_org}/${var.flux_github_repository}.git"
#         "targetRevision" = "main"
#         "path"           = "${var.flux_path}/workflows-templates"
#         "directory" = {
#           "recurse" = true
#         }
#       }
#       "destination" = {
#         "server"    = "https://kubernetes.default.svc"
#         "namespace" = var.argo_namespace
#       }
#       "syncPolicy" = {
#         "automated" = {
#           "prune"    = true
#           "selfHeal" = true
#         }
#       }
#     }
#   }
#   depends_on = [helm_release.argo_workflows]
# }
