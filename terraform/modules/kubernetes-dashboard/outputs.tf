
output "admin_user_token" {
  value     = data.kubernetes_secret.admin_user_token.data["token"]
  sensitive = true

  depends_on = [data.kubernetes_secret.admin_user_token]
}
