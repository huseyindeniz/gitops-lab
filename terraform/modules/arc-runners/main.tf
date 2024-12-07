# helm repo add arc https://actions-runner-controller.github.io/actions-runner-controller
# helm repo update
resource "helm_release" "arc" {
  name       = "arc"
  repository = "https://actions-runner-controller.github.io/actions-runner-controller"
  chart      = "actions-runner-controller"
  version    = "0.23.3"
  namespace  = kubernetes_namespace.runner-ns.metadata[0].name

  depends_on = [
    helm_release.cert-manager,
    kubernetes_secret.runner-secret
  ]
}
