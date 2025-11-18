variable "name" {
  description = "Arc Runner Name"
  type        = string
}

variable "github_repo_url" {
  description = "GitHub Repo Urls"
  type        = string
}

variable "github_arc_pat" {
  description = "GitHub arc PAT"
  sensitive   = true
  type        = string
}

variable "arc_controller_version" {
  description = "Actions Runner Controller Helm chart version"
  type        = string
  default     = "0.9.3"
}

variable "arc_scale_set_controller_version" {
  description = "ARC gha-runner-scale-set-controller Helm chart version"
  type        = string
  default     = "0.13.0"
}

variable "arc_runner_scale_set_version" {
  description = "ARC gha-runner-scale-set Helm chart version"
  type        = string
  default     = "0.13.0"
}
