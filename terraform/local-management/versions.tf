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
    kubectl = {
      source  = "gavinbunney/kubectl"
      version = "~> 1.19"
    }
    github = {
      source  = "integrations/github"
      version = "~> 6.8"
    }
    # flux = {
    #   source  = "fluxcd/flux"
    #   version = "~> 1.7"
    # }
    null = {
      source  = "hashicorp/null"
      version = "~> 3.2"
    }
  }
}
