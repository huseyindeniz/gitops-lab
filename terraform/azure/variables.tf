variable "kube_context" {
  description = "aks k8s cluster context name"
  type        = string
}

variable "subscriptionId" {
  description = "azure subscription id"
  type        = string
}

variable "appId" {
  description = "aks k8s cluster app id"
  type        = string
}

variable "password" {
  description = "aks k8s cluster password"
  type        = string
}
