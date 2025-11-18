variable "operator_namespace" {
  description = "Namespace for MinIO operator"
  type        = string
  default     = "minio-operator"
}

variable "operator_version" {
  description = "MinIO operator Helm chart version"
  type        = string
  default     = "6.0.4" # Latest stable version
}
