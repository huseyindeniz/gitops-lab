resource "helm_release" "argo_workflows" {
  name       = "argo-workflows"
  repository = "https://argoproj.github.io/argo-helm"
  chart      = "argo-workflows"
  namespace  = kubernetes_namespace.argo_cd_local.metadata[0].name
  values     = [file("${path.module}/values/argo-workflows-values.yaml")]
  depends_on = [helm_release.argo_cd_local]
}

resource "kubernetes_cluster_role_binding" "argo_workflows_sa_binding" {
  metadata {
    name = "argo-workflows-sa-binding"
  }

  role_ref {
    api_group = "rbac.authorization.k8s.io"
    kind      = "ClusterRole"
    name      = "admin"
  }

  subject {
    kind      = "ServiceAccount"
    name      = "argo-workflows-sa"
    namespace = kubernetes_namespace.argo_cd_local.metadata[0].name
  }

  depends_on = [helm_release.argo_workflows]
}

resource "kubernetes_secret" "argo_workflows_service_account_token" {
  metadata {
    name      = "argo-workflows.service-account-token"
    namespace = kubernetes_namespace.argo_cd_local.metadata[0].name
    annotations = {
      "kubernetes.io/service-account.name" = "argo-workflows-sa"
    }
  }

  type       = "kubernetes.io/service-account-token"
  depends_on = [helm_release.argo_workflows]
}

data "kubernetes_secret" "argo_workflows_token" {
  metadata {
    name      = "argo-workflows.service-account-token"
    namespace = kubernetes_namespace.argo_cd_local.metadata[0].name
  }
  depends_on = [helm_release.argo_workflows]
}
