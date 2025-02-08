variable "argo_namespace" {
  description = "Argo namespace"
  type        = string
}

variable "argo_rollouts_values_file" {
  description = "Path to the Argo Rollouts values file"
  type        = string
  default     = ""
}
