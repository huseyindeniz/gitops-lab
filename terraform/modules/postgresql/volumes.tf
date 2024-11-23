# PV
resource "kubernetes_persistent_volume" "postgresql_pv" {
  metadata {
    name = "${var.resources_prefix}-postgresql-pv"
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
resource "kubernetes_persistent_volume_claim" "postgresql_pvc" {
  metadata {
    name      = "${var.resources_prefix}-postgresql-pvc"
    namespace = var.postgresql_namespace
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
    kubernetes_persistent_volume.postgresql_pv
  ]
}
