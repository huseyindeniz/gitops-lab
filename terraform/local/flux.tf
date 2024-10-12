resource "flux_bootstrap_git" "flux_bootstrap" {
  embedded_manifests = false
  path               = "terraform/argocd"
}
