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
  source                 = "../modules/istio"
  istio_namespace        = kubernetes_namespace.istio.metadata.0.name
  istio_base_values_file = "${path.module}/values/istio-base.yaml"
  istiod_values_file     = "${path.module}/values/istio-istiod.yaml"
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

resource "kubernetes_manifest" "argo_management_root" {
  manifest = yamldecode(templatefile("${path.module}/manifests/argo-root.yaml", {
    argo_namespace     = kubernetes_namespace.argocd.metadata.0.name
    gitopslab_repo_url = local.gitopslab_repo_url
    id                 = module.local_argo.id // fake id for this resource to depend on the module argo
    root_path          = "${var.flux_path}/apps/local-management"
  }))

  depends_on = [kubernetes_namespace.argocd]
}


# FLUX
# resource "flux_bootstrap_git" "flux_bootstrap" {
#   embedded_manifests = true
#   path               = var.flux_path
#   components_extra   = ["image-reflector-controller", "image-automation-controller"]

#   depends_on = [module.local_argo]
# }

