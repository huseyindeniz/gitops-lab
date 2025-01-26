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

module "harbor_postgresql" {
  source = "../modules/postgresql"

  # Pass environment-specific variables to the postgres module
  resources_prefix     = kubernetes_namespace.harbor_staging.metadata[0].name
  postgresql_namespace = kubernetes_namespace.harbor_staging.metadata[0].name
  db_user              = "user_harbor"
  db_name              = "registry"
  db_port              = 5432
  storage_size         = "1Gi"
  pv_path              = "/mnt/data/harbor-staging"

  depends_on = [kubernetes_namespace.harbor_staging]
}
