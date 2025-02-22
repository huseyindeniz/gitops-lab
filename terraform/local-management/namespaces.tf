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

# HARBOR
resource "kubernetes_namespace" "harbor" {
  metadata {
    name = var.harbor_namespace
  }

  depends_on = [kubernetes_namespace.argocd]
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
