resource "kubernetes_namespace" "monitoring" {
  metadata {
    name = "monitoring"
  }
}

# PV

resource "kubernetes_persistent_volume" "prometheus_pv" {
  metadata {
    name = "prometheus-pv"
  }
  spec {
    capacity = {
      storage = "2Gi"
    }
    access_modes = ["ReadWriteMany"]
    persistent_volume_source {
      host_path {
        path = "/mnt/data/shared/prometheus"
        type = "DirectoryOrCreate"
      }
    }
  }
}

# PVC
resource "kubernetes_persistent_volume_claim" "prometheus_pvc" {
  metadata {
    name      = "prometheus-pvc"
    namespace = kubernetes_namespace.monitoring.metadata[0].name
  }
  spec {
    access_modes = ["ReadWriteMany"]
    resources {
      requests = {
        storage = "2Gi"
      }
    }
  }
}
