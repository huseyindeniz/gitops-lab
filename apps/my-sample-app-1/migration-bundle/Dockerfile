# Stage 1: Build the EF Core migration bundle
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build

# Set the working directory in the container
WORKDIR /src

# Copy the project files and restore dependencies
COPY ["mySampleApp1.weatherForecast.API/mySampleApp1.weatherForecast.API.csproj", "mySampleApp1.weatherForecast.API/"]
RUN dotnet restore "./mySampleApp1.weatherForecast.API/mySampleApp1.weatherForecast.API.csproj"

# Build the EF Core migration bundle
# Set the working directory for building the app
WORKDIR "/src/mySampleApp1.weatherForecast.API"

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
COPY --from=build /src/migrations-bundle .

# Grant execute permissions if necessary (for Linux)
RUN chmod +x ./migrations-bundle

#Create a shell script to log the connection string and run the bundle
RUN echo '#!/bin/sh' > /app/run-migrations.sh && \
    echo 'CONNECTION_STRING="Host=$DB__POSTGRES_HOST;Port=$DB__POSTGRES_PORT;Database=$DB__POSTGRES_DB;Username=$DB__POSTGRES_USER;Password=$DB__POSTGRES_PASSWORD"' >> /app/run-migrations.sh && \
    echo 'echo "Using connection string: $CONNECTION_STRING"' >> /app/run-migrations.sh && \
    echo './migrations-bundle --connection "$CONNECTION_STRING" --verbose' >> /app/run-migrations.sh && \
    chmod +x /app/run-migrations.sh

# Set the entrypoint to the shell script
ENTRYPOINT [ "/app/run-migrations.sh" ]