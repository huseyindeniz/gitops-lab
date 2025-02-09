resource "kubernetes_config_map" "deployment_environments" {
  metadata {
    name = "deployment-environments"
  }

  data = {
    "environments" = jsonencode(["prod-bluegreen", "prod-canary"])
  }
}
