# outputs.tf for Argo CD

# Output the Argo CD admin password
output "argo_cd_local_admin_password" {
  description = "The Argo CD initial admin password"
  value       = data.kubernetes_secret.argo_cd_local_admin_secret.data["password"]
  sensitive   = true
}
