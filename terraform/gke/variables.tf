variable "kube_context" {
  description = "aks k8s cluster context name"
  type        = string
}

variable "region" {
  type    = string
  default = "us-east1"
}

variable "zone" {
  type    = string
  default = "us-east1-a"
}

variable "project" {
  type = string
}

