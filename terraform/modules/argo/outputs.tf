# outputs.tf for Argo CD


output "id" {
  value       = helm_release.argo_cd.id
  description = "The ID of the Argo CD Helm release"
}


# Output the Argo CD admin password
output "argo_cd_admin_password" {
  description = "The Argo CD initial admin password"
  value       = data.kubernetes_secret.argo_cd_admin_secret.data["password"]
  sensitive   = true

  depends_on = [helm_release.argo_cd]
}
