resource "null_resource" "cert_manager_crds" {
  triggers = {
    version = var.cert_manager_version
  }

  provisioner "local-exec" {
    command = <<-EOT
      kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/${self.triggers.version}/cert-manager.crds.yaml
      kubectl wait --for condition=established --timeout=300s crd/certificaterequests.cert-manager.io
      kubectl wait --for condition=established --timeout=300s crd/certificates.cert-manager.io
      kubectl wait --for condition=established --timeout=300s crd/challenges.acme.cert-manager.io
      kubectl wait --for condition=established --timeout=300s crd/clusterissuers.cert-manager.io
      kubectl wait --for condition=established --timeout=300s crd/issuers.cert-manager.io
      kubectl wait --for condition=established --timeout=300s crd/orders.acme.cert-manager.io
    EOT
  }

  provisioner "local-exec" {
    when    = destroy
    command = "kubectl delete -f https://github.com/cert-manager/cert-manager/releases/download/${self.triggers.version}/cert-manager.crds.yaml --ignore-not-found=true"
  }

  depends_on = [kubernetes_namespace.cert_manager]
}
