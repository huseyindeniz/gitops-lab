module "harbor_postgresql" {
  source = "../modules/postgresql"

  # Pass environment-specific variables to the postgres module
  resources_prefix     = kubernetes_namespace.harbor.metadata[0].name
  postgresql_namespace = kubernetes_namespace.harbor.metadata[0].name
  db_user              = "user_harbor"
  db_name              = "registry"
  db_port              = 5432
  storage_size         = "1Gi"
  pv_path              = "/mnt/data/harbor"

  depends_on = [kubernetes_namespace.harbor]
}
