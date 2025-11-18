# Metallb
resource "kubernetes_namespace" "metallb" {
  metadata {
    name = var.metallb_namespace
  }
}

# ISTIO
resource "kubernetes_namespace" "istio" {
  metadata {
    name = var.istio_namespace
  }
}

# Monitoring
resource "kubernetes_namespace" "monitoring" {
  metadata {
    name = "monitoring"
  }
}

# Nvidia Triton
resource "kubernetes_namespace" "triton" {
  metadata {
    name = "triton"
  }
}

# Argo Workflows
resource "kubernetes_namespace" "argo_workflows" {
  metadata {
    name = "argo-workflows"
  }
}

# networking-test application
resource "kubernetes_namespace" "networking_test" {
  metadata {
    name = "networking-test"
    labels = {
      "istio-injection" = "enabled"
    }
  }
}

