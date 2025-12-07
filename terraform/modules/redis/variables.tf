variable "resources_prefix" {
  description = "prefix for resources"
  type        = string
}

variable "redis_namespace" {
  description = "redis namespace"
  type        = string
}

variable "storage_size" {
  description = "Size of the storage for the redis database"
  type        = string
}
