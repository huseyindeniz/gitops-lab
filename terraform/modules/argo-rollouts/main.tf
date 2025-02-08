resource "helm_release" "argo_rollouts" {
  name       = "argo-rollouts"
  repository = "https://argoproj.github.io/argo-helm"
  chart      = "argo-rollouts"
  namespace  = var.argo_namespace
  values = [
    file("${path.module}/values/values.yaml"),
    var.argo_rollouts_values_file != "" ? file(var.argo_rollouts_values_file) : null
  ]
  depends_on = [helm_release.argo_cd]
}

