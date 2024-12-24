resource "kubernetes_manifest" "argo_wsl_root_applications" {
  manifest = yamldecode(file("${path.module}/root-app.yaml"))
}
