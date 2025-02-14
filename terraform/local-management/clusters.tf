# CLUSTER: local-staging

resource "kubernetes_secret" "cluster_local_staging_secret" {
  metadata {
    name      = "cluster-local-staging-secret"
    namespace = "argocd"
    labels = {
      "argocd.argoproj.io/secret-type" = "cluster"
    }
  }

  type = "Opaque"

  data = {
    name   = "cluster-local-staging"
    server = "https://172.17.0.5:8443"
    config = jsonencode({
      bearerToken = var.local_staging_cluster_bearer_token
      tlsClientConfig = {
        insecure = false
        caData   = filebase64("./certs/local-staging.pem")
      }
    })
  }
}

# CLUSTER: local-production
resource "kubernetes_secret" "cluster_local_production_secret" {
  metadata {
    name      = "cluster-local-production-secret"
    namespace = "argocd"
    labels = {
      "argocd.argoproj.io/secret-type" = "cluster"
    }
  }

  type = "Opaque"

  data = {
    name   = "cluster-local-production"
    server = "https://172.17.0.8:8443"
    config = jsonencode({
      bearerToken = var.local_production_cluster_bearer_token
      tlsClientConfig = {
        insecure = false
        caData   = filebase64("./certs/local-production.pem")
      }
    })
  }
}
