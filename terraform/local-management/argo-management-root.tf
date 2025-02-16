resource "kubernetes_manifest" "argo_management_root" {
  manifest = yamldecode(templatefile("${path.module}/manifests/argo-root.yaml", {
    argo_namespace     = kubernetes_namespace.argocd.metadata.0.name
    gitopslab_repo_url = local.gitopslab_repo_url
    root_path          = "${var.flux_path}/apps/local-management"
  }))

  depends_on = [kubernetes_namespace.argocd]
}
