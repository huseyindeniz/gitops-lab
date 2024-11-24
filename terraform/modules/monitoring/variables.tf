variable "namespace" {
  description = "namespace"
  type        = string
  default     = "monitoring"
}

variable "kube_prometheus_stack_values_file" {
  description = "Path to the kube-prometheus-stack values file"
  type        = string
}

variable "grafana_volume_config" {
  description = "Configuration for Grafana volume storage"
  type = object({
    storage_capacity = string
    storage_request  = string
    host_path        = string
  })
}

variable "prometheus_volume_config" {
  description = "Configuration for Grafana volume storage"
  type = object({
    storage_capacity = string
    storage_request  = string
    host_path        = string
  })
}
