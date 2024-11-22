# helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
# helm repo add grafana https://grafana.github.io/helm-charts
# helm repo update

resource "kubernetes_persistent_volume" "prometheus_pv" {
  metadata {
    name = "prometheus-pv"
  }
  spec {
    capacity = {
      storage = "2Gi"
    }
    access_modes                     = ["ReadWriteOnce"]
    persistent_volume_reclaim_policy = "Retain"
    persistent_volume_source {
      host_path {
        path = "/mnt/data/prometheus" # Path on the host for local development
      }
    }
  }
  depends_on = [kubernetes_namespace.monitoring]
}

resource "kubernetes_persistent_volume_claim" "prometheus_pvc" {
  metadata {
    name      = "prometheus-pvc"
    namespace = "monitoring"
  }
  spec {
    access_modes = ["ReadWriteOnce"]
    resources {
      requests = {
        storage = "1Gi"
      }
    }
  }

  depends_on = [kubernetes_persistent_volume.prometheus_pv]
}

resource "kubernetes_persistent_volume" "grafana_pv" {
  metadata {
    name = "grafana-pv"
  }
  spec {
    capacity = {
      storage = "2Gi"
    }
    access_modes                     = ["ReadWriteOnce"]
    persistent_volume_reclaim_policy = "Retain"
    persistent_volume_source {
      host_path {
        path = "/mnt/data/grafana" # Path on the host for local development
      }
    }
  }
  depends_on = [kubernetes_namespace.monitoring]
}

resource "kubernetes_persistent_volume_claim" "grafana_pvc" {
  metadata {
    name      = "grafana-pvc"
    namespace = "monitoring"
  }
  spec {
    access_modes = ["ReadWriteOnce"]
    resources {
      requests = {
        storage = "1Gi"
      }
    }
  }

  depends_on = [kubernetes_persistent_volume.grafana_pv]
}

resource "helm_release" "prometheus" {
  name             = "prometheus"
  repository       = "https://prometheus-community.github.io/helm-charts"
  chart            = "kube-prometheus-stack"
  namespace        = "monitoring"
  create_namespace = false

  values = [
    file("${path.root}/values/kube-prometheus-stack-values.yaml")
  ]
  depends_on = [kubernetes_persistent_volume_claim.prometheus_pvc, kubernetes_persistent_volume_claim.grafana_pvc]
}
