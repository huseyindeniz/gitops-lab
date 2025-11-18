resource "kubernetes_secret" "runner_secret" {
  metadata {
    name      = "controller-manager"
    namespace = kubernetes_namespace.arc_systems.metadata[0].name
  }

  data = {
    github_token = var.github_arc_pat
  }

  type = "Opaque"
}

resource "helm_release" "arc" {
  name       = "arc"
  repository = "https://actions-runner-controller.github.io/actions-runner-controller"
  chart      = "actions-runner-controller"
  version    = var.arc_controller_version
  namespace  = kubernetes_namespace.arc_systems.metadata[0].name

  depends_on = [
    kubernetes_secret.runner_secret
  ]
}

resource "helm_release" "arc_scale_set" {
  name       = "arc-scale-set"
  repository = "oci://ghcr.io/actions/actions-runner-controller-charts"
  chart      = "gha-runner-scale-set-controller"
  version    = var.arc_scale_set_controller_version
  namespace  = kubernetes_namespace.arc_systems.metadata[0].name

  depends_on = [
    helm_release.arc
  ]
}

// for local only
# resource "helm_release" "dynamic_provision_volume_openebs" {
#   name       = "openebs"
#   chart      = "openebs"
#   repository = "https://openebs.github.io/openebs"
#   namespace  = "openebs"

#   create_namespace = true
# }

# resource "kubernetes_storage_class" "dynamic_blob_storage" {
#   metadata {
#     name = "dynamic-blob-storage"
#   }

#   storage_provisioner = "kubernetes.io/host-path"

#   parameters = {
#     type = "hostPath"
#   }

#   volume_binding_mode = "Immediate"
# }

resource "helm_release" "arc_runner" {
  name       = var.name
  repository = "oci://ghcr.io/actions/actions-runner-controller-charts"
  chart      = "gha-runner-scale-set"
  version    = var.arc_runner_scale_set_version
  namespace  = kubernetes_namespace.arc_runners.metadata[0].name

  values = [
    file("${path.module}/values/arc-runner-values.yaml"),
    yamlencode({
      githubConfigUrl = var.github_repo_url
      githubConfigSecret = {
        github_token = kubernetes_secret.runner_secret.data["github_token"]
      }
    })
  ]

  depends_on = [
    helm_release.arc_scale_set
  ]
}

resource "kubernetes_cluster_role" "arc_runner_cluster_role" {
  metadata {
    name = "arc-runner-cluster-role"
  }

  rule {
    api_groups = [""]
    resources  = ["pods", "services", "configmaps", "secrets"]
    verbs      = ["get", "list"]
  }

  depends_on = [helm_release.arc_runner]
}


resource "kubernetes_cluster_role_binding" "arc_runner_cluster_role_binding" {
  metadata {
    name = "arc-runner-cluster-role-binding"
  }

  role_ref {
    api_group = "rbac.authorization.k8s.io"
    kind      = "ClusterRole"
    name      = kubernetes_cluster_role.arc_runner_cluster_role.metadata[0].name
  }

  subject {
    kind      = "ServiceAccount"
    name      = "arc-runner-gha-rs-no-permission"
    namespace = kubernetes_namespace.arc_runners.metadata[0].name
  }

  depends_on = [kubernetes_cluster_role.arc_runner_cluster_role]
}

