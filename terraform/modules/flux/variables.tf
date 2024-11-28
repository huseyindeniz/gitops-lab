# variables.tf for shared variables

variable "kubeconfig_path" {
  type = string
}

variable "kubeconfig_context" {
  type = string
}

variable "flux_github_org" {
  description = "Flux GitHub organization"
  type        = string
}

variable "flux_github_repository" {
  description = "Flux GitHub repository"
  type        = string
}

variable "flux_path" {
  description = "Flux path"
  type        = string
}

variable "flux_username" {
  description = "Flux username"
  type        = string
}


variable "flux_github_token" {
  description = "Flux GitHub token"
  sensitive   = true
  type        = string
}

