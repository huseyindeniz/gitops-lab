terraform {
  required_version = ">= 1.5.0"

  required_providers {
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.38"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 3.1"
    }
    # argocd = {
    #   source  = "argoproj-labs/argocd"
    #   version = "7.1.0"
    # }
  }
}
