output "project_001_wf_db_info" {
  value = module.project001.weather_forecast_postgresql_db_info

  sensitive  = true
  depends_on = [module.project001]
}


