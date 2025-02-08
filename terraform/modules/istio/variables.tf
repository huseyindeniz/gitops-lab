variable "istio_namespace" {
  description = "Istio namespace"
  type        = string
}

variable "istio_base_values_file" {
  description = "Path to the istio base values file"
  type        = string
}

variable "istiod_values_file" {
  description = "Path to the istiod values file"
  type        = string
}
