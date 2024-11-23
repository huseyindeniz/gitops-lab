resource "kubernetes_namespace" "project_001_weather_forecast" {
  metadata {
    name = var.app_ns_prefix_project001_wf
  }
}

resource "kubernetes_namespace" "project_001_weather_forecast_env" {
  for_each = { for env in var.env_list : env.name => env }

  metadata {
    name = "${var.app_ns_prefix_project001_wf}-${each.value.name}" # Construct the namespace name
  }
}

