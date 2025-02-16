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

variable "istio_ingressgateway_values_file" {
  description = "Path to the istio ingressgateway values file"
  type        = string
}

variable "issuer_name" {
  description = "issuer name"
  type        = string
}

variable "tls_secret_name" {
  description = "tls secret name"
  type        = string
}

variable "dns_name" {
  description = "dns name"
  type        = string
}
