# resource "github_repository" "flux_git_repo" {
#   name        = var.flux_github_repository
#   description = var.flux_github_repository
#   visibility  = "private"
#   auto_init   = true # This is extremely important as flux_bootstrap_git will not work without a repository that has been initialised
# }

resource "flux_bootstrap_git" "flux_bootstrap" {
  embedded_manifests = true
  path               = var.flux_path
  components_extra   = ["image-reflector-controller", "image-automation-controller"]
}
