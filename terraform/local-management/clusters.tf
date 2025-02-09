# CLUSTER: local-staging
resource "kubernetes_secret" "staging_cluster_bearer_token" {
  metadata {
    name = "staging-cluster-bearer-token"
  }
  data = {
    token = var.local_staging_cluster_bearer_token
  }
  type = "Opaque"
}

resource "kubernetes_secret" "staging_cluster_ca_cert" {
  metadata {
    name = "staging-cluster-ca-cert"
  }
  data = {
    "ca.pem" = filebase64("./certs/local-staging.pem")
  }
  type = "Opaque"
}

resource "argocd_cluster" "local_staging_cluster" {
  name   = "local-staging-cluster"
  server = var.local_staging_cluster_server_url
  config {
    bearer_token = kubernetes_secret.staging_cluster_bearer_token.data["token"]
    tls_client_config {
      ca_data = base64decode(kubernetes_secret.staging_cluster_ca_cert.data["ca.pem"])
    }
  }
}


# CLUSTER: local-production
