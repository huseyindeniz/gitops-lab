
output "argocd_manager_secret" {
  value       = data.kubernetes_secret.argocd_manager.data
  description = "The secret data for the Argocd manager"
  sensitive   = true
}
