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
    ip_range = "172.17.0.100-172.17.0.149"
    id       = module.local_metallb.id // fake id for this resource to depend on the module metallb
  }))
}

resource "kubernetes_manifest" "metallb_bgpadvertisement" {
  manifest = yamldecode(templatefile("${path.module}/manifests/BGPAdvertisement.yaml", {
    id = module.local_metallb.id // fake id for this resource to depend on the module metallb
  }))
}

resource "kubernetes_manifest" "metallb_bgppeer" {
  manifest = yamldecode(templatefile("${path.module}/manifests/BGPPeer.yaml", {
    id = module.local_metallb.id // fake id for this resource to depend on the module metallb
  }))
}

# ISTIO
module "local_istio" {
  source                           = "../modules/istio"
  istio_namespace                  = kubernetes_namespace.istio.metadata.0.name
  dns_name                         = "*.staging.local"
  issuer_name                      = "istio-selfsigned-issuer"
  tls_secret_name                  = "staging-local-tls-secret"
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
    tls_secret_name = "staging-local-tls-secret"
    dns_name        = "*.staging.local"
    id              = module.local_istio.istioingress_id // fake id for this resource to depend on the module istio
  }))
}

resource "kubernetes_manifest" "virtual_service_k8sdashboard" {
  manifest = yamldecode(templatefile("${path.module}/manifests/k8s-dashboard-virtualservice.yaml", {
    id = module.local_istio.istioingress_id // fake id for this resource to depend on the module istio
  }))
}

resource "kubernetes_manifest" "service_entry_harbor" {
  manifest = yamldecode(templatefile("${path.module}/manifests/service-entry-harbor.yaml", {
  }))
  depends_on = [kubernetes_namespace.istio]
}

# module "local_arc" {
#   source          = "../modules/arc-runners"
#   name            = "arc-runner-local-staging"
#   github_repo_url = local.gitopslab_repo_url
#   github_arc_pat  = var.github_arc_pat

#   providers = {
#     kubernetes = kubernetes
#     helm       = helm
#     kubectl    = kubectl
#   }
# }

# resource "helm_release" "kiali" {
#   name       = "kiali"
#   repository = "https://kiali.org/helm-charts"
#   chart      = "kiali-server"
#   namespace  = kubernetes_namespace.istio.metadata.0.name
#   version    = "2.5.0"
#   values = [
#     file("${path.module}/values/kiali-values.yaml"),
#   ]
# }
