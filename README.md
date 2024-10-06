# cicd-lab

CI/CD Playground (K8S, Terraform, Argo CD, Helm, Github Workflows etc.)

## Goals
The primary goal of this repository is to build a comprehensive GitOps playground, integrating tools and platforms like Kubernetes, Terraform, Argo CD, Helm, and GitHub Workflows, with a focus on the following:

* **Establishing a Manageable Database Migration Infrastructure in the Cloud**\
 The core objective is to implement an effective GitOps approach for database migration using the Entity Framework (EF) Core code-first strategy. This includes:
  - Seamlessly managing migrations and schema changes across multiple cloud environments within a GitOps workflow.
  - Ensuring that database migration processes are integrated into the CI/CD pipeline in an automated, declarative, and version-controlled manner.
  - Applying best practices for versioning and automating the deployment of database changes across various cloud platforms (AWS, AKS, GKE, DOKS).
        
## TODO

- ✅ Install/Configure minikube
- ✅ Install/Configure terraform
- ✅ Install/Configure helm
- ✅ Install/Configure argocd
- ✅ Create/Configure app of app in argocd
- ✅ Create/Configure application set manifest for sample app
- ✅ Create/Configure helm chart for a service in sample app
- ✅ Create/Configure github actions
- ✅ Configure multi stating env for a specific app
- ✅ Configure helm hook for db migration before application itself deployed
- ❌ Install/Configure argocd-image-updater ([it doesn't support app in any namespace scenario yet](https://github.com/argoproj-labs/argocd-image-updater/issues/601))
- 🔲 Install/Configure flux for auto image updates
- 🔲 automate deployment of PRs
- 🔲 rollback ?
- 🔲 aws (vpc and cluster creation is ready)
- 🔲 aks (vpc and cluster creation is ready)
- 🔲 gke (vpc and cluster creation is ready)
- 🔲 doks
