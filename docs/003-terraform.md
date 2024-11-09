# Terraform notes

## What is Terraform?

Terraform is an infrastructure as code tool that lets you build, change, and version cloud and on-prem resources safely and efficiently.

HashiCorp Terraform is an infrastructure as code tool that lets you define both cloud and on-prem resources in human-readable configuration files that you can version, reuse, and share. You can then use a consistent workflow to provision and manage all of your infrastructure throughout its lifecycle. Terraform can manage low-level components like compute, storage, and networking resources, as well as high-level components like DNS entries and SaaS features.

## How it works?

Terraform creates and manages resources on cloud platforms and other services through their application programming interfaces (APIs). Providers enable Terraform to work with virtually any platform or service with an accessible API.

![Overview](./images/terraform/001.avif)

HashiCorp and the Terraform community have already written thousands of providers to manage many different types of resources and services. You can find all publicly available providers on the Terraform Registry, including Amazon Web Services (AWS), Azure, Google Cloud Platform (GCP), Kubernetes, Helm, GitHub, Splunk, DataDog, and many more.

The core Terraform workflow consists of three stages:

- **Write**: You define resources, which may be across multiple cloud providers and services. For example, you might create a configuration to deploy an application on virtual machines in a Virtual Private Cloud (VPC) network with security groups and a load balancer.
- **Plan**: Terraform creates an execution plan describing the infrastructure it will create, update, or destroy based on the existing infrastructure and your configuration.
- **Apply**: On approval, Terraform performs the proposed operations in the correct order, respecting any resource dependencies. For example, if you update the properties of a VPC and change the number of virtual machines in that VPC, Terraform will recreate the VPC before scaling the virtual machines.

![Workflow](./images/terraform/002.avif)

[More Info](https://developer.hashicorp.com/terraform)

## Installation on local

- Check this [official installation page](https://developer.hashicorp.com/terraform/install?product_intent=terraform)

## Commands

**Initialize terraform**

```bash
terraform init
```

**Format**

```bash
teraform fmt
```

**Validate configuration**

```bash
terraform validate
```

**Plan configuration**

```bash
terraform plan
```

**Apply configuration (create resources)**

```bash
terraform apply
```

**Destroy (destroy resources)**

```bash
terraform destroy
```

**Show human-readable output from a state**

```bash
terraform show
```

**List resources in a state**

```bash
terraform state list
```

**Show Resource Details**

```bash
terraform state show {resource-name}
```

**Import Existing Resources into Terraform**

```bash
terraform import {resource-name} {resource-id}
```

**Remove a Resource from State**

```bash
terraform state rm {resource-name}
```

**Upgrade Terraform Provider Versions**

```bash
terraform providers lock -upgrade
```

**Upgrade Terraform Provider Versions**

```bash
terraform providers lock -upgrade
```

**Check for New Terraform Versions**

```bash
terraform version
```

## debug

```bash
export TF_LOG=DEBUG
```

## Managing Kubernetes Resources with Terraform vs. kubectl

**Key Differences**

- **State Management**:
  - kubectl: Does not track the state of your resources. Kubernetes itself tracks the state, but kubectl does not provide a direct way to track changes over time.
  - Terraform: Maintains a state file that records the current state of your resources. This allows Terraform to compare the state with your configuration files and apply changes accordingly.
- **Change Management**:
  - kubectl: Applies changes immediately to the cluster based on the configuration files. There’s no built-in mechanism to preview changes before applying them.
  - Terraform: Provides an execution plan (terraform plan) that shows what changes will be made before applying them. This helps in reviewing and validating changes beforehand.
- **Integration with Other Services**:
  - kubectl: Primarily focused on managing Kubernetes resources.
  - Terraform: Can manage resources across multiple providers and services (e.g., AWS, Azure, GCP, Kubernetes, Helm) from a unified configuration.
- **Consistency and Automation**:
  - kubectl: Configuration management is manual, and tracking changes might involve external tools or scripts.
  - Terraform: Promotes consistency by managing infrastructure as code and integrates well with CI/CD pipelines for automated provisioning and updates.
- **Multi-Provider Support**:
  - kubectl: Limited to Kubernetes.
  - Terraform: Can manage resources across various cloud providers and services using a single configuration.
