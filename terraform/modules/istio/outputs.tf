
output "istioingress_id" {
  value       = helm_release.istio_ingress.id
  description = "The ID of the Istio Ingress Helm release"
}
