resource "helm_release" "argo_rollouts" {
  name       = "argo-rollouts"
  repository = "https://argoproj.github.io/argo-helm"
  chart      = "argo-rollouts"
  version    = var.argo_rollouts_version
  namespace  = var.argo_namespace
  values = [
    file("${path.module}/values/values.yaml"),
    var.argo_rollouts_values_file != "" ? file(var.argo_rollouts_values_file) : null
  ]
}

