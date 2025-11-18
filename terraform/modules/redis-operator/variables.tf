variable "operator_namespace" {
  description = "Namespace for Redis operator"
  type        = string
  default     = "ot-operators"
}

variable "operator_version" {
  description = "Redis operator Helm chart version"
  type        = string
  default     = "0.22.2" # Latest stable version
}
