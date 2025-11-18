# CORE APPS WHICH WONT BE MANAGED BY ARGO CD

# CENTRALIZED VERSION MANAGEMENT
module "versions" {
  source = "../modules/versions"
}

# CERT MANAGER
# Must wait for namespaces to be created first (it creates its own namespace internally)
module "local_cert_manager" {
  source = "../modules/cert-manager"

  cert_manager_version = module.versions.cert_manager_version

  providers = {
    kubernetes = kubernetes
    helm       = helm
    kubectl    = kubectl
  }

  # Ensure basic namespaces are created first to avoid race conditions
  depends_on = [
    kubernetes_namespace.metallb,
    kubernetes_namespace.istio,
    kubernetes_namespace.monitoring,
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

  depends_on = [kubernetes_namespace.metallb]
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

  depends_on = [kubernetes_namespace.istio]
}

# GITHUB ARC RUNNERS

resource "kubernetes_secret" "istio_ca_cert" {
  metadata {
    name      = "istio-ca-cert"
    namespace = "arc-runners"
  }

  data = {
    "ca.crt" = file("${path.module}/certs/istio-full-chain.crt")
  }

  type = "Opaque"
}

module "local_arc" {
  source          = "../modules/arc-runners"
  name            = "arc-runner-local-staging"
  github_repo_url = local.gitopslab_repo_url
  github_arc_pat  = var.github_arc_pat

  arc_controller_version          = module.versions.arc_controller_version
  arc_scale_set_controller_version = module.versions.arc_scale_set_controller_version
  arc_runner_scale_set_version     = module.versions.arc_runner_scale_set_version

  providers = {
    kubernetes = kubernetes
    helm       = helm
    kubectl    = kubectl
  }
}

# SAMPLE DOTNET APP
module "local_sample_dotnet" {
  source                         = "../modules/sample-dotnet"
  env_list                       = jsondecode(data.kubernetes_config_map.deployment_environments.data["environments"])
  app_ns_prefix_sample_dotnet_wf = "sample-dotnet-wf-staging"

  providers = {
    kubernetes = kubernetes
    helm       = helm
  }
}
