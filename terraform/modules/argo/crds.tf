resource "null_resource" "argocd_crds" {
  triggers = {
    version = var.argocd_version
  }

  provisioner "local-exec" {
    command = <<-EOT
      kubectl apply -k https://github.com/argoproj/argo-cd/manifests/crds?ref=v2.13.2
      kubectl wait --for condition=established --timeout=300s crd/applications.argoproj.io
      kubectl wait --for condition=established --timeout=300s crd/applicationsets.argoproj.io
      kubectl wait --for condition=established --timeout=300s crd/appprojects.argoproj.io
    EOT
  }

  provisioner "local-exec" {
    when    = destroy
    command = "kubectl delete -k https://github.com/argoproj/argo-cd/manifests/crds?ref=v2.13.2 --ignore-not-found=true"
  }
}
