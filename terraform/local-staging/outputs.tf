output "argocd_manager_token" {
  value       = kubernetes_secret.argocd_manager_token.data["token"]
  description = "The token for Argocd manager"
  sensitive   = true

  depends_on = [kubernetes_secret.argocd_manager_token]
}
