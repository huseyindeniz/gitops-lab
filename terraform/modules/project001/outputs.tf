output "weather_forecast_postgresql_db_info" {
  value     = module.weather_forecast_postgresql
  sensitive = true
}
