resource "helm_release" "argo_rollouts" {
  name       = "argo-rollouts"
  repository = "https://argoproj.github.io/argo-helm"
  chart      = "argo-rollouts"
  namespace  = kubernetes_namespace.argo_cd.metadata[0].name
  values = [
    file("${path.module}/values/argo-rollouts-values.yaml"),
    var.argo_rollouts_values_file != "" ? file(var.argo_rollouts_values_file) : null
  ]
  depends_on = [helm_release.argo_cd]
}
