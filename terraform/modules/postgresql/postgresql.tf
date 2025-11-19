# RANDOM PASSWORD
resource "random_password" "postgresql_password" {
  length  = 16   # Length of the password
  special = true # Include special characters

  # This will create a unique password
  override_special = "!@#$%^&*()-_=+[]{};:,.<>?/~`" # Define allowed special characters
}

# BOOTSTRAP SECRET FOR CLOUDNATIVEPG
# CloudNativePG uses this secret during bootstrap to set the initial password
# After bootstrap, CloudNativePG creates its own app secret: {cluster-name}-app
resource "kubernetes_secret" "postgresql_bootstrap_secret" {
  metadata {
    name      = "${var.resources_prefix}-pg-bootstrap"
    namespace = var.postgresql_namespace
  }

  data = {
    username = base64encode(var.db_user)
    password = base64encode(random_password.postgresql_password.result)
  }

  type = "kubernetes.io/basic-auth"
}

# CLOUDNATIVEPG CLUSTER
resource "kubectl_manifest" "postgresql_cluster" {
  yaml_body = yamlencode({
    apiVersion = "postgresql.cnpg.io/v1"
    kind       = "Cluster"
    metadata = {
      name      = "${var.resources_prefix}-pg"
      namespace = var.postgresql_namespace
    }
    spec = {
      instances = 1 # Single instance for local development

      storage = {
        size         = var.storage_size
        storageClass = "standard" # Default for Minikube
      }

      postgresql = {
        parameters = {
          max_connections = "100"
          shared_buffers  = "256MB"
        }
      }

      bootstrap = {
        initdb = {
          database = var.db_name
          owner    = var.db_user
          secret = {
            name = kubernetes_secret.postgresql_bootstrap_secret.metadata[0].name
          }
        }
      }
    }
  })

  depends_on = [
    kubernetes_secret.postgresql_bootstrap_secret
  ]
}
