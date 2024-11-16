# providers.tf for shared providers config

provider "kubernetes" {
  host           = "https://127.0.0.1:52289"
  config_path    = var.kubeconfig_path
  config_context = var.kubeconfig_context
}

provider "helm" {
  kubernetes {
    config_path = var.kubeconfig_path
  }
}

provider "flux" {
  kubernetes = {
    config_path    = var.kubeconfig_path
    config_context = var.kubeconfig_context
  }
  git = {
    url = "https://github.com/${var.flux_github_org}/${var.flux_github_repository}.git"
    http = {
      username = "git" # This can be any string when using a personal access token
      password = var.flux_github_token
    }
    branch = "main"
  }
}

provider "github" {
  owner = var.flux_github_org
  token = var.flux_github_token
}
