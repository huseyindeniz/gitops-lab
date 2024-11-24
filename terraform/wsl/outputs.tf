output "argo_cd_wsl_admin_password" {
  description = "The Argo CD initial admin password"
  value       = module.local_argo.argo_cd_admin_password
  sensitive   = true
  depends_on  = [module.local_argo]
}
output "argo_workflows_wsl_service_account_token" {
  description = "The Argo Workflows token"
  value       = module.local_argo.argo_workflows_service_account_token
  sensitive   = true
  depends_on  = [module.local_argo]
}
