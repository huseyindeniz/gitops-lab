resource "kubernetes_persistent_volume" "sample_ai_backend_volume_pv" {
  metadata {
    name = "sample-ai-backend-volume-pv"
  }
  spec {
    access_modes = ["ReadWriteOnce"]
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
}

resource "kubernetes_persistent_volume_claim" "sample_ai_backend_volume_pvc" {
  metadata {
    name = "sample-ai-backend-volume-pvc"
  }

  spec {
    access_modes = ["ReadWriteOnce"]

    resources {
      requests = {
        storage = "2Gi"
      }
    }
  }
}
