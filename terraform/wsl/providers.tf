# providers.tf for shared providers config

provider "kubernetes" {
  config_path    = var.kubeconfig_path
  config_context = var.kubeconfig_context
}

provider "helm" {
  kubernetes {
    config_path    = var.kubeconfig_path
    config_context = var.kubeconfig_context
  }
}

provider "flux" {
  kubernetes = {
    config_path    = var.kubeconfig_path
    config_context = var.kubeconfig_context
  }
  git = {
    url = local.gitopslab_repo_url
    http = {
      username = "Local Flux" # This can be any string when using a personal access token
      password = var.flux_github_token
    }
    branch = "main"
  }
}

provider "github" {
  owner = var.flux_github_org
  token = var.flux_github_token
}

provider "kubectl" {

}
