# EF Core - Code First - Migrations

Add migration

```bash
 dotnet ef migrations add init --project mySampleApp1.weatherForecast.Infra --startup-project mySampleApp1.weatherForecast.API
```

Update database (for local)

```bash
 dotnet ef database update --project mySampleApp1.weatherForecast.Infra --startup-project mySampleApp1.weatherForecast.API
```

Generate db update bundle (on prod)

```bash
dotnet ef migrations bundle --self-contained --output ./migrations-bundle --project mySampleApp1.weatherForecast.Infra --startup-project mySampleApp1.weatherForecast.API
```
