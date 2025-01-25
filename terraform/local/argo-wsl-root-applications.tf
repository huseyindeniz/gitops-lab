# resource "argocd_application" "argo_wsl_root_applications" {
#   metadata {
#     name      = "argo-wsl-root-applications"
#     namespace = var.argo_namespace
#   }

#   spec {
#     project = "default"

#     source {
#       repo_url        = local.gitopslab_repo_url
#       target_revision = "main"
#       path            = "flux/wsl"
#       directory {
#         recurse = true
#       }
#     }

#     destination {
#       # server    = var.wsl_cluster_server
#       # namespace = "argo-wsl"
#       server    = "https://kubernetes.default.svc"
#       namespace = var.argo_namespace
#     }

#     sync_policy {
#       automated {
#         prune     = true
#         self_heal = true
#       }
#     }
#   }

#   depends_on = [argocd_cluster.wsl_cluster]
# }

