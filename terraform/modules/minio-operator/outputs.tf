output "operator_namespace" {
  description = "Namespace where MinIO operator is installed"
  value       = kubernetes_namespace.minio_operator.metadata[0].name
}

output "operator_status" {
  description = "MinIO operator Helm release status"
  value       = helm_release.minio_operator.status
}
