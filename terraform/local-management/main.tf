# CORE APPS WHICH WONT BE MANAGED BY ARGO CD

# CENTRALIZED VERSION MANAGEMENT
module "versions" {
  source = "../modules/versions"
}

# CERT MANAGER
module "local_cert_manager" {
  source = "../modules/cert-manager"

  cert_manager_version = module.versions.cert_manager_version

  providers = {
    kubernetes = kubernetes
    helm       = helm
    kubectl    = kubectl
  }

  depends_on = [
    kubernetes_namespace.dashboard,
    kubernetes_namespace.metallb,
    kubernetes_namespace.istio,
    kubernetes_namespace.argocd,
    kubernetes_namespace.networking_test
  ]
}

# METALLB
module "local_metallb" {
  source    = "../modules/metallb"
  name      = var.metallb_name
  namespace = kubernetes_namespace.metallb.metadata.0.name

  metallb_version = module.versions.metallb_version

  providers = {
    helm = helm
  }

  depends_on = [module.local_cert_manager]
}

# ISTIO
module "local_istio" {
  source                 = "../modules/istio"
  istio_namespace        = kubernetes_namespace.istio.metadata.0.name
  istio_base_values_file = "${path.module}/values/istio-base.yaml"
  istiod_values_file     = "${path.module}/values/istio-istiod.yaml"

  istio_version = module.versions.istio_version

  providers = {
    kubernetes = kubernetes
    helm       = helm
  }

  depends_on = [module.local_metallb]
}

# ARGO CD

resource "kubernetes_secret" "argo_cd_dex_secret" {
  metadata {
    name      = "argocd-dex-server-secret"
    namespace = var.argo_namespace
    labels = {
      "app.kubernetes.io/part-of" = "argocd"
    }
  }

  data = {
    "clientSecret" = var.github_oauth_client_secret
  }

  type = "Opaque"

  depends_on = [kubernetes_namespace.argocd]
}

module "local_argo" {
  source         = "../modules/argo"
  argo_namespace = kubernetes_namespace.argocd.metadata.0.name

  argocd_version = module.versions.argocd_version

  argo_cd_values_file = templatefile("${path.module}/values/argocd.yaml", {
    github_oauth_client_id = var.github_oauth_client_id
  })

  providers = {
    kubernetes = kubernetes
    helm       = helm
  }

  depends_on = [
    module.local_istio,
    kubernetes_secret.argo_cd_dex_secret
  ]
}

resource "kubectl_manifest" "argo_management_root" {
  yaml_body = templatefile("${path.module}/manifests/argo-root.yaml", {
    argo_namespace     = kubernetes_namespace.argocd.metadata.0.name
    gitopslab_repo_url = local.gitopslab_repo_url
    id                 = module.local_argo.id
    root_path          = "${var.flux_path}/apps/local-management"
  })

  depends_on = [module.local_argo]
}

# FLUX
resource "flux_bootstrap_git" "flux_bootstrap" {
  embedded_manifests = true
  path               = var.flux_path
  components_extra   = ["image-reflector-controller", "image-automation-controller"]

  depends_on = [kubectl_manifest.argo_management_root]
}
