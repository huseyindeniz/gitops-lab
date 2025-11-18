output "operator_namespace" {
  description = "Namespace where CloudNativePG operator is installed"
  value       = kubernetes_namespace.cnpg_system.metadata[0].name
}

output "operator_status" {
  description = "CloudNativePG operator Helm release status"
  value       = helm_release.cloudnative_pg_operator.status
}
