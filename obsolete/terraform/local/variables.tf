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
  default     = "argo-local"
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

variable "flux_github_pat" {
  description = "Flux GitHub PAT"
  sensitive   = true
  type        = string
}

variable "github_arc_pat" {
  description = "GitHub arc PAT"
  sensitive   = true
  type        = string
}

variable "wsl_cluster_bearer_token" {
  description = "WSL Cluster Bearer Token"
  sensitive   = true
  type        = string
}

variable "wsl_cluster_server" {
  description = "WSL Cluster Server"
  type        = string
  default     = "https://172.17.0.5:8443"
}

variable "argo_cd_admin_password" {
  sensitive = true
  type      = string
}
