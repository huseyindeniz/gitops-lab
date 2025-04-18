output "argocd_manager_token" {
  value       = kubernetes_secret.argocd_manager_token.data["token"]
  description = "The token for Argocd manager"
  sensitive   = true

  depends_on = [kubernetes_secret.argocd_manager_token]
}

output "dashboard_token" {
  value     = kubernetes_secret.dashboard_admin_token.data["token"]
  sensitive = true

  depends_on = [kubernetes_secret.dashboard_admin_token]
}
