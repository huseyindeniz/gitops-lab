
resource "kubernetes_namespace" "argo_cd" {
  metadata {
    name = var.argo_namespace
  }
}

resource "kubernetes_namespace" "harbor_staging" {
  metadata {
    name = "harbor-staging"
  }
}

resource "kubernetes_namespace" "sample_ai_backend_wsl_staging" {
  metadata {
    name = "sample-ai-backend-wsl-staging"
  }
}

resource "kubernetes_namespace" "sample_ai_frontend_wsl_staging" {
  metadata {
    name = "sample-ai-frontend-wsl-staging"
  }
}

