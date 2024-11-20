resource "helm_release" "argo_workflows" {
  name       = "argo-workflows"
  repository = "https://argoproj.github.io/argo-helm"
  chart      = "argo-workflows"
  namespace  = kubernetes_namespace.argo_cd_local.metadata[0].name
  values     = [file("${path.module}/values/argo-workflows-values.yaml")]
}
