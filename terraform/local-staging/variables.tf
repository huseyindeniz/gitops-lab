# variables.tf for shared variables

variable "kubeconfig_path" {
  type    = string
  default = "~/.kube/config"
}

variable "kubeconfig_context" {
  type    = string
  default = "local-staging"
}

variable "istio_namespace" {
  description = "The name of the istio namespace"
  type        = string
}

variable "github_org" {
  description = "GitHub organization"
  type        = string
  default     = "huseyindeniz"
}

variable "github_repository" {
  description = "GitHub repository"
  type        = string
  default     = "gitops-lab"
}

variable "github_arc_pat" {
  description = "GitHub arc PAT"
  sensitive   = true
  type        = string
}
