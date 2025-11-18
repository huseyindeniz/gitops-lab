# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a GitOps playground repository demonstrating Kubernetes, Terraform, Argo CD, Helm, GitHub Actions, and various cloud-native technologies. The repository contains multiple sample applications deployed across local Minikube clusters (management, staging, production) with comprehensive CI/CD pipelines.

## Repository Structure

- `apps/` - Sample applications (my-sample-app-1, sample-game, sample-ai, sample-llm-mcp)
- `terraform/` - Infrastructure as Code for local clusters (local-management, local-staging, local-production) and cloud providers (AWS, Azure, GKE)
- `helm-charts/` - Reusable Helm charts for various application types
- `flux/` - Argo CD application manifests
- `raw-manifests/` - Kubernetes resource definitions
- `scripts/` - Utility scripts for cluster operations
- `host/` - Applications running on the host machine

## Key Applications

### my-sample-app-1 (.NET 9 Application)

Located in `apps/my-sample-app-1/dotnet-services/`

**Architecture Pattern**: Clean Architecture with DDD principles
- `Domain/` - Domain entities and interfaces (no dependencies)
- `Infra/` - Infrastructure layer (EF Core, PostgreSQL)
- `API/` - Web API layer (controllers, models, mapping profiles)

**Technology Stack**:
- .NET 9.0
- Entity Framework Core 9.0 with PostgreSQL (Npgsql)
- AutoMapper for object mapping
- FluentValidation for model validation
- Swagger/OpenAPI

**Testing Projects**:
- `mySampleApp1.wf.tests.unit/` - Unit tests
- `mySampleApp1.wf.tests.integration/` - Integration tests
- `mySampleApp1.wf.tests.fitness/` - Fitness tests
- `mySampleApp1.behaviourTests/` - BDD tests using Cucumber.js + Playwright

### sample-llm-mcp (.NET 9 + Model Context Protocol)

Located in `apps/sample-llm-mcp/backend/OllamaMCP/`

**Key Component**: `ToolRouterService.cs` (OllamaMCPApi/MCPClient/)
- Integrates with Model Context Protocol servers via multiple transports (stdio, SSE, HTTP)
- Routes tool calls to appropriate MCP clients
- Uses Microsoft.Extensions.AI and ModelContextProtocol.Client

**Projects**:
- `OllamaMCPApi/` - Main API project
- `MCPSseServerExample/` - SSE server example
- `MCPStreamableHttpExample/` - HTTP streaming example

### sample-game (Multiplayer Game)

- `client/` - Phaser 3 game client (Node.js/TypeScript)
- `server/` - Colyseus multiplayer server (Node.js)

### sample-ai (AI/ML Application)

- `frontend/` - React frontend
- `backend/` - Python backend
- `inference-api/` - PyTorch GPU-accelerated inference

## Common Development Commands

### .NET Applications (my-sample-app-1)

```bash
# Navigate to the dotnet services directory
cd apps/my-sample-app-1/dotnet-services/

# Restore dependencies
dotnet restore

# Build
dotnet build --configuration Release

# Run unit tests
cd mySampleApp1.wf.tests.unit
dotnet test

# Run integration tests
cd mySampleApp1.wf.tests.integration
dotnet test

# Add new EF Core migration
dotnet ef migrations add <MigrationName> \
  --project ./mySampleApp1.weatherForecast.Infra \
  --startup-project ./mySampleApp1.weatherForecast.API

# Update database
dotnet ef database update \
  --project ./mySampleApp1.weatherForecast.Infra \
  --startup-project ./mySampleApp1.weatherForecast.API

# Run API locally with Docker Compose
docker-compose up
```

### BDD/Behaviour Tests

```bash
cd apps/my-sample-app-1/mySampleApp1.behaviourTests/

# Install dependencies
npm ci

# Run tests against different environments
npm run test              # Local
npm run test:docker       # Docker
npm run test:stag-1       # Staging environment 1
npm run test:stag-2       # Staging environment 2
npm run test:prod-canary  # Production canary
npm run test:prod-bluegreen # Production blue-green
```

### Terraform Operations

```bash
# Local Management Cluster
cd terraform/local-management/
terraform init
terraform plan
terraform apply

# Local Staging Cluster
cd terraform/local-staging/
terraform init
terraform plan
terraform apply

# Local Production Cluster
cd terraform/local-production/
terraform init
terraform plan
terraform apply
```

## CI/CD Pipeline Architecture

### GitHub Actions Workflows

Located in `.github/workflows/`

**Test Workflows** (run on GitHub-hosted runners):
- `mySampleApp1-UnitTests.yml` - .NET unit tests
- `mySampleApp1-IntegrationTests.yml` - .NET integration tests
- `mySampleApp1-FitnessTests.yml` - .NET fitness tests

**BA Tests** (run on self-hosted ARC runners in local-staging cluster):
- `mySampleApp1-BATests.yml` - Cucumber/Playwright tests against deployed environments
- Uses `arc-runner-local-staging` runner
- Triggered via repository_dispatch or manual workflow_dispatch
- Updates PR status on completion

**Publish Workflows**:
- `mySampleApp1-publish.yml` - Build and push .NET Docker images
- `sample-game-client-publish.yml` / `sample-game-server-publish.yml` - Game deployments
- `sample-ai-*-publish.yml` - AI app components

### Database Migration Pipeline

**Critical Implementation Detail**: Database migrations run via Argo CD hooks BEFORE application deployment.

- Migrations are triggered on every Argo CD sync
- Migration jobs use EF Core migration bundles
- Process is idempotent but requires full solution rebuild each time
- Ensures database schema always matches application code

## Infrastructure Components

### Kubernetes Operators

This repository uses Kubernetes Operators for managing stateful workloads. Operators are installed via Terraform and manage resources declaratively.

**Installed Operators** (via `terraform/modules/`):
- `cloudnative-pg-operator/` - CloudNativePG for PostgreSQL (Apache 2.0 license)
- `redis-operator/` - OT-CONTAINER-KIT for Redis (Apache 2.0 license)
- `minio-operator/` - MinIO Operator for object storage (AGPLv3 license)

**How Operators Work**:
1. Operator pods run continuously in dedicated namespaces (`cnpg-system`, `ot-operators`, `minio-operator`)
2. Each operator watches for Custom Resource Definitions (CRDs) across all namespaces
3. When a CRD is created (e.g., `Cluster` for PostgreSQL), the operator automatically creates and manages pods, services, and storage
4. Operators handle lifecycle management, failover, backups, and upgrades

### Terraform Modules

Located in `terraform/modules/`

**Operators**:
- `cloudnative-pg-operator/` - PostgreSQL operator installation
- `redis-operator/` - Redis operator installation
- `minio-operator/` - MinIO operator installation

**Infrastructure**:
- `arc-runners/` - GitHub Actions self-hosted runners
- `argo/` - Argo CD installation
- `argo-rollouts/` - Argo Rollouts for advanced deployments
- `cert-manager/` - TLS certificate management
- `flux/` - Flux CD for automated image updates
- `istio/` - Service mesh
- `metalLB/` - Load balancer for bare metal

**Stateful Services** (managed by operators):
- `postgresql/` - CloudNativePG Cluster CRD definitions with backward-compatible services
- `redis/` - Redis Standalone CRD definitions with backward-compatible services

### Helm Charts

Located in `helm-charts/`

- `dotnet-core-webapi/` - Generic .NET Web API chart
- `nodejs-app/` - Generic Node.js application
- `python-app/` - Generic Python/Flask application
- `static-website/` - Static site with nginx
- `sample-game/` - Colyseus game server
- `sample-ai/` - AI/ML application
- `gputest/` - GPU testing utilities

## Deployment Strategies

### Staging Environments
- `stag-1` and `stag-2` available in local-staging cluster
- Use Argo Workflows for orchestration

### Production Environments
- `prod-bluegreen` - Blue/Green deployment strategy
- `prod-canary` - Canary deployment with gradual rollout
- Both use Argo Rollouts in local-production cluster

## Testing Strategy

**Test Pyramid**:
1. Unit tests (.NET xUnit) - Fast, isolated
2. Integration tests (.NET with TestContainers) - Database integration
3. Fitness tests (.NET) - API contract testing
4. Behaviour tests (Cucumber/Playwright) - End-to-end user scenarios

**Important**: BA tests run on ARC runners inside the cluster to access internal services.

## Architecture Patterns

### .NET Clean Architecture
- **Domain Layer**: Pure business logic, no external dependencies
- **Infrastructure Layer**: Database access via EF Core, implements domain interfaces
- **API Layer**: ASP.NET Core controllers, DTOs/ViewModels, AutoMapper profiles, FluentValidation

### Dependency Flow
API → Infra → Domain (dependencies point inward)

### Database Context
- Uses EF Core Code First migrations
- PostgreSQL with Npgsql provider
- Domain entities in Domain project
- DbContext in Infra project

## Important Notes

- **Node Version**: Projects use Volta for Node.js version management (20.18.1)
- **.NET Version**: All .NET projects target .NET 9.0
- **Kubernetes**: Local clusters run on WSL2 Ubuntu with Minikube
- **GitOps**: Argo CD manages deployments, Flux handles image updates
- **Monitoring**: Prometheus + Grafana for metrics, Loki for logs, Tempo for traces (staging/production)
- **GPU Support**: NVidia Triton for AI/ML inference in staging cluster
- **Container Registry**: Harbor deployed in staging for large images
- **Object Storage**: MinIO deployed in staging

## Working with Modified Files

The git status shows `apps/sample-llm-mcp/backend/OllamaMCP/OllamaMCPApi/MCPClient/ToolRouterService.cs` is modified. This file handles MCP client initialization and tool routing for the LLM application.
