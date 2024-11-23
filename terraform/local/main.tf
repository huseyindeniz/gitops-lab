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

# module "project001" {
#   source                      = "../modules/project001"
#   env_list                    = local.envs
#   app_ns_prefix_project001_wf = "project-001-wf-local"

#   depends_on = [module.local_argo]
# }

# resource "kubernetes_namespace" "project_001_weather_forecast_stag_3" {
#   metadata {
#     name = "project-001-wf-stag-3"
#   }
# }

# module "project_001_wf_stag_3_postgresql" {
#   source               = "../modules/postgresql"
#   resources_prefix     = "project-001-wf-stag-3"
#   postgresql_namespace = "project-001-wf-stag-3"
#   db_name              = "db"
#   db_user              = "user"
#   db_port              = 5432
#   storage_size         = "1Gi"
#   pv_path              = "/mnt/data/project-001-wf-stag-3"
#   depends_on           = [kubernetes_namespace.project_001_weather_forecast_stag_3]
# }
