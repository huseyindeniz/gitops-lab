# variables.tf for shared variables

variable "kubeconfig_path" {
  type    = string
  default = "~/.kube/config"
}

variable "kubeconfig_context" {
  type    = string
  default = "wsl-cluster"
}

variable "argo_namespace" {
  description = "The name of the Argo CD namespace"
  type        = string
  default     = "argo-wsl"
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
  default     = "flux/wsl"
}

variable "flux_github_token" {
  description = "Flux GitHub token"
  sensitive   = true
  type        = string
}

variable "github_arc_pat" {
  description = "GitHub arc PAT"
  sensitive   = true
  type        = string
}
