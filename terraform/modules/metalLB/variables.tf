variable "name" {
  description = "Metallb namespace"
  type        = string
}

variable "namespace" {
  description = "Metallb namespace"
  type        = string
}

variable "metallb_version" {
  description = "MetalLB Helm chart version"
  type        = string
  default     = "0.15.2"
}
