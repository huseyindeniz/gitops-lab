resource "helm_release" "argo_rollouts" {
  name            = "argo-rollouts"
  repository      = "https://argoproj.github.io/argo-helm"
  chart           = "argo-rollouts"
  namespace       = kubernetes_namespace.argo_cd_local.metadata[0].name
  atomic          = true
  cleanup_on_fail = true
  values          = [file("${path.module}/values/argo-rollouts-values.yaml")]
}
