terraform {
  required_version = ">= 1.0.0"

  required_providers {
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.22"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.10"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
    flux = {
      source  = "fluxcd/flux"
      version = ">= 1.4"
    }
    github = {
      source  = "integrations/github"
      version = ">= 6.1"
    }
    argocd = {
      source  = "argoproj-labs/argocd"
      version = "7.1.0"
    }
    kubectl = {
      source  = "gavinbunney/kubectl"
      version = ">= 1.7.0"
    }
  }
}
