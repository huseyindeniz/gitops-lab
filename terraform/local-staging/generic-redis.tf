resource "kubernetes_namespace" "generic_redis" {
  metadata {
    name = "generic-redis"
  }
}

# PV
resource "kubernetes_persistent_volume" "postgresql_pv" {
  metadata {
    name = "generic-redis-pv"
  }

  spec {
    access_modes = ["ReadWriteOnce"]

    capacity = {
      storage = "8Gi"
    }

    persistent_volume_source {
      host_path {
        path = "/mnt/data/generic-redis"
      }
    }

    persistent_volume_reclaim_policy = "Delete"

  }

  depends_on = [kubernetes_namespace.generic_redis]
}

# PVC
resource "kubernetes_persistent_volume_claim" "generic_redis_pvc" {
  metadata {
    name      = "generic-redis-pvc"
    namespace = "generic-redis"
  }

  spec {
    access_modes = ["ReadWriteOnce"]

    resources {
      requests = {
        storage = "8Gi"
      }
    }
  }

  depends_on = [
    kubernetes_persistent_volume.postgresql_pv
  ]
}


# Redis
resource "helm_release" "generic_redis" {
  name             = "generic-redis"
  namespace        = "generic-redis"
  repository       = "oci://registry-1.docker.io/bitnamicharts"
  chart            = "redis"
  version          = "20.6.0" # do not change it
  create_namespace = false
  timeout          = 180

  values = [file("${path.module}/values/generic-redis-values.yaml")]

  depends_on = [kubernetes_persistent_volume_claim.generic_redis_pvc]
}
