# CORE APPS WHICH WONT BE MANAGED BY ARGO CD

# CERT MANAGER
module "local_cert_manager" {
  source = "../modules/cert-manager"

  providers = {
    kubernetes = kubernetes
    helm       = helm
    kubectl    = kubectl
  }
}

# METALLB
module "local_metallb" {
  source    = "../modules/metallb"
  name      = var.metallb_name
  namespace = kubernetes_namespace.metallb.metadata.0.name
  providers = {
    helm = helm
  }

  depends_on = [kubernetes_namespace.metallb]
}

# ISTIO
module "local_istio" {
  source                           = "../modules/istio"
  istio_namespace                  = kubernetes_namespace.istio.metadata.0.name
  dns_names                        = ["*.management.local"]
  issuer_name                      = "istio-selfsigned-issuer"
  tls_secret_name                  = "management-local-tls-secret"
  istio_base_values_file           = "${path.module}/values/istio-base.yaml"
  istiod_values_file               = "${path.module}/values/istio-istiod.yaml"
  istio_ingressgateway_values_file = "${path.module}/values/istio-ingressgateway.yaml"

  providers = {
    kubernetes = kubernetes
    helm       = helm
  }

  depends_on = [kubernetes_namespace.istio]
}

# ARGO CD
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

# FLUX
# resource "flux_bootstrap_git" "flux_bootstrap" {
#   embedded_manifests = true
#   path               = var.flux_path
#   components_extra   = ["image-reflector-controller", "image-automation-controller"]

#   depends_on = [module.local_argo]
# }

