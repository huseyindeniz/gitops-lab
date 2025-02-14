resource "kubernetes_manifest" "argo_management_root" {
  manifest = yamldecode(templatefile("${path.module}/manifests/argo-root.yaml", {
    argo_namespace     = var.argo_namespace
    gitopslab_repo_url = local.gitopslab_repo_url
    root_path          = "${var.flux_path}/apps/local-management"
  }))
}
