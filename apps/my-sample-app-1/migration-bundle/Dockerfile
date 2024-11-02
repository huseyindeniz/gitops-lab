# Stage 1: Build the EF Core migration bundle
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build

# Set the working directory in the container
WORKDIR /app

# Copy files
COPY . .

# Restore the .NET project dependencies
WORKDIR /app/mySampleApp1.weatherForecast.API
RUN dotnet restore mySampleApp1.weatherForecast.API.csproj

# Build the EF Core migration bundle
WORKDIR /app

# Install dotnet-ef tool globally
RUN dotnet tool install -g dotnet-ef
# Ensure that the dotnet tools path is added to PATH
ENV PATH="$PATH:/root/.dotnet/tools"

# Generete the bundle
RUN dotnet ef migrations bundle --self-contained --force --output /app/migrations-bundle --project ./mySampleApp1.weatherForecast.Infra --startup-project ./mySampleApp1.weatherForecast.API

# Stage 2: Create a minimal runtime image with the bundle
FROM mcr.microsoft.com/dotnet/runtime-deps:8.0 AS final

# Set the working directory in the final container
WORKDIR /app

# Copy the bundle executable from the build stage
COPY --from=build /app/migrations-bundle .

# Grant execute permissions if necessary (for Linux)
RUN chmod +x ./migrations-bundle

# Set the entrypoint to handle different scenarios based on arguments
ENTRYPOINT ["/bin/sh", "-c", \
    'CONNECTION_STRING="Host=$DB__POSTGRES_HOST;Port=$DB__POSTGRES_PORT;Database=$DB__POSTGRES_DB;Username=$DB__POSTGRES_USER;Password=$DB__POSTGRES_PASSWORD"; \
    if [ "$ASPNETCORE_ENVIRONMENT" = "Development" ]; then \
    echo "Using connection string: $CONNECTION_STRING"; \
    fi; \
    if [ -z "$1" ]; then \
    echo "Error: No arguments provided. Exiting with error."; \
    exit 1; \
    elif [ "$1" = "apply" ]; then \
    echo "Applying all migrations..."; \
    ./migrations-bundle --connection "$CONNECTION_STRING"; \
    elif [ "$1" = "reset" ]; then \
    echo "Resetting database to initial state (no migrations)..."; \
    ./migrations-bundle --connection "$CONNECTION_STRING" --target 0; \
    else \
    echo "Rolling back to migration: $1"; \
    ./migrations-bundle --connection "$CONNECTION_STRING" --target "$1"; \
    fi']