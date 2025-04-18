output "argo_cd_local_admin_password" {
  description = "The Argo CD initial admin password"
  value       = module.local_argo.argo_cd_admin_password
  sensitive   = true
  depends_on  = [module.local_argo]
}

output "dashboard_token" {
  value     = kubernetes_secret.dashboard_admin_token.data["token"]
  sensitive = true

  depends_on = [kubernetes_secret.dashboard_admin_token]
}
