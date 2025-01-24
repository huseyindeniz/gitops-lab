resource "kubernetes_persistent_volume" "wsl_shared_volume_pv" {
  metadata {
    name = "wsl-shared-volume-pv"
  }
  spec {
    access_modes = ["ReadWriteMany"]
    capacity = {
      storage = "10Gi"
    }
    persistent_volume_source {
      host_path {
        path = "/mnt/h/volumes/"
        type = "DirectoryOrCreate"
      }
    }
    persistent_volume_reclaim_policy = "Retain"
    storage_class_name               = "standard"
  }
}

resource "kubernetes_persistent_volume_claim" "wsl_shared_volume_pvc" {
  metadata {
    name = "wsl-shared-volume-pvc"
  }

  spec {
    access_modes = ["ReadWriteMany"]

    resources {
      requests = {
        storage = "10Gi"
      }
    }
  }
}
