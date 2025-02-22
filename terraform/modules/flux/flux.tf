resource "flux_bootstrap_git" "flux_bootstrap" {
  embedded_manifests     = true
  path                   = var.flux_path
  components_extra       = ["image-reflector-controller", "image-automation-controller"]
  kustomization_override = <<EOT
  apiVersion: kustomize.toolkit.fluxcd.io/v1
  kind: Kustomization
  metadata:
    name: flux-system
    namespace: flux-system
  spec:
    interval: 10m0s
    path: ./flux
    prune: true
    sourceRef:
      kind: GitRepository
      name: flux-system
    validation: none
  EOT
}
