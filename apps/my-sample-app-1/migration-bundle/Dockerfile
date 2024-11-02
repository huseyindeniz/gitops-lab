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

# Create the entrypoint script dynamically
RUN echo '#!/bin/sh' > /app/entrypoint.sh && \
    echo 'CONNECTION_STRING="Host=$DB__POSTGRES_HOST;Port=$DB__POSTGRES_PORT;Database=$DB__POSTGRES_DB;Username=$DB__POSTGRES_USER;Password=$DB__POSTGRES_PASSWORD"' >> /app/entrypoint.sh && \
    echo 'if [ "$ASPNETCORE_ENVIRONMENT" = "Development" ]; then' >> /app/entrypoint.sh && \
    echo '  echo "Using connection string: $CONNECTION_STRING"' >> /app/entrypoint.sh && \
    echo 'fi' >> /app/entrypoint.sh && \
    echo 'if [ -z "$1" ]; then' >> /app/entrypoint.sh && \
    echo '  echo "Error: No arguments provided. Exiting with error."' >> /app/entrypoint.sh && \
    echo '  exit 1' >> /app/entrypoint.sh && \
    echo 'elif [ "$1" = "apply" ]; then' >> /app/entrypoint.sh && \
    echo '  echo "Applying all migrations..."' >> /app/entrypoint.sh && \
    echo '  ./migrations-bundle --connection "$CONNECTION_STRING"' >> /app/entrypoint.sh && \
    echo 'elif [ "$1" = "reset" ]; then' >> /app/entrypoint.sh && \
    echo '  echo "Resetting database to initial state (no migrations)..."' >> /app/entrypoint.sh && \
    echo '  ./migrations-bundle --connection "$CONNECTION_STRING" --target 0' >> /app/entrypoint.sh && \
    echo 'else' >> /app/entrypoint.sh && \
    echo '  echo "Rolling back to migration: $1"' >> /app/entrypoint.sh && \
    echo '  ./migrations-bundle --connection "$CONNECTION_STRING" --target "$1"' >> /app/entrypoint.sh && \
    echo 'fi' >> /app/entrypoint.sh

# Grant execute permissions for the entrypoint script and migrations bundle
RUN chmod +x /app/entrypoint.sh /app/migrations-bundle

# Set the custom entrypoint script
ENTRYPOINT ["/app/entrypoint.sh"]