# Intro

## What we need & Why we need them?

- **Docker**:
  - Purpose: Provides containerization technology to create, deploy, and run applications in isolated environments known as containers.
  - Why: Essential for building and running containerized applications, which can then be orchestrated and managed by Kubernetes.
- **Minikube**:
  - Purpose: A tool that creates a local Kubernetes cluster on your machine for development and testing.
  - Why: Allows you to experiment with Kubernetes features and deploy applications locally without needing a full-scale cloud or on-premises cluster.
- **Terraform**:
  - Purpose: An Infrastructure as Code (IaC) tool for provisioning and managing cloud and on-premises resources using declarative configuration files.
  - Why: Automates the creation, modification, and management of Kubernetes infrastructure and other resources. Helps ensure reproducibility and version control of your infrastructure setup.
- **Helm**:
  - Purpose: A package manager for Kubernetes that simplifies the deployment and management of applications using Helm charts.
  - Why: Allows you to define, install, and upgrade complex Kubernetes applications in a consistent and repeatable manner. Helm charts provide templated configurations for deploying applications.
- **Argo CD**:
  - Purpose: A GitOps continuous delivery tool for Kubernetes that automates the deployment of applications from Git repositories to Kubernetes clusters.
  - Why: Provides a way to manage and synchronize Kubernetes applications through Git repositories, ensuring that the state of applications in the cluster matches the desired state defined in Git. Offers a web UI for visualizing and managing deployments.
