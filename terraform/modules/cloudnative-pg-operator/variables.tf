variable "operator_namespace" {
  description = "Namespace for CloudNativePG operator"
  type        = string
  default     = "cnpg-system"
}

variable "operator_version" {
  description = "CloudNativePG operator Helm chart version"
  type        = string
}
