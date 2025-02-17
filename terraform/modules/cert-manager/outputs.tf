
output "id" {
  value       = helm_release.cert_manager.id
  description = "The ID of the Cert Manager Helm release"
}
