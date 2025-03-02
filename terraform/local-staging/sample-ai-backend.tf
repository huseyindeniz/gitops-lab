# SAMPLE-AI

# Namespace
resource "kubernetes_namespace" "sample_ai" {
  metadata {
    name = "sample-ai-staging"
  }
}

# Persistent Volume
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
        path = "/mnt/data/shared/sample-ai-backend" # my host machine path where model files are stored
        type = "DirectoryOrCreate"
      }
    }
    persistent_volume_reclaim_policy = "Delete"
    storage_class_name               = "standard"
  }

  depends_on = [kubernetes_namespace.sample_ai]
}

# Persistent Volume Claim
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

# resource "kubernetes_pod" "debug_pod" {
#   metadata {
#     name      = "debug-pod"
#     namespace = kubernetes_namespace.sample_ai.metadata[0].name
#   }

#   spec {
#     container {
#       name    = "debug-container"
#       image   = "busybox"
#       command = ["sleep", "3600"]

#       volume_mount {
#         name       = "my-pvc"
#         mount_path = "/app/data"
#       }
#     }

#     volume {
#       name = "my-pvc"

#       persistent_volume_claim {
#         claim_name = "sample-ai-backend-volume-pvc"
#       }
#     }
#   }

#   depends_on = [kubernetes_persistent_volume_claim.sample_ai_backend_volume_pvc]
# }
