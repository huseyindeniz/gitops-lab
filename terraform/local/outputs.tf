# outputs.tf for Argo CD

# Output the Argo CD admin password
output "argo_cd_local_admin_password" {
  description = "The Argo CD initial admin password"
  value       = data.kubernetes_secret.argo_cd_local_admin_secret.data["password"]
  sensitive   = true
}

output "project_001_weather_forecast_db_info" {
  value = {
    for env_key, env in { for env in var.env_names : env.name => env } :
    env_key => {
      db_name     = "${local.project001weatherforecastns}-${env_key}-db"
      db_user     = "${local.project001weatherforecastns}_${env_key}-user"
      db_password = random_password.project_001_weather_forecast_postgres_password[env_key].result
    }
  }

  sensitive = true
}


