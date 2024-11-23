output "postgresql_db_info" {
  value = {
    db_name     = var.db_name
    db_user     = var.db_user
    db_port     = var.db_port
    db_password = random_password.postgresql_password.result
  }
  sensitive = true
}
