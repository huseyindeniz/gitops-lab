resource "flux_bootstrap_git" "flux_bootstrap" {
  embedded_manifests = false
  path               = "flux/local"
  components_extra   = ["image-reflector-controller", "image-automation-controller"]
}
