# resource "argocd_application" "argo_management_root" {
#   metadata {
#     name      = "argo-management-root"
#     namespace = var.argo_namespace
#   }

#   spec {
#     project = "default"

#     source {
#       repo_url        = local.gitopslab_repo_url
#       target_revision = "main"
#       path            = "${var.flux_path}/local-management"
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

#   depends_on = [module.local_argo]
# }

resource "kubernetes_manifest" "argo_management_root" {
  manifest = yamldecode(templatefile("${path.module}/manifests/argo-root.yaml", {
    argo_namespace     = var.argo_namespace
    gitopslab_repo_url = local.gitopslab_repo_url
    root_path          = "${var.flux_path}/local-management"
  }))
}
