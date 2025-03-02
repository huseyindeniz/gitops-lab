resource "helm_release" "redis" {
  name             = "${var.resources_prefix}-redis"
  namespace        = var.redis_namespace
  repository       = "oci://registry-1.docker.io/bitnamicharts"
  chart            = "redis"
  version          = "20.6.0" # do not change it
  create_namespace = false
  timeout          = 600

  values = [
    yamlencode({
      architecture = "standalone"
      replica = {
        replicaCount = 1
      }
      auth = {
        enabled : false
        password : ""
      }
      podSecurityContext = {
        enabled : true
      }
      volumePermissions = {
        enabled : true # if podSecurityContext.enabled: true, volumePermissions.enabled: true
      }
      master = {
        persistence = {
          enabled       = true
          existingClaim = kubernetes_persistent_volume_claim.redis_pvc.metadata[0].name
        }
      }
      metrics = {
        enabled : true
      }
    })
  ]

  depends_on = [kubernetes_persistent_volume_claim.redis_pvc]
}
