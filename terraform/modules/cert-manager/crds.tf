data "http" "cert_manager_crds" {
  url = "https://github.com/cert-manager/cert-manager/releases/download/v1.12.0/cert-manager.crds.yaml"
}

data "kubectl_file_documents" "cert_manager_crds_install" {
  content = data.http.cert_manager_crds.response_body
}

resource "kubectl_manifest" "cert_manager_crds" {
  for_each  = data.kubectl_file_documents.cert_manager_crds_install.manifests
  yaml_body = each.value

  depends_on = [kubernetes_namespace.cert_manager]
}
