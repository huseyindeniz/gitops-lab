locals {
  environments       = jsondecode(kubernetes_config_map.deployment_environments.data["environments"])
  gitopslab_repo_url = "https://github.com/${var.github_org}/${var.github_repository}"
}
