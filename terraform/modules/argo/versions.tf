terraform {
  required_version = ">= 1.0.0"

  required_providers {
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.0"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.0"
    }
    # argocd = {
    #   source  = "argoproj-labs/argocd"
    #   version = "7.1.0"
    # }
  }
}
