resource "kubernetes_namespace" "sample_dotnet_weather_forecast" {
  metadata {
    name = var.app_ns_prefix_sample_dotnet_wf
  }
}

resource "kubernetes_namespace" "sample_dotnet_weather_forecast_env" {
  for_each = toset(var.env_list)

  metadata {
    name = "${var.app_ns_prefix_sample_dotnet_wf}-${each.key}"
  }
}

