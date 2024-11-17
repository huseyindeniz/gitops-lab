# gitops-lab

GitOps Playground (K8S, Terraform, Argo CD, Helm, Github Workflows etc.)

## Goals

- **Automate and Manage Infrastructure**:  
  Leverage GitOps principles with Argo CD, Terraform, Helm, and Flux for:

  - Consistent and version-controlled infrastructure management
  - Automated image updates

- **Build a Stable CI/CD Pipeline**:  
  Create a robust pipeline with:

  - Multi-staging environments and production rollouts (blue-green and canary) using Argo Rollouts and Helm
  - Automated database migrations and easy rollback mechanisms
  - Support for GPU-based workloads and AI/ML pipelines
  - Multi-cloud deployments (AKS, EKS, GKE, DOKS) with Terraform and Kubernetes manifests

- **Enhanced Observability**:  
  Monitor deployments and performance with Prometheus and Grafana.

- **Load Testing**:  
  Validate system resilience and scalability under heavy traffic.

## TODO

### Install and Configure Tools

- ✅ Minikube (Windows cluster and WSL cluster with GPU support)
- ✅ Terraform
- ✅ Helm
- ✅ Local Argo CD (hosted on the WSL cluster)
- ❌ Argo CD Image Updater ([awaiting namespace support](https://github.com/argoproj-labs/argocd-image-updater/issues/601))
- ✅ Flux for automated image updates
- ✅ Argo Rollouts
- 🔲 Argo Workflows

### Automate and Manage Infrastructure

- ✅ Create/Configure **app of apps/root app** in Argo CD
- ✅ Create/Configure application set manifest for a sample app
- ✅ Create/Configure a generic .NET app Helm chart and use it for a service in the sample app
- ✅ Configure GitHub Actions for CI/CD
- ✅ Configure multi-staging environments usable by all apps

### Build a Comprehensive CI/CD Pipeline

- ✅ Use GitHub Workflows for CI tasks (e.g., build, test, and Docker image pushes)
- ✅ Manage application deployments via Argo CD and Helm
- ✅ Automate database migrations with Argo hooks
- 🔲 Automate PR-based deployment pipelines
- 🔲 Define and implement rollback mechanisms
- 🔲 Address and test conflicting database migration scenarios
- 🔲 Configure Argo Workflows for orchestrating CI/CD processes

### Multi-Cloud Deployments

- **Install and Configure CLI Tools**:

  - ✅ aws CLI
  - ✅ az CLI
  - ✅ gcloud CLI
  - 🔲 doctl CLI

- **Integrate CLI Tools with `kubectl`**:

  - ✅ Configure aws CLI in `kubectl` profiles
  - ✅ Configure az CLI in `kubectl` profiles
  - ✅ Configure gcloud CLI in `kubectl` profiles
  - 🔲 Configure doctl CLI in `kubectl` profiles

- **Cluster Setup**:

  - ✅ Create Minikube Windows cluster(Local)
  - ✅ Create Minikube WSL cluster (GPU support enabled)(Local)
  - ✅ Create EKS cluster (VPC and cluster creation via Terraform)
  - ✅ Create AKS cluster (VPC and cluster creation via Terraform)
  - ✅ Create GKE cluster (VPC and cluster creation via Terraform)
  - 🔲 Create DOKS cluster (VPC and cluster creation via Terraform)

- **Integrate Clusters with ArgoCD**:
  - 🔲 Add Windows Minikube cluster to Local ArgoCD
  - 🔲 Install ArgoCD on DOKS (Remote ArgoCD)
  - 🔲 Add AKS cluster to Remote ArgoCD
  - 🔲 Add EKS cluster to Remote ArgoCD
  - 🔲 Add GKE cluster to Remote ArgoCD

### Enhanced Observability

- ✅ Monitoring with Prometheus and Grafana

### Advanced Deployment Strategies

- ✅ Canary production deployment setup
- ✅ Blue/Green production deployment setup

### Load Testing

- ✅ Perform load testing for performance validation

### AI/ML Support

- ✅ GPU support for AI/ML training and inference pipelines
- 🔲 Include a sample AI/ML application that demonstrates both training and inference pipelines using GPU support.

### Blockchain

- 🔲 Deploy a stateful Avalanche Node on the cloud using Kubernetes StatefulSets.
- 🔲 Deploy a stable Avalanche CLI environment on the cloud, accessible via SSH for managing Avalanche Subnets and network operations.

### Gaming

- 🔲 Install Colyseus Server on the Kubernetes cluster to manage and deploy multiplayer game servers.
- 🔲 Deploy a Phaser 3 game that uses the Colyseus client to interact with the Colyseus server for proper testing and demonstration of multiplayer functionality.

## Note on Database Migrations in Kubernetes

Handling database migrations in Kubernetes was initially challenging due to the lack of built-in mechanisms to enforce dependency order between deployments. To address this, I now use **Argo CD hooks** to run migrations before application pods are updated, ensuring the database schema is always in sync with the application.

While the solution works effectively, some limitations remain. For example, migrations are triggered with every resource update in the application, which can be time-consuming due to the need to rebuild the solution for each run. Despite this, the process is idempotent, ensuring database integrity without causing conflicts.

A potential improvement would be for EF Core migration bundles to support targeting specific migrations without requiring a full build. This would streamline the process and reduce delays, making it a valuable feature for future updates.

## Demonstrations and Scenarios

### ArgoCD Overview

![ArgoCD Overview](./docs/images/screenshots/argo-001.png)

### ArgoCD App View

![ArgoCD App View](./docs/images/screenshots/argo-002.png)

### Database Migration Demo

![Migration Demo](./docs/images/screenshots/migration-example.gif)

### Long Running DB Migration Job

![Long Running DB Migration Job 1](./docs/images/screenshots/long-mig-001.png)

![Long Running DB Migration Job 2](./docs/images/screenshots/long-mig-002.png)

### Blue-Green Deployment

![Blue-Green Deployment 1](./docs/images/screenshots/blue-green-001.png)

![Blue-Green Deployment 2](./docs/images/screenshots/blue-green-002.png)

### Canary Deployment

![Canary Deployment 1](./docs/images/screenshots/canary-001.png)

![Canary Deployment 2](./docs/images/screenshots/canary-002.png)

![Canary Deployment 3](./docs/images/screenshots/canary-003.png)

### GPU Support

![GPU Support](./docs/images/screenshots/gpu-001.png)

### Monitoring with Prometheus and Grafana

![Sample Prometheus+Grafana Dashboard](./docs/images/screenshots/grafana-dashboard-001.png)

## Developer Workflow

Follow these steps to update your application and database with minimal effort.

### Adding new migration

```bash
dotnet ef migrations add <MigrationName> --project ./mySampleApp1.weatherForecast.Infra --startup-project ./mySampleApp1.weatherForecast.API
```

### Automated DB Migration Pipeline Flow

![Automated DB Migration Pipeline](./docs/diagrams/docs/db-migration-flow.svg)

## More Info

- [Intro](https://github.com/huseyindeniz/gitops-lab/wiki)
- [Kubernetes notes](https://github.com/huseyindeniz/gitops-lab/wiki/Kubernetes)
- [Minikube notes](https://github.com/huseyindeniz/gitops-lab/wiki/Minikube)
- [Terraform notes](https://github.com/huseyindeniz/gitops-lab/wiki/Terraform)
- [Helm notes](https://github.com/huseyindeniz/gitops-lab/wiki/Helm)
- [Argo CD notes](https://github.com/huseyindeniz/gitops-lab/wiki/Argo-CD)
- [Argo Rollouts notes](https://github.com/huseyindeniz/gitops-lab/wiki/Argo-Rollouts)
- [Argo Workflows notes](https://github.com/huseyindeniz/gitops-lab/wiki/Argo-Workflows)
- [Flux notes](https://github.com/huseyindeniz/gitops-lab/wiki/Flux)
- [Local env setup notes](https://github.com/huseyindeniz/gitops-lab/wiki/Local-Env)
- [AKS setup notes](https://github.com/huseyindeniz/gitops-lab/wiki/AKS)
- [EKS setup notes](https://github.com/huseyindeniz/gitops-lab/wiki/EKS)
- [GKE setup notes](https://github.com/huseyindeniz/gitops-lab/wiki/GKE)
- [DOKS setup notes](https://github.com/huseyindeniz/gitops-lab/wiki/DOKS)
- [Monitoring notes](https://github.com/huseyindeniz/gitops-lab/wiki/Monitoring)
- [Infra testing notes](https://github.com/huseyindeniz/gitops-lab/wiki/Infra-Testing)
- [DAPR notes](https://github.com/huseyindeniz/gitops-lab/wiki/DAPR)
- [DDD + EF Core Code First notes](https://github.com/huseyindeniz/gitops-lab/wiki/DDD-with-ef-core)
- [BDD notes](https://github.com/huseyindeniz/gitops-lab/wiki/BDD)
- [AI/ML Workloads notes](https://github.com/huseyindeniz/gitops-lab/wiki/AI-ML-Workloads)
- [Blockchain notes](https://github.com/huseyindeniz/gitops-lab/wiki/Blockchain)
- [Colyseus notes](https://github.com/huseyindeniz/gitops-lab/wiki/Colyseus)
