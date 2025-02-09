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
