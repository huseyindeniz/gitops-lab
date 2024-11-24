# variables.tf for shared variables

variable "kubeconfig_path" {
  type    = string
  default = "~/.kube/config"
}

variable "kubeconfig_context" {
  type    = string
  default = "local-cluster"
}

variable "argo_namespace" {
  description = "The name of the Argo CD namespace"
  type        = string
  default     = "argo-cd-local"
}

variable "monitoring_namespace" {
  description = "The name of the monitoring namespace"
  type        = string
  default     = "monitoring-local"
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
  default     = "flux/local"
}

variable "flux_github_token" {
  description = "Flux GitHub token"
  sensitive   = true
  type        = string
  default     = ""
}

variable "storage_size" {
  description = "Size of the storage for the PostgreSQL database"
  type        = string
  default     = "1Gi"
}

variable "db_name" {
  description = "Name of the PostgreSQL database"
  type        = string
  default     = "" # Default database name
}

variable "db_user" {
  description = "User for the PostgreSQL database"
  type        = string
  default     = "" # Default database user
}

