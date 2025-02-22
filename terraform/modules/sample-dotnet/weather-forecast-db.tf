module "weather_forecast_postgresql" {
  for_each = toset(var.env_list)

  source = "../postgresql"

  # Pass environment-specific variables to the postgres module
  resources_prefix     = "${var.app_ns_prefix_sample_dotnet_wf}-${each.key}" # Use env name as prefix
  postgresql_namespace = "${var.app_ns_prefix_sample_dotnet_wf}-${each.key}"
  db_user              = "user_${each.key}" # Example: user_dev, user_test
  db_name              = "db_${each.key}"   # Example: db_dev, db_test
  db_port              = 5432
  storage_size         = "1Gi"
  pv_path              = "/mnt/data/${var.app_ns_prefix_sample_dotnet_wf}-${each.key}"

  depends_on = [kubernetes_namespace.sample_dotnet_weather_forecast]
}

# Create ConfigMap after PostgreSQL is ready
resource "kubernetes_config_map" "weather_forecast_db_ready_environments" {
  metadata {
    name      = "${var.app_ns_prefix_sample_dotnet_wf}-db-ready-environments"
    namespace = var.app_ns_prefix_sample_dotnet_wf
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
    module.weather_forecast_postgresql
  ]
}
