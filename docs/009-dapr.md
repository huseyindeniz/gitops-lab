# Dapr notes

## Context

Previous sections covered the management of cloud infrastructure for our applications, including tools like Kubernetes, Terraform, Helm, and ArgoCD. These tools are essential for provisioning and maintaining infrastructure. However, at the application development level, distinct challenges arise, particularly in managing distributed systems and microservices.
Problem Statement

In microservices architecture, various services and components often rely on different external technologies (e.g., event buses, state stores, and secret management). Directly integrating these technologies requires tool-specific code, which introduces the following issues:

- Tight Coupling: Application code becomes tightly coupled to specific tools, limiting flexibility.
- Complexity: Developers must manage multiple APIs and SDKs, increasing the complexity of the codebase.
- Maintenance Overhead: Updating or replacing tools involves significant code changes, raising maintenance costs.

## Dapr Solution

Dapr (Distributed Application Runtime) addresses these challenges by abstracting the underlying infrastructure services, allowing developers to build distributed applications without embedding tool-specific code directly into the application.

**Key Features**

- Service Invocation: Dapr provides a uniform API for service-to-service communication, abstracting the implementation details of the underlying protocols (e.g., HTTP, gRPC).
- State Management: Offers a consistent API for state persistence, independent of the actual state store technology (e.g., Redis, Azure Cosmos DB).
- Pub/Sub Messaging: Supports publish/subscribe messaging patterns across different message brokers without changing the application code.
- Bindings: Facilitates interaction with external systems like databases or queues using standardized input/output bindings.
- Observability: Integrates with existing observability tools, providing support for distributed tracing, logging, and metrics collection.

**Integration**

Dapr runs as a sidecar to each microservice, enabling the application to utilize Dapr’s APIs for service invocation, state management, and other capabilities without requiring direct dependency on specific technologies.

**Example Usage**

When using an event bus, Dapr allows developers to switch from one message broker (e.g., Kafka) to another (e.g., Azure Service Bus) by modifying the Dapr configuration, rather than altering the application code itself.
