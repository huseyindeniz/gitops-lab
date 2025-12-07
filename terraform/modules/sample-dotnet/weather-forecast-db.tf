module "weather_forecast_postgresql" {
  for_each = toset(var.env_list)

  source = "../postgresql"

  resources_prefix     = "${var.app_ns_prefix_sample_dotnet_wf}-${each.key}"
  postgresql_namespace = "${var.app_ns_prefix_sample_dotnet_wf}-${each.key}"
  db_user              = "user_${each.key}"
  db_name              = "db_${each.key}"
  db_port              = 5432
  storage_size         = "1Gi"

  providers = {
    kubernetes = kubernetes
    kubectl    = kubectl
  }

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
