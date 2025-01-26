# RANDOM PASSWORD
resource "random_password" "postgresql_password" {
  length  = 16   # Length of the password
  special = true # Include special characters

  # This will create a unique password
  override_special = "!@#$%^&*()-_=+[]{};:,.<>?/~`" # Define allowed special characters
}

# PASSWORD SECRET
resource "kubernetes_secret" "postgresql_password_secret" {
  metadata {
    name      = "${var.resources_prefix}-postgres-password"
    namespace = var.postgresql_namespace
  }

  data = {
    POSTGRES_PASSWORD = base64encode(random_password.postgresql_password.result) # Reference the generated password
    password          = base64encode(random_password.postgresql_password.result) # Reference the generated password
  }

  type = "Opaque"
}

resource "helm_release" "postgresql" {
  name            = "${var.resources_prefix}-postgresql"
  namespace       = var.postgresql_namespace
  repository      = "https://charts.bitnami.com/bitnami"
  chart           = "postgresql"
  version         = "12.1.10"
  cleanup_on_fail = true
  values = [
    yamlencode({
      primary = {
        persistence = {
          existingClaim = kubernetes_persistent_volume_claim.postgresql_pvc.metadata[0].name
        }
      }
      volumePermissions = {
        enabled = true
      }
      auth = {
        username = var.db_user
        password = base64encode(random_password.postgresql_password.result)
        database = var.db_name
      }
      service = {
        port = var.db_port
      }
    })
  ]
  depends_on = [
    kubernetes_persistent_volume_claim.postgresql_pvc
  ]
}
