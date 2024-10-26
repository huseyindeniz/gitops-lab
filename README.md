# gitops-lab

GitOps Playground (K8S, Terraform, Argo CD, Helm, Github Workflows etc.)

## Goals

The primary goal of this repository is to build a comprehensive GitOps playground, integrating tools and platforms like Kubernetes, Terraform, Argo CD, Helm, and GitHub Workflows, with a focus on the following:

- **Establishing a Manageable Database Migration Infrastructure in the Cloud**\
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
- ✅ Install/Configure flux for auto image updates
- 🔲 automate deployment of PRs
- 🔲 rollback ?
- 🔲 aws (vpc and cluster creation is ready)
- 🔲 aks (vpc and cluster creation is ready)
- 🔲 gke (vpc and cluster creation is ready)
- 🔲 doks

## Note on Database Migrations in Kubernetes and EF Core Migration Bundles

While working through how to handle database migrations in Kubernetes, I found it to be more challenging than expected. The main issue is that migrations need to be completed before any application pods are re-deployed to keep the schema in sync. Since Kubernetes doesn't have a built-in way to enforce dependencies between deployments, it can be tricky to control the correct order of operations.

Initially, I explored using Argo CD hooks to solve this problem. However, I found that they don't fully address the dependency issue, as they don't enforce a strict sequence between running the migrations and updating the application pods. This could potentially lead to race conditions, where the application is deployed before the migrations finish.

Through further experimentation, I discovered that Helm hooks worked better for this scenario. Helm hooks allowed me to ensure that the migrations were applied before any application pods were deployed or updated. In essence, this moved the solution to the application layer within the Helm charts, helping me manage the order of operations effectively.

Additionally, I used Entity Framework (EF) Core Migration Bundles to make the process smoother. These bundles are self-contained executables that include all necessary migration logic, making it easier to apply migrations in any environment without needing the EF CLI tools or a full development setup. Combining EF Core migration bundles with Helm hooks felt like a natural fit within a GitOps workflow, providing a consistent and version-controlled way to apply schema changes alongside application updates.

This approach worked well for my case, ensuring that database migrations were correctly managed within the CI/CD pipeline and reducing deployment risks in Kubernetes environments. There may be other solutions out there, but this combination of Helm hooks and EF Core migration bundles was the one that solved the problem effectively for me.

![ArgoCD Overview](./docs/images/screenshots/argo-001.png)

![ArgoCD App View](./docs/images/screenshots/argo-002.png)

![Migration Example](./docs/images/screenshots/migration-example.gif)

# Developer Workflow

Follow these steps to update your application and database with minimal effort.

### Steps to Update

1. **Modify Your Entities**  
   Make changes to your application's entities as needed.
2. **Create a Migration**  
   Use the `.NET` CLI to create a migration for your database schema updates.
   ```bash
   dotnet ef migrations add <MigrationName> --project ./mySampleApp1.weatherForecast.Infra --startup-project ./mySampleApp1.weatherForecast.API
   ```
3. **Commit Your Changes**  
   Commit the updated code and migration files.
4. **Submit a Pull Request**  
    Open a PR to merge your changes.
   That's it! Once the PR is created, the automated pipeline will handle the rest: (TODO: workflow is working with manual trigger currently)

### Automated Pipeline

1. **GitHub Workflow**: Builds and publishes the Docker images for your updated application.
2. **Flux**: Detects the new image tags and automatically updates the application manifest.
3. **ArgoCD**: Syncs the latest changes from the manifest to the Kubernetes cluster.
4. **Migration Job Deployment**: Deploys the job with the latest application migration image tag.
5. **Helm Hook**: Triggers the migration job execution.
6. **EF Core Migration Execution**: The job runs the EF Core migration bundle on the database.
7. **Application Deployment**: After the job finishes, ArgoCD deploys the updated application pod with the latest image.
8. **Update Complete**: Both the application and the database are now up-to-date.

This workflow allows seamless application and database updates with minimal manual steps.

TODO:

- Check the flow for conflicting db migration cases.
