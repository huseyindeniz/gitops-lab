# Access the outputs from the Argo module
output "argo_cd_local_admin_password" {
  description = "The Argo CD initial admin password"
  value       = module.local_argo.argo_cd_admin_password
  sensitive   = true
  depends_on  = [module.local_argo]
}

output "argo_workflows_local_service_account_token" {
  description = "The Argo Workflows token"
  value       = module.local_argo.argo_workflows_service_account_token
  sensitive   = true
  depends_on  = [module.local_argo]
}

# output "project_001_weather_forecast_stag_3_db_info" {
#   description = "Stag 3 postgre info"
#   value       = module.project_001_wf_stag_3_postgresql.postgresql_db_info
#   sensitive   = true
# }

# output "project_001_weather_forecast_db_info" {
#   value = {
#     for env in local.envs :
#     env.name => {
#       db_name     = "${local.app_ns_prefix_project001_wf}-${env.name}-db"
#       db_user     = "${local.app_ns_prefix_project001_wf}_${env.name}-user"
#       db_password = random_password.project_001_weather_forecast_postgres_password[env.name].result
#     }
#   }

#   sensitive = true
# }


