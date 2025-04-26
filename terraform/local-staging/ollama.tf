# OLLAMA

# NAMESPACE
resource "kubernetes_namespace" "ollama" {
  metadata {
    name = "ollama"
  }
}

# OLLAMA MODELS PV

resource "kubernetes_persistent_volume" "ollama_models_pv" {
  metadata {
    name = "ollama-models-pv"
  }
  spec {
    capacity = {
      storage = "50Gi"
    }
    access_modes = ["ReadWriteMany"]
    persistent_volume_source {
      host_path {
        path = "/mnt/data/shared/ollama-models"
        type = "Directory"
      }
    }
  }
}

# OLLAMA MODELS PVC

resource "kubernetes_persistent_volume_claim" "ollama_models_pvc" {
  metadata {
    name      = "ollama-models-pvc"
    namespace = kubernetes_namespace.ollama.metadata[0].name
  }
  spec {
    access_modes = ["ReadWriteMany"]
    resources {
      requests = {
        storage = "50Gi"
      }
    }
  }
}
