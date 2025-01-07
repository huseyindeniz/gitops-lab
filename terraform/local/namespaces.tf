resource "kubernetes_namespace" "sample_game_server_local_staging" {
  metadata {
    name = "sample-game-server-server-staging"
  }
}

resource "kubernetes_namespace" "sample_game_client_local_staging" {
  metadata {
    name = "sample-game-server-client-staging"
  }
}
