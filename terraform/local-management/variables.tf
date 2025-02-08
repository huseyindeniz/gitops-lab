# variables.tf for shared variables

variable "kubeconfig_path" {
  type    = string
  default = "~/.kube/config"
}

variable "kubeconfig_context" {
  type    = string
  default = "local-management"
}

variable "istio_namespace" {
  description = "The name of the Argo CD namespace"
  type        = string
}

variable "argo_namespace" {
  description = "The name of the Argo CD namespace"
  type        = string
}

variable "flux_github_org" {
  description = "Flux GitHub organization"
  type        = string
  default     = "huseyindeniz"
}

variable "flux_github_repository" {
  description = "Flux GitHub repository"
  type        = string
  default     = "gitops-lab"
}

variable "flux_path" {
  description = "Flux path"
  type        = string
  default     = "flux"
}

variable "flux_github_pat" {
  description = "Flux GitHub PAT"
  sensitive   = true
  type        = string
}
