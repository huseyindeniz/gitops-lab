# CLUSTER: local-staging
# resource "kubernetes_secret" "staging_cluster_bearer_token" {
#   metadata {
#     name      = "staging-cluster-bearer-token"
#     namespace = var.argo_namespace
#   }
#   data = {
#     token = var.local_staging_cluster_bearer_token
#   }
#   type = "Opaque"
# }

# resource "kubernetes_secret" "staging_cluster_ca_cert" {
#   metadata {
#     name      = "staging-cluster-ca-cert"
#     namespace = var.argo_namespace
#   }
#   data = {
#     "ca" = filebase64("./certs/local-staging.pem")
#   }
#   type = "Opaque"
# }

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
    config = <<-EOT
      bearerToken: ${var.local_staging_cluster_bearer_token}
      tlsClientConfig:
        insecure: false
        caData: ${filebase64("./certs/local-staging.pem")}
    EOT
  }
}




# resource "argocd_cluster" "local_staging_cluster" {
#   name   = "local-staging-cluster"
#   server = var.local_staging_cluster_server_url
#   config {
#     bearer_token = kubernetes_secret.staging_cluster_bearer_token.data["token"]
#     tls_client_config {
#       ca_data = base64decode(kubernetes_secret.staging_cluster_ca_cert.data["ca.pem"])
#     }
#   }
# }


# CLUSTER: local-production
# resource "kubernetes_secret" "production_cluster_bearer_token" {
#   metadata {
#     name      = "production-cluster-bearer-token"
#     namespace = var.argo_namespace
#   }
#   data = {
#     token = var.local_production_cluster_bearer_token
#   }
#   type = "Opaque"
# }

# resource "kubernetes_secret" "production_cluster_ca_cert" {
#   metadata {
#     name      = "production-cluster-ca-cert"
#     namespace = var.argo_namespace
#   }
#   data = {
#     "ca" = filebase64("./certs/local-production.pem")
#   }
#   type = "Opaque"
# }

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
    config = <<-EOT
      bearerToken: ${var.local_production_cluster_bearer_token}
      tlsClientConfig:
        insecure: false
        caData: ${filebase64("./certs/local-production.pem")}
    EOT
  }
}

# resource "argocd_cluster" "local_production_cluster" {
#   name   = "local-production-cluster"
#   server = var.local_production_cluster_server_url
#   config {
#     bearer_token = kubernetes_secret.production_cluster_bearer_token.data["token"]
#     tls_client_config {
#       ca_data = base64decode(kubernetes_secret.production_cluster_ca_cert.data["ca.pem"])
#     }
#   }
# }
