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
    access_modes                     = ["ReadWriteMany"]
    storage_class_name               = "standard"
    persistent_volume_reclaim_policy = "Retain"
    persistent_volume_source {
      host_path {
        path = "/mnt/data/shared/ollama-models"
        type = "DirectoryOrCreate"
      }
    }
  }

  depends_on = [kubernetes_namespace.ollama]
}

# OLLAMA MODELS PVC

resource "kubernetes_persistent_volume_claim" "ollama_models_pvc" {
  metadata {
    name      = "ollama-models-pvc"
    namespace = kubernetes_namespace.ollama.metadata[0].name
  }
  spec {
    access_modes       = ["ReadWriteMany"]
    storage_class_name = "standard"
    resources {
      requests = {
        storage = "50Gi"
      }
    }
  }

  depends_on = [kubernetes_persistent_volume.ollama_models_pv]
}
