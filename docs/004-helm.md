# Helm notes

## What is Helm?

Helm is a package manager for Kubernetes that simplifies the deployment and management of **applications** within a Kubernetes cluster. It allows you to define, install, and upgrade Kubernetes applications using Helm charts, which are packages of pre-configured Kubernetes resources.

## Key Concepts

1. Helm Charts:
   - **Definition**: A Helm chart is a collection of YAML files that define a Kubernetes application. It includes all the necessary Kubernetes resources (e.g., Deployments, Services, ConfigMaps) and configuration options required to deploy and manage an application.
   - **Structure**: A typical Helm chart contains the following directories and files:
     - `Chart.yaml`: Metadata about the chart (name, version, etc.).
     - `values.yaml`: Default configuration values for the chart.
     - `templates/`: Directory containing Kubernetes resource templates.
     - `charts/`: Directory for chart dependencies.
2. Helm Repositories:
   - **Definition**: A Helm repository is a collection of Helm charts stored in a remote or local repository. It allows users to share and distribute Helm charts.
   - **Usage**: You can add, list, and remove Helm repositories to manage where Helm looks for charts.
3. Helm Releases:
   - **Definition**: A release is a specific instance of a Helm chart running in a Kubernetes cluster. Each release has a unique name and is managed by Helm.
   - **Management**: You can upgrade, rollback, and delete releases using Helm commands.

## Basic Commands

Add a Helm Repository

```bash
helm repo add {repo-name} {repo-url}
```

Update Helm Repositories

```bash
helm repo update
```

Search for Charts

```bash
helm search repo {chart-name}
```

Install a Chart

```bash
helm install {release-name} {chart-name} [--values values.yaml]
```

List Installed Releases

```bash
helm list
```

Upgrade a Release

```bash
helm upgrade {release-name} {chart-name} [--values values.yaml]
```

Rollback a Release

```bash
helm rollback {release-name} {revision}
```

Uninstall a Release

```bash
helm uninstall {release-name}
```

Show Chart Information

```bash
helm show chart {chart-name}
```

Package a Chart

```bash
helm package {chart-directory}
```

Create a New Chart

```bash
helm create {chart-name}
```

Lint a Chart

```bash
helm lint {chart-directory}
```

Render a file for debugging

```bash
helm template weather-forecast ./ --show-only templates/image-repository.yaml --values values-staging.yaml --values value
s-staging-stag-1.yaml --set environment=stag-1
```

## Additional Resources

[Helm Official Documentation](https://helm.sh/docs/intro/install/)
[Helm Hub for discovering available Helm charts](https://helm.sh/docs/)
[Helm Best Practices](https://hub.helm.sh/)
