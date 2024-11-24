# helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
# helm repo add grafana https://grafana.github.io/helm-charts
# helm repo update

resource "helm_release" "prometheus" {
  name             = "prometheus"
  repository       = "https://prometheus-community.github.io/helm-charts"
  chart            = "kube-prometheus-stack"
  namespace        = var.namespace
  create_namespace = false

  values = [
    file("${path.module}/values/kube-prometheus-stack-values.yaml"),
    var.kube_prometheus_stack_values_file != "" ? file(var.kube_prometheus_stack_values_file) : null
  ]
  depends_on = [
    kubernetes_persistent_volume_claim.prometheus_pvc,
    kubernetes_persistent_volume_claim.grafana_pvc
  ]
}
