resource "kubernetes_persistent_volume" "prometheus_pv" {
  metadata {
    name = "prometheus-pv"
  }
  spec {
    capacity = {
      storage = var.prometheus_volume_config.storage_capacity
    }
    access_modes                     = ["ReadWriteOnce"]
    persistent_volume_reclaim_policy = "Retain"
    persistent_volume_source {
      host_path {
        path = var.prometheus_volume_config.host_path
      }
    }
  }
  depends_on = [kubernetes_namespace.monitoring]
}

resource "kubernetes_persistent_volume_claim" "prometheus_pvc" {
  metadata {
    name      = "prometheus-pvc"
    namespace = var.namespace
  }
  spec {
    access_modes = ["ReadWriteOnce"]
    resources {
      requests = {
        storage = var.prometheus_volume_config.storage_request
      }
    }
  }

  depends_on = [kubernetes_persistent_volume.prometheus_pv]
}
