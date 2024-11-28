provider "flux" {
  kubernetes = {
    config_path    = var.kubeconfig_path
    config_context = var.kubeconfig_context
  }
  git = {
    url = "https://github.com/${var.flux_github_org}/${var.flux_github_repository}.git"
    http = {
      username = var.flux_username # This can be any string when using a personal access token
      password = var.flux_github_token
    }
    branch = "main"
  }
}

provider "github" {
  owner = var.flux_github_org
  token = var.flux_github_token
}
