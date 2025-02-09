locals {
  environments = jsondecode(kubernetes_config_map.deployment_environments.data["environments"])
}
