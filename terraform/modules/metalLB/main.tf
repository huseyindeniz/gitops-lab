resource "helm_release" "metallb" {
  name             = var.name
  namespace        = var.namespace
  chart            = "metallb"
  repository       = "https://metallb.github.io/metallb"
  version          = var.metallb_version
  create_namespace = false
  skip_crds        = false
  wait             = true
}
