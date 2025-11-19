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
        image = "quay.io/opstree/redis:v7.0.12"
        imagePullPolicy = "IfNotPresent"
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
            storageClassName = "standard" # Default for Minikube
          }
        }
      }

      redisExporter = {
        enabled = true
        image   = "quay.io/opstree/redis-exporter:v1.44.0"
      }
    }
  })
}
