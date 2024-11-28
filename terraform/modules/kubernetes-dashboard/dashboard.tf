# helm repo add kubernetes-dashboard https://kubernetes.github.io/dashboard/
# helm repo update
resource "helm_release" "kubernetes_dashboard" {
  name       = "kubernetes-dashboard"
  repository = "https://kubernetes.github.io/dashboard"
  chart      = "kubernetes-dashboard"
  namespace  = kubernetes_namespace.kubernetes_dashboard.metadata[0].name
  values = [
    file("${path.module}/values/dashboard-values.yaml"),
  ]
  depends_on = [kubernetes_namespace.kubernetes_dashboard]
}

resource "kubernetes_manifest" "kubernetes_dashboard_admin_user" {
  manifest = {
    "apiVersion" = "v1"
    "kind"       = "ServiceAccount"
    "metadata" = {
      "name"      = "admin-user"
      "namespace" = kubernetes_namespace.kubernetes_dashboard.metadata[0].name
    }
  }
  depends_on = [helm_release.kubernetes_dashboard]
}

resource "kubernetes_manifest" "kubernetes_dashboard_cluster_role_binding" {
  manifest = {
    "apiVersion" = "rbac.authorization.k8s.io/v1"
    "kind"       = "ClusterRoleBinding"
    "metadata" = {
      "name" = "admin-user"
    }
    "roleRef" = {
      "apiGroup" = "rbac.authorization.k8s.io"
      "kind"     = "ClusterRole"
      "name"     = "cluster-admin"
    }
    "subjects" = [{
      "kind"      = "ServiceAccount"
      "name"      = "admin-user"
      "namespace" = kubernetes_namespace.kubernetes_dashboard.metadata[0].name
    }]
  }
  depends_on = [kubernetes_manifest.kubernetes_dashboard_admin_user]
}

resource "kubernetes_manifest" "kubernetes_dashboard_secret" {
  manifest = {
    "apiVersion" = "v1"
    "kind"       = "Secret"
    "metadata" = {
      "name"      = "admin-user"
      "namespace" = kubernetes_namespace.kubernetes_dashboard.metadata[0].name
      "annotations" = {
        "kubernetes.io/service-account.name" = "admin-user"
      }
    }
    "type" = "kubernetes.io/service-account-token"
  }

  depends_on = [kubernetes_manifest.kubernetes_dashboard_cluster_role_binding]
}

data "kubernetes_secret" "admin_user_token" {
  metadata {
    name      = "admin-user"
    namespace = kubernetes_namespace.kubernetes_dashboard.metadata[0].name
  }

  depends_on = [kubernetes_manifest.kubernetes_dashboard_secret]
}


