variable "app_ns_prefix_project001_wf" {
  type = string
}

variable "env_list" {
  type = list(object({
    name = string
    type = string
  }))
}
