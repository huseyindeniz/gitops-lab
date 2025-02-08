resource "helm_release" "argo_workflows" {
  name       = "argo-workflows"
  repository = "https://argoproj.github.io/argo-helm"
  chart      = "argo-workflows"
  namespace  = var.argo_namespace
  values = [
    file("${path.module}/values/argo-workflows-values.yaml"),
    var.values_file != "" ? file(var.values_file) : null
  ]
  depends_on = [helm_release.argo_cd]
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
    namespace = var.argo_namespace
  }

  depends_on = [helm_release.argo_workflows]
}

resource "kubernetes_secret" "argo_workflows_service_account_token" {
  metadata {
    name      = "argo-workflows.service-account-token"
    namespace = var.argo_namespace
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
    namespace = var.argo_namespace
  }
  depends_on = [kubernetes_secret.argo_workflows_service_account_token]
}
