# resource "flux_bootstrap_git" "flux_bootstrap" {
#   embedded_manifests = true
#   path               = var.flux_path
#   components_extra   = ["image-reflector-controller", "image-automation-controller"]
# }
