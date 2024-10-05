# RANDOM PASSWORD
resource "random_password" "project_001_weather_forecast_postgres_password" {
  for_each = { for env in var.env_names : env.name => env } # Generate a password for each environment

  length  = 16   # Length of the password
  special = true # Include special characters

  # This will create a unique password for each environment
  override_special = "!@#$%^&*()-_=+[]{};:,.<>?/~`" # Define allowed special characters
}

# PASSWORD SECRET
resource "kubernetes_secret" "project_001_weather_forecast_postgres_password_secret" {
  for_each = { for env in var.env_names : env.name => env } # Create a secret for each environment

  metadata {
    name      = "postgres-password-${each.value.name}"                    # Name of the secret based on environment
    namespace = "${local.project001weatherforecastns}-${each.value.name}" # Use the appropriate namespace
  }

  data = {
    POSTGRES_PASSWORD = base64encode(random_password.project_001_weather_forecast_postgres_password[each.value.name].result) # Reference the generated password
  }

  type = "Opaque"
}

# PV
resource "kubernetes_persistent_volume" "project_001_weather_forecast_postgres_pv" {
  for_each = { for env in var.env_names : env.name => env } # Iterate over environment names

  metadata {
    name = "${local.project001weatherforecastns}-postgres-pv-${each.value.name}" # Name the PV based on the environment
  }

  spec {
    access_modes = ["ReadWriteMany"]

    capacity = {
      storage = var.storage_size # Size of the persistent volume
    }

    persistent_volume_source {
      host_path {
        path = "/mnt/data/postgres-${each.value.name}" # Path on the host for local development
      }
    }
  }

  depends_on = [kubernetes_namespace.project_001_weather_forecast_env]
}

# PVC
resource "kubernetes_persistent_volume_claim" "project_001_weather_forecast_postgres_pvc" {
  for_each = { for env in var.env_names : env.name => env } # Iterate over environment names

  metadata {
    name      = "${local.project001weatherforecastns}-postgres-pvc-${each.value.name}" # Name the PVC based on the environment
    namespace = "${local.project001weatherforecastns}-${each.value.name}"              # Use the appropriate namespace
  }

  spec {
    access_modes = ["ReadWriteMany"]

    resources {
      requests = {
        storage = var.storage_size # Specify the requested storage size
      }
    }
  }

  depends_on = [
    kubernetes_persistent_volume.project_001_weather_forecast_postgres_pv
  ]
}

resource "helm_release" "project_001_weather_forecast_postgres" {
  for_each = { for env in var.env_names : env.name => env }

  name            = "${local.project001weatherforecastns}-postgres-${each.value.name}"
  namespace       = "${local.project001weatherforecastns}-${each.value.name}"
  repository      = "https://charts.bitnami.com/bitnami"
  chart           = "postgresql"
  version         = "12.1.10"
  cleanup_on_fail = true
  values = [
    yamlencode({
      primary = {
        persistence = {
          existingClaim = "${local.project001weatherforecastns}-postgres-pvc-${each.value.name}"
        }
      }
      volumePermissions = {
        enabled = true
      }
      postgresqlUsername = "${local.project001weatherforecastns}-${each.value.name}-user"
      postgresqlPassword = random_password.project_001_weather_forecast_postgres_password[each.key].result
      postgresqlDatabase = "${local.project001weatherforecastns}-${each.value.name}-db"
      service = {
        port = 5432
      }
    })
  ]
  depends_on = [
    kubernetes_namespace.project_001_weather_forecast_env,
    random_password.project_001_weather_forecast_postgres_password,
    kubernetes_persistent_volume_claim.project_001_weather_forecast_postgres_pvc
  ]
}

