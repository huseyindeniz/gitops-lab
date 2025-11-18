terraform {
  required_version = ">= 1.5.0"

  required_providers {
    flux = {
      source  = "fluxcd/flux"
      version = "~> 1.7"
    }
    github = {
      source  = "integrations/github"
      version = "~> 6.8"
    }
  }
}
