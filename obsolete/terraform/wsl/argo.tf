resource "kubernetes_service_account" "argocd_manager" {
  metadata {
    name      = "argocd-manager"
    namespace = "kube-system"
  }
}

resource "kubernetes_secret" "argocd_manager_token" {
  metadata {
    name      = "argocd-manager-token"
    namespace = kubernetes_service_account.argocd_manager.metadata[0].namespace

    annotations = {
      "kubernetes.io/service-account.name" = kubernetes_service_account.argocd_manager.metadata[0].name
    }
  }

  type = "kubernetes.io/service-account-token"

  depends_on = [kubernetes_service_account.argocd_manager]
}

resource "kubernetes_cluster_role" "argocd_manager" {
  metadata {
    name = "argocd-manager-role"
  }

  rule {
    api_groups = ["*"]
    resources  = ["*"]
    verbs      = ["*"]
  }

  rule {
    non_resource_urls = ["*"]
    verbs             = ["*"]
  }
}

resource "kubernetes_cluster_role_binding" "argocd_manager" {
  metadata {
    name = "argocd-manager-role-binding"
  }

  role_ref {
    api_group = "rbac.authorization.k8s.io"
    kind      = "ClusterRole"
    name      = kubernetes_cluster_role.argocd_manager.metadata[0].name
  }

  subject {
    kind      = "ServiceAccount"
    name      = kubernetes_service_account.argocd_manager.metadata[0].name
    namespace = kubernetes_service_account.argocd_manager.metadata[0].namespace
  }

  depends_on = [
    kubernetes_service_account.argocd_manager,
    kubernetes_cluster_role.argocd_manager
  ]
}

