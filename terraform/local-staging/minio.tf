resource "kubernetes_namespace" "minio" {
  metadata {
    name = "minio"
  }
}

# MinIO Data PV - persistent on host
resource "kubernetes_persistent_volume" "minio_data_pv" {
  metadata {
    name = "minio-data-pv"
  }
  spec {
    capacity = {
      storage = "40Gi"
    }
    access_modes                     = ["ReadWriteOnce"]
    storage_class_name               = ""
    persistent_volume_reclaim_policy = "Retain"
    persistent_volume_source {
      host_path {
        path = "/mnt/data/shared/minio"
        type = "DirectoryOrCreate"
      }
    }
  }
}
