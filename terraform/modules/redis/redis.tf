# REDIS PV
resource "kubernetes_persistent_volume" "redis_pv" {
  metadata {
    name = "${var.resources_prefix}-redis-pv"
  }
  spec {
    capacity = {
      storage = var.storage_size
    }
    access_modes                     = ["ReadWriteOnce"]
    storage_class_name               = "standard"
    persistent_volume_reclaim_policy = "Retain"
    persistent_volume_source {
      host_path {
        path = var.pv_path
        type = "DirectoryOrCreate"
      }
    }
  }
}

# REDIS STANDALONE INSTANCE
# Using OT-CONTAINER-KIT Redis Operator
resource "kubectl_manifest" "redis_standalone" {
  yaml_body = yamlencode({
    apiVersion = "redis.redis.opstreelabs.in/v1beta2"
    kind       = "Redis"
    metadata = {
      name      = "${var.resources_prefix}-redis"
      namespace = var.redis_namespace
    }
    spec = {
      kubernetesConfig = {
        image           = "quay.io/opstree/redis:v7.0.12"
        imagePullPolicy = "IfNotPresent"
      }

      securityContext = {
        runAsUser  = 0
        runAsGroup = 0
        fsGroup    = 0
      }

      storage = {
        volumeClaimTemplate = {
          spec = {
            accessModes = ["ReadWriteOnce"]
            resources = {
              requests = {
                storage = var.storage_size
              }
            }
            storageClassName = "standard"
          }
        }
      }

      redisExporter = {
        enabled = true
        image   = "quay.io/opstree/redis-exporter:v1.44.0"
      }
    }
  })

  depends_on = [kubernetes_persistent_volume.redis_pv]
}
