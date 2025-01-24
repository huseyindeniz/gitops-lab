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
        path = "/mnt/h/volumes"
        type = "DirectoryOrCreate"
      }
    }
    persistent_volume_reclaim_policy = "Delete"
    storage_class_name               = "standard"
  }
}

resource "kubernetes_persistent_volume_claim" "sample_ai_backend_volume_pvc" {
  metadata {
    name      = "sample-ai-backend-volume-pvc"
    namespace = kubernetes_namespace.sample_ai_backend_wsl_staging.metadata[0].name
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

  depends_on = [kubernetes_namespace.sample_ai_backend_wsl_staging]
}

resource "kubernetes_pod" "debug_pod" {
  metadata {
    name      = "debug-pod"
    namespace = kubernetes_namespace.sample_ai_backend_wsl_staging.metadata[0].name
  }

  spec {
    container {
      name    = "debug-container"
      image   = "busybox"
      command = ["sleep", "3600"]

      volume_mount {
        name       = "my-pvc"
        mount_path = "/app/data/models/isnet-general-use.pth"
        sub_path   = "sample-ai-backend/models/isnet-general-use.pth"
      }
    }

    volume {
      name = "my-pvc"

      persistent_volume_claim {
        claim_name = "sample-ai-backend-volume-pvc"
      }
    }
  }
}
