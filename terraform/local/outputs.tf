# output "argo_cd_local_admin_password" {
#   description = "The Argo CD initial admin password"
#   value       = module.local_argo.argo_cd_admin_password
#   sensitive   = true
#   depends_on  = [module.local_argo]
# }
# output "argo_workflows_local_service_account_token" {
#   description = "The Argo Workflows token"
#   value       = module.local_argo.argo_workflows_service_account_token
#   sensitive   = true
#   depends_on  = [module.local_argo]
# }

# output "project_001_wf_db_info" {
#   value = module.project001.weather_forecast_postgresql_db_info

#   sensitive  = true
#   depends_on = [module.project001]
# }
