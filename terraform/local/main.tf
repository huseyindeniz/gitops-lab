module "local_argo" {
  source                     = "../modules/argo" # Reference to the argo module
  argo_namespace             = var.argo_namespace
  argo_cd_values_file        = "${path.module}/values/argo-cd-values.yaml"
  argo_rollouts_values_file  = "${path.module}/values/argo-rollouts-values.yaml"
  argo_workflows_values_file = "${path.module}/values/argo-workflows-values.yaml"

  argo_cd_applications_source_repo_url    = "https://github.com/${var.flux_github_org}/${var.flux_github_repository}.git"
  argo_cd_applications_source_repo_path   = "${var.flux_path}/applications"
  argo_cd_applications_destination_server = "https://kubernetes.default.svc"

  argo_workflows_templates_source_repo_url    = "https://github.com/${var.flux_github_org}/${var.flux_github_repository}.git"
  argo_workflows_templates_source_repo_path   = "${var.flux_path}/workflows-templates"
  argo_workflows_templates_destination_server = "https://kubernetes.default.svc"

  providers = {
    kubernetes = kubernetes
    helm       = helm
  }
}

module "project001" {
  source                      = "../modules/project001"
  env_list                    = local.envs
  app_ns_prefix_project001_wf = "project-001-wf-local"

  depends_on = [module.local_argo.argo_cd_release]
}
