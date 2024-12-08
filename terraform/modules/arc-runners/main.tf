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
  namespace  = kubernetes_namespace.arc_systems.metadata[0].name

  depends_on = [
    kubernetes_secret.runner_secret
  ]
}

resource "helm_release" "arc_scale_set" {
  name       = "arc-scale-set"
  repository = "oci://ghcr.io/actions/actions-runner-controller-charts"
  chart      = "gha-runner-scale-set-controller"
  namespace  = kubernetes_namespace.arc_systems.metadata[0].name

  depends_on = [
    kubernetes_secret.runner_secret
  ]
}

resource "helm_release" "arc_runner" {
  name       = "arc-runner"
  repository = "oci://ghcr.io/actions/actions-runner-controller-charts"
  chart      = "gha-runner-scale-set"
  namespace  = kubernetes_namespace.arc_runners.metadata[0].name

  values = [
    file("${path.module}/values/arc-runner-values.yaml"),
    yamlencode({
      githubConfigUrl = var.github_repo_url
      githubConfigSecret = {
        github_token = var.github_arc_pat
      }
    })
  ]

  depends_on = [
    helm_release.arc
  ]
}
