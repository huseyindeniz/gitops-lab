variable "argo_namespace" {
  description = "Argo namespace"
  type        = string
}

variable "values_file" {
  description = "Path to the Argo Workflows values file"
  type        = string
  default     = ""
}
