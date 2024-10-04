variable "kube_context" {
  description = "aws k8s cluster context name"
  type        = string
}

variable "region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

