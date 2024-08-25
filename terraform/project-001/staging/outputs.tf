# outputs.tf for Argo CD

# Output the Argo CD admin password
output "project_001_staging_argo_cd_admin_password" {
  description = "The Argo CD initial admin password"
  value       = data.kubernetes_secret.project_001_staging_argo_cd_admin_secret.data["password"]
  sensitive   = true
}
