# Intro

## What We Need & Why We Need Them

- **Docker**:

  - **Purpose**: Provides containerization technology to create, deploy, and run applications in isolated environments known as containers.
  - **Why**: Essential for building and running containerized applications, which can then be orchestrated and managed by Kubernetes.

- **Minikube**:

  - **Purpose**: A tool that creates a local Kubernetes cluster on your machine for development and testing.
  - **Why**: Allows you to experiment with Kubernetes features and deploy applications locally without needing a full-scale cloud or on-premises cluster.

- **Terraform**:

  - **Purpose**: An Infrastructure as Code (IaC) tool for provisioning and managing cloud and on-premises resources using declarative configuration files.
  - **Why**: Automates the creation, modification, and management of Kubernetes infrastructure and other resources. Ensures reproducibility and version control of your infrastructure setup.

- **Helm**:

  - **Purpose**: A package manager for Kubernetes that simplifies the deployment and management of applications using Helm charts.
  - **Why**: Allows you to define, install, and upgrade complex Kubernetes applications in a consistent and repeatable manner. Helm charts provide templated configurations for deploying applications.

- **Argo CD**:

  - **Purpose**: A GitOps continuous delivery tool for Kubernetes that automates the deployment of applications from Git repositories to Kubernetes clusters.
  - **Why**: Manages and synchronizes Kubernetes applications through Git repositories, ensuring that the state of applications in the cluster matches the desired state defined in Git. Offers a web UI for visualizing and managing deployments.

- **Flux**:
  - **Purpose**: A GitOps tool that automates the continuous delivery of Kubernetes applications. Flux specializes in automating image updates and synchronizing Git-managed configurations.
  - **Why**: Monitors container registries for new image versions and automatically updates the image references in your Kubernetes manifests. This automation reduces manual intervention, ensuring that deployments are always up to date without requiring direct changes to the Git repository.

After having brief knowledge about technologiles/tools above, we will create a sample structure for the following requirements.

## Requirements:

- **Project and Environment Isolation**: Each project and its environments (e.g., staging, production) must be isolated.
- **Microservice Ownership**: Teams manage specific microservices, with potential overlap in ownership.
- **Resource Separation**: Dedicated nodes for certain resources (e.g., databases) to ensure isolation from microservices.
- **Automation**: Minimize manual intervention with automated deployments and updates.

## Goal

Managing Kubernetes resources directly with `kubectl` can quickly become unmanageable, especially as your infrastructure grows. Terraform improves this by allowing you to manage these resources as code, but in multi-project, multi-environment, and multi-team scenarios, Terraform alone can lead to code duplication.

Helm solves this by introducing reusable templates. By using Helm with Terraform, we can create parameterized templates and manage them through Terraform’s `helm_release` resource, adhering to the DRY (Don’t Repeat Yourself) principle.

However, manual intervention is still needed for deployments, such as updating image versions or applying new resources. This is where Argo CD and Flux come into play. Argo CD continuously monitors your Git repository for changes to Kubernetes manifests, automatically deploying new resources. Flux enhances this by automating image updates, detecting new images, and triggering deployments without manual intervention.

Together, these tools create a fully automated CI/CD pipeline, reducing manual work, eliminating duplication, and ensuring that your deployments are always up to date.

## Decisions:

- **Argo CD Installation per Project + Environment**: A separate Argo CD instance for each project and environment.
- **Argo CD Projects**: Used to organize and manage microservices within each Argo CD instance.
- **k8s Namespaces**: Each microservice gets its own namespace within the environment.
- **Node Affinity**: Apply node affinity rules to deploy specific resources (e.g., databases) on designated nodes, ensuring separation from other workloads like microservices.
- **Teams**: Managed with RBAC to control access and ownership across microservices.
