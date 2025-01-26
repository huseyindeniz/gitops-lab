module "local_cert_manager" {
  source = "../modules/cert-manager"
}

module "local_arc" {
  source          = "../modules/arc-runners"
  name            = "arc-runner-wsl"
  github_repo_url = "https://github.com/${var.flux_github_org}/${var.flux_github_repository}"
  github_arc_pat  = var.github_arc_pat

  providers = {
    kubernetes = kubernetes
    helm       = helm
    kubectl    = kubectl
  }

  depends_on = [module.local_cert_manager]
}
