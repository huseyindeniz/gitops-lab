resource "kubernetes_namespace" "argo_cd_local" {
  metadata {
    name = "argo-cd-local"
  }
}

resource "kubernetes_namespace" "project_001_weather_forecast" {
  metadata {
    name = "project-001-weather-forecast"
  }
}

resource "kubernetes_namespace" "project_001_weather_forecast_staging" {
  metadata {
    name = "project-001-weather-forecast-staging"
  }
}

resource "kubernetes_namespace" "project_001_weather_forecast_stag_1" {
  metadata {
    name = "project-001-weather-forecast-stag-1"
  }
}

resource "kubernetes_namespace" "project_001_weather_forecast_stag_2" {
  metadata {
    name = "project-001-weather-forecast-stag-2"
  }
}

resource "kubernetes_namespace" "project_001_weather_forecast_stag_3" {
  metadata {
    name = "project-001-weather-forecast-stag-3"
  }
}

# resource "kubernetes_namespace" "monitoring" {
#   metadata {
#     name = "monitoring"
#   }
# }
