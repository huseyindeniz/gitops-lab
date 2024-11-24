module "local_argo" {
  source                     = "../modules/argo" # Reference to the argo module
  argo_namespace             = var.argo_namespace
  argo_cd_values_file        = "${path.module}/values/argo-cd-values.yaml"
  argo_rollouts_values_file  = "${path.module}/values/argo-rollouts-values.yaml"
  argo_workflows_values_file = "${path.module}/values/argo-workflows-values.yaml"

  providers = {
    kubernetes = kubernetes
    helm       = helm
  }
}

module "local_monitoring" {
  source                            = "../modules/monitoring"
  namespace                         = var.monitoring_namespace
  kube_prometheus_stack_values_file = "${path.module}/values/kube-prometheus-stack-values.yaml"

  prometheus_volume_config = {
    storage_capacity = "2Gi"
    storage_request  = "1Gi"
    host_path        = "mnt/data/prometheus"
  }

  grafana_volume_config = {
    storage_capacity = "2Gi"
    storage_request  = "1Gi"
    host_path        = "mnt/data/prometheus"
  }

  providers = {
    kubernetes = kubernetes
    helm       = helm
  }
}