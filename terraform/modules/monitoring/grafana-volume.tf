resource "kubernetes_persistent_volume" "grafana_pv" {
  metadata {
    name = "grafana-pv"
  }
  spec {
    capacity = {
      storage = var.grafana_volume_config.storage_capacity
    }
    access_modes                     = ["ReadWriteOnce"]
    persistent_volume_reclaim_policy = "Retain"
    persistent_volume_source {
      host_path {
        path = var.grafana_volume_config.host_path
      }
    }
  }
  depends_on = [kubernetes_namespace.monitoring]
}

resource "kubernetes_persistent_volume_claim" "grafana_pvc" {
  metadata {
    name      = "grafana-pvc"
    namespace = var.namespace
  }
  spec {
    access_modes = ["ReadWriteOnce"]
    resources {
      requests = {
        storage = var.grafana_volume_config.storage_request
      }
    }
  }

  depends_on = [kubernetes_persistent_volume.grafana_pv]
}
