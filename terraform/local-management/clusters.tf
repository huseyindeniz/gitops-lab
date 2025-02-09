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
    "ca.pem" = filebase64("./certs/local-staging.crt")
  }
  type = "Opaque"
}

resource "argocd_cluster" "local_staging_cluster" {
  name   = "local-staging-cluster"
  server = "localhost:58002"
  config {
    bearer_token = var.local_staging_cluster_bearer_token
    tls_client_config {
      ca_data = file("certs/local-staging.crt")
    }
  }
}


# CLUSTER: local-production
