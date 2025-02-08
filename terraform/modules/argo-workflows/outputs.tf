output "argo_workflows_release" {
  value = helm_release.argo_workflows
}

# Output the Argo Workflows token
output "argo_workflows_service_account_token" {
  description = "The Argo Workflows token"
  value       = data.kubernetes_secret.argo_workflows_token.data["token"]
  sensitive   = true

  depends_on = [helm_release.argo_workflows]
}


