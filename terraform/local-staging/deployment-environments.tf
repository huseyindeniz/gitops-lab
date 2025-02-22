resource "kubernetes_config_map" "deployment_environments" {
  metadata {
    name = "deployment-environments"
  }

  data = {
    "environments" = jsonencode(["stag-1", "stag-2"])
  }
}

data "kubernetes_config_map" "deployment_environments" {
  metadata {
    name = kubernetes_config_map.deployment_environments.metadata[0].name
  }

  depends_on = [kubernetes_config_map.deployment_environments]
}
