variable "argo_namespace" {
  description = "Argo namespace"
  type        = string
  default     = "argo"
}

variable "argo_cd_values_file" {
  description = "Path to the Argo CD values file"
  type        = string
}

variable "argo_rollouts_values_file" {
  description = "Path to the Argo Rollouts values file"
  type        = string
}

variable "argo_workflows_values_file" {
  description = "Path to the Argo Workflows values file"
  type        = string
}
