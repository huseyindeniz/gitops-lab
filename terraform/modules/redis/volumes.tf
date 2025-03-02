# PV
resource "kubernetes_persistent_volume" "redis_pv" {
  metadata {
    name = "${var.resources_prefix}-redis-pv"
  }

  spec {
    access_modes = ["ReadWriteOnce"]

    capacity = {
      storage = var.storage_size # Size of the persistent volume
    }

    persistent_volume_source {
      host_path {
        path = var.pv_path
      }
    }

    persistent_volume_reclaim_policy = "Delete"

  }
}

# PVC
resource "kubernetes_persistent_volume_claim" "redis_pvc" {
  metadata {
    name      = "${var.resources_prefix}-redis-pvc"
    namespace = var.redis_namespace
  }

  spec {
    access_modes = ["ReadWriteOnce"]

    resources {
      requests = {
        storage = var.storage_size # Specify the requested storage size
      }
    }
  }

  depends_on = [
    kubernetes_persistent_volume.redis_pv
  ]
}
