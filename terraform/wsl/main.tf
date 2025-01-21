resource "kubernetes_persistent_volume" "wsl_shared_volume_pv" {
  metadata {
    name = "wsl-shared-volume-pv"
  }
  spec {
    access_modes = ["ReadWriteOnce"]
    capacity = {
      storage = "10Gi"
    }
    persistent_volume_source {
      host_path {
        path = "/mnt/h/volumes/"
      }
    }
    persistent_volume_reclaim_policy = "Delete"
  }
}
