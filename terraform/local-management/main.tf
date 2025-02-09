module "local_cert_manager" {
  source = "../modules/cert-manager"

  providers = {
    kubernetes = kubernetes
    helm       = helm
    kubectl    = kubectl
  }
}

module "local_istio" {
  source          = "../modules/istio"
  istio_namespace = kubernetes_namespace.istio.metadata.0.name

  istio_base_values_file = "${path.module}/values/istio-base.yaml"
  istiod_values_file     = "${path.module}/values/istio-istiod.yaml"
  gateway_host           = "*.management.local"
  tls_secret_name        = "management-local-tls-secret"
  issuer_name            = "selfsigned-issuer"
  issuer_namespace       = kubernetes_namespace.istio.metadata.0.name

  providers = {
    kubernetes = kubernetes
    helm       = helm
  }

  depends_on = [kubernetes_namespace.istio, module.local_cert_manager]
}

module "local_argo" {
  source              = "../modules/argo" # Reference to the argo module
  argo_namespace      = kubernetes_namespace.argocd.metadata.0.name
  argo_cd_values_file = "${path.module}/values/argocd.yaml"

  providers = {
    kubernetes = kubernetes
    helm       = helm
  }

  depends_on = [kubernetes_namespace.argocd]
}

resource "kubernetes_manifest" "argocd_vs" {
  manifest   = yamldecode(file("${path.module}/values/argocd-virtualservice.yaml"))
  depends_on = [module.local_argo, module.local_istio]
}

resource "flux_bootstrap_git" "flux_bootstrap" {
  embedded_manifests = true
  path               = var.flux_path
  components_extra   = ["image-reflector-controller", "image-automation-controller"]

  depends_on = [module.local_argo]
}
