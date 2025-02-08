# outputs.tf for Argo CD

output "argo_cd_release" {
  value = helm_release.argo_cd
}

# Output the Argo CD admin password
output "argo_cd_admin_password" {
  description = "The Argo CD initial admin password"
  value       = data.kubernetes_secret.argo_cd_admin_secret.data["password"]
  sensitive   = true

  depends_on = [helm_release.argo_cd]
}
