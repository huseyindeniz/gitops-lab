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
  description = "The name of the istio namespace"
  type        = string
}

variable "metallb_name" {
  description = "The name of the metalLB instance"
  type        = string
}

variable "metallb_namespace" {
  description = "The name of the metalLB namespace"
  type        = string
}

variable "argo_namespace" {
  description = "The name of the Argo CD namespace"
  type        = string
}

variable "harbor_namespace" {
  description = "The name of the Harbor namespace"
  type        = string
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

variable "flux_github_pat" {
  description = "Flux GitHub PAT"
  sensitive   = true
  type        = string
}

variable "local_staging_cluster_bearer_token" {
  sensitive = true
  type      = string
}

variable "local_staging_cluster_server_url" {
  type = string
}

variable "local_production_cluster_bearer_token" {
  sensitive = true
  type      = string
}

variable "local_production_cluster_server_url" {
  type = string
}

variable "github_oauth_client_id" {
  description = "GitHub OAuth client ID"
  type        = string
}

variable "github_oauth_client_secret" {
  description = "GitHub OAuth client secret"
  sensitive   = true
  type        = string
}
