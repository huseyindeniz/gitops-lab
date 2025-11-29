# RANDOM PASSWORD
resource "random_password" "postgresql_password" {
  length  = 16   # Length of the password
  special = true # Include special characters

  # This will create a unique password
  override_special = "!@#$%^&*()-_=+[]{};:,.<>?/~`" # Define allowed special characters
}

# BOOTSTRAP SECRET FOR CLOUDNATIVEPG
# Used during initdb to set the initial password for the database owner
resource "kubernetes_secret" "postgresql_bootstrap_secret" {
  metadata {
    name      = "${var.resources_prefix}-pg-bootstrap"
    namespace = var.postgresql_namespace
  }

  data = {
    username = var.db_user
    password = base64encode(random_password.postgresql_password.result)
  }

  type = "kubernetes.io/basic-auth"
}

# APPLICATION SECRET FOR MANAGED ROLES
# This secret is referenced by managed.roles and used by applications to connect
resource "kubernetes_secret" "postgresql_app_secret" {
  metadata {
    name      = "${var.resources_prefix}-pg-app"
    namespace = var.postgresql_namespace
    labels = {
      "cnpg.io/reload" = "true"
    }
  }

  data = {
    username = var.db_user
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

      managed = {
        roles = [
          {
            name            = var.db_user
            ensure          = "present"
            login           = true
            superuser       = false
            createdb        = false
            createrole      = false
            inherit         = true
            connectionLimit = -1
            passwordSecret = {
              name = kubernetes_secret.postgresql_app_secret.metadata[0].name
            }
          }
        ]
      }
    }
  })

  depends_on = [
    kubernetes_secret.postgresql_bootstrap_secret,
    kubernetes_secret.postgresql_app_secret
  ]
}
