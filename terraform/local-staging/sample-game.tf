# SAMPLE-GAME

# Namespace
resource "kubernetes_namespace" "sample_game" {
  metadata {
    name = "sample-game-staging"
  }
}

# REDIS
module "sample_game_redis" {
  source           = "../modules/redis"
  resources_prefix = kubernetes_namespace.sample_game.metadata[0].name
  redis_namespace  = kubernetes_namespace.sample_game.metadata[0].name
  storage_size     = "1Gi"

  providers = {
    kubernetes = kubernetes
    kubectl    = kubectl
  }

  depends_on = [module.redis_operator]
}
