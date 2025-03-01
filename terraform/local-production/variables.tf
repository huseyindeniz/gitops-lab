# variables.tf for shared variables

variable "kubeconfig_path" {
  type    = string
  default = "~/.kube/config"
}

variable "kubeconfig_context" {
  type    = string
  default = "local-production"
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

variable "argocd_namespace" {
  description = "The name of the argocd namespace - for rollouts"
  type        = string
}

variable "harbor_namespace" {
  description = "The name of the Harbor namespace"
  type        = string
}

variable "github_org" {
  description = "GitHub organization"
  type        = string
}

variable "github_repository" {
  description = "GitHub repository"
  type        = string
}

variable "github_arc_pat" {
  description = "GitHub arc PAT"
  sensitive   = true
  type        = string
}
