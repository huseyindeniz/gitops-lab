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

provider "kubectl" {
  config_path    = var.kubeconfig_path
  config_context = var.kubeconfig_context
}

provider "github" {
  owner = var.flux_github_org
  token = var.flux_github_pat
}

provider "flux" {
  kubernetes = {
    config_path    = var.kubeconfig_path
    config_context = var.kubeconfig_context
  }
  git = {
    url = local.gitopslab_repo_url
    http = {
      username = "Local Flux"
      password = var.flux_github_pat
    }
    branch = "main"
  }
}

provider "argocd" {
  server_addr = "argocd.management.local"
  username    = "admin"
  password    = var.argo_cd_admin_password
  insecure    = true
}
