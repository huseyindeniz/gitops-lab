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
  gateway_host           = "*.staging.local"
  tls_secret_name        = "staging-local-tls-secret"
  issuer_name            = "selfsigned-issuer"
  issuer_namespace       = kubernetes_namespace.istio.metadata.0.name

  providers = {
    kubernetes = kubernetes
    helm       = helm
  }

  depends_on = [kubernetes_namespace.istio, module.local_cert_manager]
}
