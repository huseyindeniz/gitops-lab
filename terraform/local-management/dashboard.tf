resource "kubernetes_service_account" "dashboard_admin" {
  metadata {
    name      = "admin-user"
    namespace = kubernetes_namespace.dashboard.metadata[0].name
  }

  depends_on = [kubernetes_namespace.dashboard]
}

resource "kubernetes_secret" "dashboard_admin_token" {
  metadata {
    name      = "admin-user"
    namespace = kubernetes_namespace.dashboard.metadata[0].name
    annotations = {
      "kubernetes.io/service-account.name" = kubernetes_service_account.dashboard_admin.metadata[0].name
    }
  }

  type = "kubernetes.io/service-account-token"

  depends_on = [kubernetes_service_account.dashboard_admin]
}

resource "kubernetes_cluster_role_binding" "dashboard_admin" {
  metadata {
    name = "admin-user"
  }

  role_ref {
    api_group = "rbac.authorization.k8s.io"
    kind      = "ClusterRole"
    name      = "cluster-admin"
  }

  subject {
    kind      = "ServiceAccount"
    name      = kubernetes_service_account.dashboard_admin.metadata[0].name
    namespace = kubernetes_service_account.dashboard_admin.metadata[0].namespace
  }

  depends_on = [kubernetes_service_account.dashboard_admin]
}
