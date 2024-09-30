resource "helm_release" "argo_cd_local_app_of_apps" {
  name       = "argo-cd-local-app-of-apps"
  repository = "../../helm-charts"
  chart      = "app-of-apps"
  version    = "main"
  namespace  = kubernetes_namespace.argo_cd_local.metadata[0].name
  values     = [file("${path.module}/values/app-of-apps-values.yaml")]
}
