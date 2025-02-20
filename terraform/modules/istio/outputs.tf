
output "istioingress_id" {
  value       = helm_release.istiod.id
  description = "The ID of the Istio Ingress Helm release"
}
