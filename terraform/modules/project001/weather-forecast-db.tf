module "weather_forecast_postgresql" {
  for_each = { for env in var.env_list : env.name => env }

  source = "../postgresql"

  # Pass environment-specific variables to the postgres module
  resources_prefix     = "${var.app_ns_prefix_project001_wf}-${each.value.name}" # Use env name as prefix
  postgresql_namespace = "${var.app_ns_prefix_project001_wf}-${each.value.name}"
  db_user              = "user_${each.value.name}" # Example: user_dev, user_test
  db_name              = "db_${each.value.name}"   # Example: db_dev, db_test
  db_port              = 5432
  storage_size         = each.value.type == "production" ? "1Gi" : "500Mi"
  pv_path              = "/mnt/data/${var.app_ns_prefix_project001_wf}-${each.value.name}"

  depends_on = [kubernetes_namespace.project_001_weather_forecast_env]
}

# Create ConfigMap after PostgreSQL is ready
resource "kubernetes_config_map" "weather_forecast_db_ready_environments" {
  metadata {
    name      = "${var.app_ns_prefix_project001_wf}-db-ready-environments"
    namespace = var.app_ns_prefix_project001_wf
  }

  data = {
    environments = jsonencode(
      [
        for env, module_data in module.weather_forecast_postgresql :
        {
          envName = env
        }
      ]
    )
  }

  depends_on = [
    module.weather_forecast_postgresql,
    kubernetes_namespace.project_001_weather_forecast
  ]
}
