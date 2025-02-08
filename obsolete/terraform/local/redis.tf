
resource "helm_release" "generic_redis" {
  name             = "generic-redis"
  namespace        = "redis"
  repository       = "oci://registry-1.docker.io/bitnamicharts"
  chart            = "redis"
  create_namespace = true
  timeout          = 600

  values = [file("${path.module}/values/redis-values.yaml")]
}
