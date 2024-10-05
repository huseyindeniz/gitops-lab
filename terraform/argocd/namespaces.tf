resource "kubernetes_namespace" "argo_cd_local" {
  metadata {
    name = "argo-cd-local"
  }
}

locals {
  project001weatherforecastns = "project-001-wf"
}

resource "kubernetes_namespace" "project_001_weather_forecast" {
  metadata {
    name = local.project001weatherforecastns
  }
}

resource "kubernetes_namespace" "project_001_weather_forecast_env" {
  for_each = { for env in var.env_names : env.name => env }

  metadata {
    name = "${local.project001weatherforecastns}-${each.value.name}" # Construct the namespace name
  }
}

# resource "kubernetes_namespace" "monitoring" {
#   metadata {
#     name = "monitoring"
#   }
# }
