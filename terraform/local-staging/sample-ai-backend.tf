resource "kubernetes_persistent_volume" "sample_ai_backend_volume_pv" {
  metadata {
    name = "sample-ai-backend-volume-pv"
  }
  spec {
    access_modes = ["ReadWriteMany"]
    capacity = {
      storage = "2Gi"
    }
    persistent_volume_source {
      host_path {
        path = "/mnt/h/volumes/sample-ai-backend"
        type = "DirectoryOrCreate"
      }
    }
    persistent_volume_reclaim_policy = "Delete"
    storage_class_name               = "standard"
  }

  depends_on = [kubernetes_namespace.sample_ai]
}

resource "kubernetes_persistent_volume_claim" "sample_ai_backend_volume_pvc" {
  metadata {
    name      = "sample-ai-backend-volume-pvc"
    namespace = kubernetes_namespace.sample_ai.metadata[0].name
  }

  spec {
    access_modes       = ["ReadWriteMany"]
    storage_class_name = "standard"
    resources {
      requests = {
        storage = "2Gi"
      }
    }
  }

  depends_on = [kubernetes_persistent_volume.sample_ai_backend_volume_pv]
}
