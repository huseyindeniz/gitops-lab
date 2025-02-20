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

variable "local_staging_cluster_bearer_token" {
  sensitive = true
  type      = string
}

variable "local_staging_cluster_server_url" {
  type    = string
  default = "https://172.17.0.5:8443"
}

variable "local_production_cluster_bearer_token" {
  sensitive = true
  type      = string
}

variable "local_production_cluster_server_url" {
  type    = string
  default = "https://172.17.0.8:8443"
}
