# Notes for local setup

## Local Environment Setup:

- **Docker**: Ensure Docker is installed and configured.
- **Minikube**: Set up Minikube to create a local Kubernetes cluster.
- **GitHub Repo**: Create or use an existing GitHub repository to store your code, Helm charts, Terraform configurations, etc.
- **Docker Hub Repo**: Set up a Docker Hub repository for storing Docker images.
- **Helm**: Install and configure Helm for package management.

### Argo CD Installation

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
terraform output -json argo_cd_admin_password
```

### Adding new applications to Argo CD

TODO: Find the best practice for: - Multi project - Multi env

- projects under Argo CD could be used for envs.
- namespaces could be used for projects.

Example

- terraform/sample-app/providers.tf: Configures the Helm provider.
- terraform/sample-app/main.tf: Defines the Helm release.
- terraform/sample-app/values.yaml: Custom values for Helm chart.
- helm-charts/sample-app/Chart.yaml: Metadata for Helm chart.
- helm-charts/sample-app/values.yaml: Default values (can be overridden).
- helm-charts/sample-app/templates/deployment.yaml: Kubernetes Deployment.
- helm-charts/sample-app/templates/service.yaml: Kubernetes Service.
- helm-charts/sample-app/templates/\_helpers.tpl: Helper functions.
