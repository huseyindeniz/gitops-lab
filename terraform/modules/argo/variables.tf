variable "argo_namespace" {
  description = "Argo namespace"
  type        = string
  default     = "argo"
}

variable "argo_cd_values_file" {
  description = "Path to the Argo CD values file"
  type        = string
}

variable "argo_cd_applications_source_repo_url" {
  description = "Argo CD applications source repo url"
  type        = string
}

variable "argo_cd_applications_source_repo_path" {
  description = "Argo CD applications source repo path"
  type        = string
}

variable "argo_cd_applications_destination_server" {
  description = "Argo CD applications destination server"
  type        = string
}

variable "argo_rollouts_values_file" {
  description = "Path to the Argo Rollouts values file"
  type        = string
}

variable "argo_workflows_values_file" {
  description = "Path to the Argo Workflows values file"
  type        = string
}

variable "argo_workflows_templates_source_repo_url" {
  description = "Workflows templates source repo url"
  type        = string
}

variable "argo_workflows_templates_source_repo_path" {
  description = "Workflows templates source repo path"
  type        = string
}

variable "argo_workflows_templates_destination_server" {
  description = "Workflows templates destination server"
  type        = string
}
