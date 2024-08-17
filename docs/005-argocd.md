# Argo CD Notes

## What is Argo CD?

Argo CD is a declarative, GitOps continuous delivery tool for Kubernetes that allows you to manage your Kubernetes applications through Git repositories. It provides a web UI for visualizing and managing application deployments and synchronization.
Key Concepts

1. GitOps:
   - Definition: GitOps is a practice where Git repositories serve as the single source of truth for both application code and Kubernetes configurations. Argo CD automatically deploys changes from these repositories to your Kubernetes clusters.
   - Benefits: Enhances consistency, version control, and rollback capabilities for both application and infrastructure changes.
2. Applications:
   - Definition: An application in Argo CD represents a set of Kubernetes resources defined in a Git repository. Argo CD manages the deployment and synchronization of these resources to the Kubernetes cluster.
   - Components: Applications can be defined using Helm charts, Kustomize configurations, or plain YAML manifests.
3. Repositories:
   - Definition: Git repositories where your application configurations are stored. Argo CD connects to these repositories to fetch and deploy configurations.
   - Types: Includes GitHub, GitLab, Bitbucket, and Helm chart repositories.
4. Sync and Health Status:
   - Sync Status: Indicates whether the application in the cluster matches the desired state defined in the Git repository.
   - Health Status: Shows the health of the application's resources, such as whether they are running and healthy.
