# outputs.tf for Argo CD

# Output the Argo CD admin password
output "argo_cd_admin_password" {
  description = "The Argo CD initial admin password"
  value       = data.kubernetes_secret.argo_cd_admin_secret.data["password"]
  sensitive   = true
}


# Output the Argo Workflows token
output "argo_workflows_service_account_token" {
  description = "The Argo Workflows token"
  value       = data.kubernetes_secret.argo_workflows_token.data["token"]
  sensitive   = true
}


