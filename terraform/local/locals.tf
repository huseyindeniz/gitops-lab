locals {
  envs                        = jsondecode(data.kubernetes_config_map.deployment_environments.data["environments"])
  project001weatherforecastns = "project-001-wf"
}
