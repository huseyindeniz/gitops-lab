# Notes for local setup

## Local Environment Setup:

- **Docker**: Ensure Docker is installed and configured.
- **Minikube**: Set up Minikube to create a local Kubernetes cluster.
- **GitHub Repo**: Create or use an existing GitHub repository to store your code, Helm charts, Terraform configurations, etc.
- **Docker Hub Repo**: Set up a Docker Hub repository for storing Docker images.
- **Terraform**: Install and configure Terraform.
- **Helm**: Install and configure Helm for package management.

TODO: Update following sections

## Step 1

Create a k8s cluster with 3 nodes (3cpus/4GB memory each)

```bash
minikube start --nodes 3 --cpus 2 --memory 4096
```

## Step 2

Enable addons

```bash
minikube addons enable ingress
minikube addons enable metrics-server
minikube addons enable dashboard
```

## Step 3

Start a tunnel (requests to localhost will be redirected to minikube)

```bash
minikube tunnel
```

## Step 4

install Argo CD for project 001 staging (in $root/terraform/project-001/staging/ directory)

```bash
terraform init
terraform apply
```

argo cd should be avaliable http://project001.staging.argocd.local
and "admin" password could be retrieved by running

```bash
terraform output argo_cd_local_admin_password
```

## Step 5

TODO: decide app of apps, or applicationset or both in argo cd

Hybrid approach seems logical.

- app of apps could automatically detect new microservices under project 001 staging
- applicationset could create same microservices in multiple staging envs.

## obsolete notes

Installing Argo CD in the Cluster

We can install Argo CD in our cluster using one of the following approaches:

- Direct Installation with kubectl:
  - We can run kubectl commands to apply the official Argo CD manifests.
- Installation via Terraform:
  - We can use Terraform to manage and deploy the necessary Kubernetes resources for Argo CD.
- Installation via Helm and Terraform:
  - We can use a Helm chart and manage it with Terraform’s helm_release resource for automated and parameterized installation.

## Directory Structure

```
root-directory/
├── terraform/
│ ├── project-001/
│ │ ├── staging/
│ │ └── production/
├── helm-charts/
├── apps
└── docs/
```

## Step 2 ArgoCD Installation

-

The installations above are straightforward. Follow the official documentation for each tool.

The last tool we need to install is Argo CD. Argo CD is an application like any other that we will deploy to our Kubernetes cluster. However, this application is special because it can monitor changes in Docker images, and when it detects a new version of an image, it automatically deploys it. We'll cover Argo CD usage in detail later, but for now, we need to install this essential application in our cluster.

There are different approaches to installing Argo CD in our cluster. For example, you could use Helm to install it manually. However, since we have Terraform, we can leverage Terraform’s Helm provider to install Argo CD using its Helm chart, automating the process.

First, you need to add the chart

```bash
helm repo add argo https://argoproj.github.io/argo-helm
helm repo update
```

Than, you can install it with helm install, but we want to do it with terraform. The files under the terraform/argo-cd handles this installation. You just need to execute following commands

```bash
terraform init
terraform apply
```

Once it's installed, you need to run the following command to access Argo CD UI.

Forward Port

```bash
kubectl port-forward svc/argo-cd-argocd-server 8080:443 -n argo-cd
```

Show initial admin password

```bash
terraform output -json argo_cd_local_admin_password
```

### Adding new applications to Argo CD

- create helm-chart of your app
- create new k8s manifest under manifests directory.
