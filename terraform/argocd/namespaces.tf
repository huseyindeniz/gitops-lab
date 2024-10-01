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
