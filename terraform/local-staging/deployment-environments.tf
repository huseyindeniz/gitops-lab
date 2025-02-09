resource "kubernetes_config_map" "deployment_environments" {
  metadata {
    name = "deployment-environments"
  }

  data = {
    "environments" = jsonencode(["stag-1", "stag-2"])
  }
}
