variable "argo_namespace" {
  description = "Argo namespace"
  type        = string
}

variable "argo_cd_values_file" {
  description = "Path to the Argo CD values file"
  type        = string
  default     = ""
}
