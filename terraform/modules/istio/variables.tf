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

variable "gateway_host" {
  description = "Host for the Istio Gateway"
  type        = string
}

variable "tls_secret_name" {
  description = "Kubernetes TLS secret name for HTTPS traffic"
  type        = string
}

variable "issuer_name" {
  description = "Name of the Cert-Manager Issuer for the certificate"
  type        = string
}

variable "issuer_namespace" {
  description = "Namespace where the Cert-Manager Issuer resides"
  type        = string
}
