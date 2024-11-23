locals {
  envs                        = jsondecode(data.kubernetes_config_map.deployment_environments.data["environments"])
  app_ns_prefix_project001_wf = "project-001-wf"
}
