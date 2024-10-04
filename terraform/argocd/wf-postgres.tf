resource "random_password" "project_001_weather_forecast_postgres_password" {
  for_each = { for env in var.env_names : env.name => env } # Generate a password for each environment

  length  = 16   # Length of the password
  special = true # Include special characters

  # This will create a unique password for each environment
  override_special = "!@#$%^&*()-_=+[]{};:,.<>?/~`" # Define allowed special characters
}

resource "kubernetes_secret" "project_001_weather_forecast_postgres_password_secret" {
  for_each = { for env in var.env_names : env.name => env } # Create a secret for each environment

  metadata {
    name      = "postgres-password-${each.value.name}"                    # Name of the secret based on environment
    namespace = "${local.project001weatherforecastns}-${each.value.name}" # Use the appropriate namespace
  }

  data = {
    POSTGRES_PASSWORD = "random_string.project_001_weather_forecast_postgres_password[${each.value.name}].password.result" # Reference the generated password
  }

  type = "Opaque"
}

resource "kubernetes_storage_class" "project_001_weather_forecast_storage_class" {
  metadata {
    name = "${local.project001weatherforecastns}-storage" # Use a descriptive name specific to your application
  }

  storage_provisioner = "k8s.io/minikube-hostpath" # Minikube's built-in provisioner

}

# resource "helm_release" "project_001_weather_forecast_postgres" {
#   for_each = { for env in var.env_names : env.name => env }

#   name       = "${local.project001weatherforecastns}-postgres-${each.value.name}"
#   namespace  = "${local.project001weatherforecastns}-${each.value.name}"
#   repository = "https://charts.bitnami.com/bitnami"
#   chart      = "postgresql"
#   version    = "12.1.10"

#   values = [
#     yamlencode({
#       global = {
#         storageClass = "${local.project001weatherforecastns}-storage"
#       }
#       primary = {
#         persistence = {
#           size = var.storage_size
#         }
#         # image = {
#         #   tag = "14" # Specify the desired PostgreSQL version
#         # }
#       }
#       postgresqlUsername = "${local.project001weatherforecastns}-${each.value.name}-user"
#       postgresqlPassword = random_password.project_001_weather_forecast_postgres_password[each.key].result
#       postgresqlDatabase = "${local.project001weatherforecastns}-${each.value.name}-db"
#       service = {
#         port = 5432
#       }
#     })
#   ]

#   depends_on = [
#     kubernetes_namespace.project_001_weather_forecast_env,
#     random_password.project_001_weather_forecast_postgres_password,
#     kubernetes_storage_class.project_001_weather_forecast_storage_class
#   ]
# }

