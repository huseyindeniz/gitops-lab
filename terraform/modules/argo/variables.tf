variable "argo_namespace" {
  description = "Argo namespace"
  type        = string
}

variable "argocd_version" {
  description = "Argo CD Helm chart version"
  type        = string
  default     = "9.1.3"
}

variable "argo_cd_values_file" {
  description = "Path to the Argo CD values file"
  type        = string
  default     = ""
}
