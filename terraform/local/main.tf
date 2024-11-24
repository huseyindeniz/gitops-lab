module "project001" {
  source                      = "../modules/project001"
  env_list                    = local.envs
  app_ns_prefix_project001_wf = "project-001-wf-local"

  providers = {
    kubernetes = kubernetes
    helm       = helm
  }
}
