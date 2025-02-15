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

resource "helm_release" "kiali" {
  name       = "kiali"
  repository = "https://kiali.org/helm-charts"
  chart      = "kiali-server"
  namespace  = kubernetes_namespace.istio.metadata.0.name
  version    = "2.5.0"
  values = [
    file("${path.module}/values/kiali-values.yaml"),
  ]
}
