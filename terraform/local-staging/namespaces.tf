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

  depends_on = [kubernetes_namespace.metallb]
}

# HARBOR
resource "kubernetes_namespace" "harbor" {
  metadata {
    name = var.harbor_namespace
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

# SAMPLE-GAME
resource "kubernetes_namespace" "sample_game" {
  metadata {
    name = "sample-game-staging"
  }
}

# SAMPLE-AI
resource "kubernetes_namespace" "sample_ai" {
  metadata {
    name = "sample-ai-staging"
  }
}
