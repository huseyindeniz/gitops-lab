module "harbor_postgresql" {
  source = "../modules/postgresql"

  # Pass environment-specific variables to the postgres module
  resources_prefix     = kubernetes_namespace.harbor.metadata[0].name
  postgresql_namespace = kubernetes_namespace.harbor.metadata[0].name
  db_user              = "user_harbor"
  db_name              = "registry"
  db_port              = 5432
  storage_size         = "1Gi"
  pv_path              = "/mnt/data/harbor-staging"

  depends_on = [kubernetes_namespace.harbor]
}

resource "kubernetes_manifest" "harbor_certificate" {
  manifest = {
    "apiVersion" = "cert-manager.io/v1"
    "kind"       = "Certificate"
    "metadata" = {
      "name"      = "harbor-internal-tls"
      "namespace" = kubernetes_namespace.harbor.metadata[0].name
    }
    "spec" = {
      "secretName" = "harbor-internal-tls" # This secret will store the TLS cert and key
      "dnsNames" = [
        "localhost",
        "harbor-staging-core",
        "harbor-staging-jobservice",
        "harbor-staging-registry",
        "harbor-staging-portal",
        "harbor-staging-trivy",
        "harbor-staging-core.harbor-staging.svc.cluster.local"
      ]
      "issuerRef" = {
        "name" = "selfsigned-cluster-issuer" # Replace with the name of your ClusterIssuer
        "kind" = "ClusterIssuer"             # Use "Issuer" if it's namespace-scoped
      }
    }
  }
}

resource "kubernetes_secret" "harbor_tls" {
  metadata {
    name      = "harbor-internal-tls"
    namespace = kubernetes_namespace.harbor.metadata[0].name
  }
}
