
output "id" {
  value       = helm_release.metallb.id
  description = "The ID of the MetalLB Helm release"
}
