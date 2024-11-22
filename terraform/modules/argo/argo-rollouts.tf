resource "helm_release" "argo_rollouts" {
  name       = "argo-rollouts"
  repository = "https://argoproj.github.io/argo-helm"
  chart      = "argo-rollouts"
  namespace  = kubernetes_namespace.argo_cd.metadata[0].name
  values     = [file(var.argo_rollouts_values_file)]
  depends_on = [helm_release.argo_cd]
}
