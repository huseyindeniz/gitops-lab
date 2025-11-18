output "operator_namespace" {
  description = "Namespace where Redis operator is installed"
  value       = kubernetes_namespace.redis_operator.metadata[0].name
}

output "operator_status" {
  description = "Redis operator Helm release status"
  value       = helm_release.redis_operator.status
}
