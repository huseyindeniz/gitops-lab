# See https://aka.ms/customizecontainer to learn how to customize your debug container and how Visual Studio uses this Dockerfile to build your images for faster debugging.

# Use the official ASP.NET Core runtime as the base image
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base

# Create a group and a non-root user and set necessary permissions
RUN groupadd -g 10001 appgroup
RUN useradd -u 10001 -g appgroup -m appuser

# Set the working directory and give the appropriate permissions
WORKDIR /app
RUN chown -R appuser:appgroup /app

# Switch to the non-root user
USER appuser

# Expose ports
EXPOSE 8080
EXPOSE 8081

# Use the official .NET SDK image to build the app
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src

# Copy the project files and restore dependencies
COPY ["mySampleApp1.weatherForecast.API/mySampleApp1.weatherForecast.API.csproj", "mySampleApp1.weatherForecast.API/"]
RUN dotnet restore "./mySampleApp1.weatherForecast.API/mySampleApp1.weatherForecast.API.csproj"
COPY . .

# Set the working directory for building the app
WORKDIR "/src/mySampleApp1.weatherForecast.API"

# Build the application
RUN dotnet build "./mySampleApp1.weatherForecast.API.csproj" -c $BUILD_CONFIGURATION -o /app/build

# Publish the application
FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "./mySampleApp1.weatherForecast.API.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

# Use the base image for the final stage
FROM base AS final

# Set the working directory and copy published files
WORKDIR /app
COPY --from=publish /app/publish .

# Set the entry point
ENTRYPOINT ["dotnet", "mySampleApp1.weatherForecast.API.dll"]