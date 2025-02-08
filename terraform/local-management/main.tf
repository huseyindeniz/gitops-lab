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

  providers = {
    kubernetes = kubernetes
    helm       = helm
  }

  depends_on = [kubernetes_namespace.istio]
}

resource "kubernetes_manifest" "istio_gateway" {
  manifest   = yamldecode(file("${path.module}/values/istio-gateway.yaml"))
  depends_on = [module.local_istio]
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
  depends_on = [module.local_argo, kubernetes_manifest.istio_gateway]
}
