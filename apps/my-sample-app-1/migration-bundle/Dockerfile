# Use .NET SDK for building and running EF commands
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build

# Set the working directory in the container
WORKDIR /app

# Copy the project files
COPY . .

# Restore the .NET project dependencies
WORKDIR /app/mySampleApp1.weatherForecast.API
RUN dotnet restore mySampleApp1.weatherForecast.API.csproj

# Install dotnet-ef tool globally
RUN dotnet tool install -g dotnet-ef
# Ensure that the dotnet tools path is added to PATH
ENV PATH="$PATH:/root/.dotnet/tools"

# Set environment variables for PostgreSQL connection
ENV DB__POSTGRES_HOST=""
ENV DB__POSTGRES_PORT="5432"
ENV DB__POSTGRES_DB=""
ENV DB__POSTGRES_USER=""
ENV DB__POSTGRES_PASSWORD=""
ENV MIGRATION_ACTION=""
ENV TARGET_MIGRATION=""

# Entrypoint with embedded migration logic
ENTRYPOINT ["/bin/sh", "-c", "\
    if [ \"$MIGRATION_ACTION\" = \"reset\" ]; then \
    echo 'Resetting database to initial state...'; \
    dotnet ef database update 0 --project /app/mySampleApp1.weatherForecast.Infra --startup-project /app/mySampleApp1.weatherForecast.API; \
    elif [ \"$MIGRATION_ACTION\" = \"apply\" ]; then \
    echo 'Applying all migrations...'; \
    dotnet ef database update --project /app/mySampleApp1.weatherForecast.Infra --startup-project /app/mySampleApp1.weatherForecast.API; \
    elif [ \"$MIGRATION_ACTION\" = \"rollback\" ]; then \
    if [ -n \"$TARGET_MIGRATION\" ]; then \
    echo \"Rolling back to migration: '$TARGET_MIGRATION'\"; \
    dotnet ef database update \"$TARGET_MIGRATION\" --project /app/mySampleApp1.weatherForecast.Infra --startup-project /app/mySampleApp1.weatherForecast.API; \
    else \
    echo 'Error: TARGET_MIGRATION must be specified for rollback.'; \
    exit 1; \
    fi; \
    else \
    echo 'Error: Invalid MIGRATION_ACTION specified. Use reset, apply, or rollback.'; \
    exit 1; \
    fi"]
