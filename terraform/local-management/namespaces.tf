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
    labels = {
      "istio-injection" = "enabled"
    }
  }

  depends_on = [kubernetes_namespace.metallb]
}

# ARGO CD
resource "kubernetes_namespace" "argocd" {
  metadata {
    name = var.argo_namespace
  }

  depends_on = [kubernetes_namespace.istio]
}

# FLUX
resource "kubernetes_namespace" "flux" {
  metadata {
    name = var.flux_namespace
  }

  depends_on = [kubernetes_namespace.istio]
}


# Dashboard
resource "kubernetes_namespace" "dashboard" {
  metadata {
    name = "kubernetes-dashboard"
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
