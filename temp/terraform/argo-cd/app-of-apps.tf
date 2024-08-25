resource "helm_release" "argo_app_of_apps_staging" {
  name      = "hdk-apps"
  chart     = "./helm-charts/argo-apps"
  namespace = kubernetes_namespace.argo_cd.metadata[0].name

  values = [
    file("${path.module}/values/staging-values.yaml")
  ]
}

resource "helm_release" "argo_app_of_apps_producton" {
  name      = "hdk-apps"
  chart     = "./helm-charts/argo-apps"
  namespace = kubernetes_namespace.argo_cd.metadata[0].name

  values = [
    file("${path.module}/values/production-values.yaml")
  ]
}
