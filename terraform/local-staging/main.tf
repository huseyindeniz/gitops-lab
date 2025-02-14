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

module "local_metallb" {
  source    = "../modules/metallb"
  name      = "metallb"
  namespace = kubernetes_namespace.metallb.metadata.0.name

  providers = {
    helm = helm
  }

  depends_on = [kubernetes_namespace.metallb]

}

resource "kubernetes_manifest" "metallb_configmap_pool" {
  manifest   = yamldecode(file("${path.module}/manifests/metallb-pool.yaml"))
  depends_on = [module.local_metallb]
}

resource "kubernetes_manifest" "metallb_configmap_adv" {
  manifest   = yamldecode(file("${path.module}/manifests/metallb-adv.yaml"))
  depends_on = [module.local_metallb]
}

resource "kubernetes_manifest" "management_cluster_service_entry" {
  manifest   = yamldecode(file("${path.module}/manifests/management-cluster-service-entry.yaml"))
  depends_on = [module.local_metallb]
}

module "local_arc" {
  source          = "../modules/arc-runners"
  name            = "arc-runner-local-staging"
  github_repo_url = local.gitopslab_repo_url
  github_arc_pat  = var.github_arc_pat

  providers = {
    kubernetes = kubernetes
    helm       = helm
    kubectl    = kubectl
  }

  depends_on = [module.local_istio]
}
