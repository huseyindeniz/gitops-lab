variable "resources_prefix" {
  description = "prefix for resources"
  type        = string
}

variable "postgresql_namespace" {
  description = "Postgresql namespace"
  type        = string
}

variable "db_name" {
  description = "Postgresql db name"
  type        = string
}

variable "db_user" {
  description = "Postgresql db user"
  type        = string
}

variable "db_port" {
  description = "Postgresql port"
  type        = number
  default     = 5432
}

variable "storage_size" {
  description = "Size of the storage for the PostgreSQL database"
  type        = string
}
