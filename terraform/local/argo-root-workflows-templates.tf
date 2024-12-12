# resource "argocd_application" "argo_root_workflows" {
#   metadata {
#     name      = "argo-local-root-workflows-templates"
#     namespace = var.argo_namespace
#   }

#   spec {
#     project = "default"

#     source {
#       repo_url        = local.gitopslab_repo_url
#       target_revision = "main"
#       path            = "${var.flux_path}/workflows-templates"
#       directory {
#         recurse = true
#       }
#     }

#     destination {
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

#   depends_on = [module.local_argo, flux_bootstrap_git.flux_bootstrap]
# }
