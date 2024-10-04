# variables.tf for shared variables

variable "kubeconfig_path" {
  type    = string
  default = "~/.kube/config"
}

variable "kubeconfig_context" {
  type    = string
  default = "minikube"
}

variable "env_names" {
  description = "List of environment configurations for the project"
  type = list(object({
    name = string
    port = number
  }))
}

variable "storage_size" {
  description = "Size of the storage for the PostgreSQL database"
  type        = string
  default     = "1Gi"
}

variable "db_name" {
  description = "Name of the PostgreSQL database"
  type        = string
  default     = "mydatabase" # Default database name
}

variable "db_user" {
  description = "User for the PostgreSQL database"
  type        = string
  default     = "myuser" # Default database user
}
