output "argo_cd_local_admin_password" {
  description = "The Argo CD initial admin password"
  value       = module.local_argo.argo_cd_admin_password
  sensitive   = true
  depends_on  = [module.local_argo]
}
