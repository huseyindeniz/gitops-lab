variable "operator_namespace" {
  description = "Namespace for MinIO operator"
  type        = string
  default     = "minio-operator"
}

variable "operator_version" {
  description = "MinIO operator Helm chart version"
  type        = string
}
