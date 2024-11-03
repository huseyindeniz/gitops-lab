# EF Core - Code First - Migrations

Add migration

```bash
 dotnet ef migrations add init --project mySampleApp1.weatherForecast.Infra --startup-project mySampleApp1.weatherForecast.API
```

Remove Last Migration

```bash
dotnet ef migrations remove --project ./mySampleApp1.weatherForecast.Infra --startup-project ./mySampleApp1.weatherForecast.API
```

Update database (for local)

```bash
 dotnet ef database update --project mySampleApp1.weatherForecast.Infra --startup-project mySampleApp1.weatherForecast.API
```

Roll Back a migration on database (without removing migration)

```bash
 dotnet ef database update PreviousMigrationName --project mySampleApp1.weatherForecast.Infra --startup-project mySampleApp1.weatherForecast.API
```

Reset DB

```bash
 dotnet ef database update 0 --project ./mySampleApp1.weatherForecast.Infra --startup-project ./mySampleApp1.weatherForecast.API
```

Generate db update bundle (on prod)

```bash
dotnet ef migrations bundle --self-contained --output ./migrations-bundle --project mySampleApp1.weatherForecast.Infra --startup-project mySampleApp1.weatherForecast.API
```

Testing in local docker

```bash
docker compose -f .\docker-compose.yml -f .\docker-compose.override.yml up --force-recreate --build -d
```
