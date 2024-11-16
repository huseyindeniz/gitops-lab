# RANDOM PASSWORD
resource "random_password" "project_001_weather_forecast_postgres_password" {
  for_each = toset(var.env_names) # Generate a password for each environment

  length  = 16   # Length of the password
  special = true # Include special characters

  # This will create a unique password for each environment
  override_special = "!@#$%^&*()-_=+[]{};:,.<>?/~`" # Define allowed special characters
}

# PASSWORD SECRET
resource "kubernetes_secret" "project_001_weather_forecast_postgres_password_secret" {
  for_each = toset(var.env_names) # Create a secret for each environment

  metadata {
    name      = "postgres-password-${each.value}"                    # Name of the secret based on environment
    namespace = "${local.project001weatherforecastns}-${each.value}" # Use the appropriate namespace
  }

  data = {
    POSTGRES_PASSWORD = base64encode(random_password.project_001_weather_forecast_postgres_password[each.value].result) # Reference the generated password
  }

  type = "Opaque"
}

# PV
resource "kubernetes_persistent_volume" "project_001_weather_forecast_postgres_pv" {
  for_each = toset(var.env_names) # Iterate over environment names

  metadata {
    name = "${local.project001weatherforecastns}-postgres-pv-${each.value}" # Name the PV based on the environment
  }

  spec {
    access_modes = ["ReadWriteOnce"]

    capacity = {
      storage = var.storage_size # Size of the persistent volume
    }

    persistent_volume_source {
      host_path {
        path = "/mnt/data/postgres-${each.value}" # Path on the host for local development
      }
    }

    persistent_volume_reclaim_policy = "Delete"

  }

  depends_on = [kubernetes_namespace.project_001_weather_forecast_env]
}

# PVC
resource "kubernetes_persistent_volume_claim" "project_001_weather_forecast_postgres_pvc" {
  for_each = toset(var.env_names) # Iterate over environment names

  metadata {
    name      = "${local.project001weatherforecastns}-postgres-pvc-${each.value}" # Name the PVC based on the environment
    namespace = "${local.project001weatherforecastns}-${each.value}"              # Use the appropriate namespace
  }

  spec {
    access_modes = ["ReadWriteOnce"]

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
  for_each = toset(var.env_names)

  name            = "${local.project001weatherforecastns}-postgres-${each.value}"
  namespace       = "${local.project001weatherforecastns}-${each.value}"
  repository      = "https://charts.bitnami.com/bitnami"
  chart           = "postgresql"
  version         = "12.1.10"
  cleanup_on_fail = true
  values = [
    yamlencode({
      primary = {
        persistence = {
          existingClaim = "${local.project001weatherforecastns}-postgres-pvc-${each.value}"
        }
      }
      volumePermissions = {
        enabled = true
      }
      auth = {
        username = "${local.project001weatherforecastns}-${each.value}-user"
        password = base64encode(random_password.project_001_weather_forecast_postgres_password[each.value].result)
        database = "${local.project001weatherforecastns}-${each.value}-db"
      }
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

