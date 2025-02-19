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

resource "kubernetes_manifest" "metallb_ippool" {
  manifest = yamldecode(templatefile("${path.module}/manifests/IPAddressPool.yaml", {
    ip_range = "172.17.0.50-172.17.0.99"
    id       = module.local_metallb.id // fake id for this resource to depend on the module metallb
  }))
}

resource "kubernetes_manifest" "metallb_l2advertisement" {
  manifest = yamldecode(templatefile("${path.module}/manifests/L2Advertisement.yaml", {
    id = module.local_metallb.id // fake id for this resource to depend on the module metallb
  }))
}

# resource "kubernetes_manifest" "metallb_bgpadvertisement" {
#   manifest = yamldecode(templatefile("${path.module}/manifests/BGPAdvertisement.yaml", {
#     id = module.local_metallb.id // fake id for this resource to depend on the module metallb
#   }))
# }

# resource "kubernetes_manifest" "metallb_bgppeer" {
#   manifest = yamldecode(templatefile("${path.module}/manifests/BGPPeer.yaml", {
#     id = module.local_metallb.id // fake id for this resource to depend on the module metallb
#   }))
# }

# ISTIO
module "local_istio" {
  source                           = "../modules/istio"
  istio_namespace                  = kubernetes_namespace.istio.metadata.0.name
  dns_name                         = "*.management.local"
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

resource "kubernetes_manifest" "istio_gateway" {
  manifest = yamldecode(templatefile("${path.module}/manifests/istio-gateway.yaml", {
    istio_namespace = kubernetes_namespace.istio.metadata.0.name
    tls_secret_name = "management-local-tls-secret"
    dns_name        = "*.management.local"
    id              = module.local_istio.istioingress_id // fake id for this resource to depend on the module istio
  }))
}

resource "kubernetes_manifest" "virtual_service_k8sdashboard" {
  manifest = yamldecode(templatefile("${path.module}/manifests/k8s-dashboard-virtualservice.yaml", {
    id = module.local_istio.istioingress_id // fake id for this resource to depend on the module istio
  }))
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

resource "kubernetes_manifest" "virtual_service_argocd" {
  manifest = yamldecode(templatefile("${path.module}/manifests/argocd-virtualservice.yaml", {
    id = module.local_argo.id // fake id for this resource to depend on the module argo
  }))
}

resource "kubernetes_manifest" "argo_management_root" {
  manifest = yamldecode(templatefile("${path.module}/manifests/argo-root.yaml", {
    argo_namespace     = kubernetes_namespace.argocd.metadata.0.name
    gitopslab_repo_url = local.gitopslab_repo_url
    root_path          = "${var.flux_path}/apps/local-management"
  }))

  depends_on = [kubernetes_namespace.argocd]
}

resource "kubernetes_manifest" "virtual_service_harbor" {
  manifest = yamldecode(templatefile("${path.module}/manifests/harbor-virtualservice.yaml", {
  }))
  depends_on = [kubernetes_namespace.istio]
}


# FLUX
# resource "flux_bootstrap_git" "flux_bootstrap" {
#   embedded_manifests = true
#   path               = var.flux_path
#   components_extra   = ["image-reflector-controller", "image-automation-controller"]

#   depends_on = [module.local_argo]
# }

