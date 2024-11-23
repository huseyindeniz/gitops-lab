# resource "kubernetes_namespace" "project_001_weather_forecast_env" {
#   for_each = { for env in local.envs : env.name => env }

#   metadata {
#     name = "${local.app_ns_prefix_project001_wf}-${each.value.name}" # Construct the namespace name
#   }
# }

resource "kubernetes_namespace" "monitoring" {
  metadata {
    name = "monitoring"
  }
}
