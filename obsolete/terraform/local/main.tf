module "local_cert_manager" {
  source = "../modules/cert-manager"
}

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

module "local_arc" {
  source          = "../modules/arc-runners"
  name            = "arc-runner"
  github_repo_url = "https://github.com/${var.flux_github_org}/${var.flux_github_repository}"
  github_arc_pat  = var.github_arc_pat

  providers = {
    kubernetes = kubernetes
    helm       = helm
    kubectl    = kubectl
  }

  depends_on = [module.local_cert_manager]
}


module "project001" {
  source                      = "../modules/project001"
  env_list                    = jsondecode(data.kubernetes_config_map.deployment_environments.data["environments"])
  app_ns_prefix_project001_wf = "project-001-wf-local"

  providers = {
    kubernetes = kubernetes
    helm       = helm
  }
}


# resource "kubernetes_secret" "flux_github_pat" {
#   metadata {
#     name      = "github-pat-secret"
#     namespace = "project-001-wf-local-stag-1"
#   }

#   data = {
#     github_pat = var.flux_github_pat
#   }

#   type = "Opaque"
# }

# resource "kubernetes_config_map" "project_001_wf_local_stag_1_notifications_cm" {
#   metadata {
#     name      = "project-001-wf-local-stag-1-notifications-cm"
#     namespace = "project-001-wf-local-stag-1"
#   }

#   data = {
#     "subscriptions"             = <<EOF
#       - recipients:
#         - trigger-ba-tests
#       triggers:
#         - project-001-wf-on-sync-succeeded
#       EOF
#     "template.trigger-ba-tests" = <<EOF
#       webhook:
#         trigger-ba-tests:
#           method: POST
#           url: https://api.github.com/repos/huseyindeniz/gitops-lab/dispatches
#           headers:
#             - name: Authorization
#               value: ${var.flux_github_pat}
#             - name: Content-Type
#               value: application/json
#           body: |
#             {
#               "event_type": "mysampleapp1-ba-tests",
#               "client_payload": {
#                 "app_name": "{{.app.metadata.name}}",
#                 "environment": "stag-2",
#                 "image_tag": "{{.app.status.sync.revision}}"
#                 "pr_number": "8"
#               }
#             }
#       EOF
#   }
# }

