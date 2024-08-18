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
- app of apps pattern, applicationsets, anti-patterns?

  Example

- terraform/sample-app/providers.tf: Configures the Helm provider.
- terraform/sample-app/main.tf: Defines the Helm release.
- terraform/sample-app/values.yaml: Custom values for Helm chart.
- helm-charts/sample-app/Chart.yaml: Metadata for Helm chart.
- helm-charts/sample-app/values.yaml: Default values (can be overridden).
- helm-charts/sample-app/templates/deployment.yaml: Kubernetes Deployment.
- helm-charts/sample-app/templates/service.yaml: Kubernetes Service.
- helm-charts/sample-app/templates/\_helpers.tpl: Helper functions.

###

1. Argo CD Projects for Environments

   Define separate Argo CD projects for each environment (e.g., prod, staging, dev). Projects can enforce different access controls, resource quotas, and sync policies per environment.

2. Namespaces for Projects

   Use Kubernetes namespaces to segregate different projects within the same environment. Each namespace can have its own set of applications (microservices), ensuring isolation and clarity.

3. App of Apps Pattern

   Utilize the App of Apps pattern to group microservices for each project. This allows for managing a large number of microservices under a single Argo CD project per environment.

4. ApplicationSets

   ApplicationSets can dynamically generate Argo CD applications based on a template. This is useful for managing repetitive tasks across environments, such as deploying microservices or handling multiple regions.

5. GitOps Integration

   Use separate Git repositories or branches for each environment, with each Argo CD project tracking the appropriate branch or repository. This setup maintains clear separation of concerns.

6. Argo CD Sync Waves and Hooks

   Implement sync waves and hooks to control deployment order, ensuring that dependencies between microservices are respected during updates.

###

Helm and Terraform: Developers create Helm charts for the microservice, and Terraform manages Kubernetes resources like namespaces, roles, and CRDs.

Argo CD Integration: Argo CD monitors the Git repository containing the Helm charts. When Terraform applies the infrastructure, Argo CD detects changes (e.g., new Helm chart) and automatically deploys the microservice.

Image Automation: Use Argo CD’s Image Updater or similar tools to detect new Docker images and trigger redeployments.

### Overview of the Process

Here’s what we’ll do to achieve your goal:

- Set Up the Dotnet Web API: Create a simple .NET Core Web API project.
- Create a Helm Chart: Develop a Helm chart to package your application for Kubernetes deployment.
- Configure Terraform: Use Terraform to manage Kubernetes resources and deploy the Helm chart.
- Set Up Argo CD: Configure Argo CD to monitor your Git repository and automatically deploy changes.
- Integrate Image Automation: Set up Argo CD to update the deployment automatically when a new Docker image is published.
