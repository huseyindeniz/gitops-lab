# HARBOR

# NAMESPACE
resource "kubernetes_namespace" "harbor" {
  metadata {
    name = "harbor"
  }
}

# REGISTRY PV

resource "kubernetes_persistent_volume" "harbor_registry_pv" {
  metadata {
    name = "harbor-registry-pv"
  }
  spec {
    capacity = {
      storage = "20Gi"
    }
    access_modes                     = ["ReadWriteMany"]
    storage_class_name               = "standard"
    persistent_volume_reclaim_policy = "Retain"
    persistent_volume_source {
      host_path {
        path = "/mnt/data/shared/harbor-registry"
        type = "DirectoryOrCreate"
      }
    }
  }

  depends_on = [kubernetes_namespace.harbor]
}

# REGISTRY PVC

resource "kubernetes_persistent_volume_claim" "harbor_registry_pvc" {
  metadata {
    name      = "harbor-registry-pvc"
    namespace = kubernetes_namespace.harbor.metadata[0].name
  }
  spec {
    access_modes       = ["ReadWriteMany"]
    storage_class_name = "standard"
    resources {
      requests = {
        storage = "20Gi"
      }
    }
  }

  depends_on = [kubernetes_persistent_volume.harbor_registry_pv]
}


# POSTGRESQL
module "harbor_postgresql" {
  source = "../modules/postgresql"

  # Pass environment-specific variables to the postgres module
  resources_prefix     = kubernetes_namespace.harbor.metadata[0].name
  postgresql_namespace = kubernetes_namespace.harbor.metadata[0].name
  db_user              = "user_harbor"
  db_name              = "registry"
  db_port              = 5432
  storage_size         = "1Gi"
  pv_path              = "/mnt/data/harbor-postgresql"

  providers = {
    kubernetes = kubernetes
    kubectl    = kubectl
  }

  depends_on = [module.cnpg_operator]
}

# REDIS
module "harbor_redis" {
  source           = "../modules/redis"
  resources_prefix = kubernetes_namespace.harbor.metadata[0].name
  redis_namespace  = kubernetes_namespace.harbor.metadata[0].name
  storage_size     = "1Gi"
  pv_path          = "/mnt/data/harbor-redis"

  providers = {
    kubernetes = kubernetes
    kubectl    = kubectl
  }

  depends_on = [module.redis_operator]
}

# HARBOR SECRETS

resource "random_password" "harbor_secret_key" {
  length  = 16
  special = false
}

resource "random_password" "harbor_core_secret" {
  length  = 16
  special = false
}

resource "random_password" "harbor_jobservice_secret" {
  length  = 16
  special = false
}

resource "random_password" "harbor_registry_secret" {
  length  = 16
  special = false
}

resource "random_password" "harbor_xsrf_key" {
  length  = 32
  special = false
}

resource "random_password" "harbor_registry_credential" {
  length  = 16
  special = false
}

# Main Harbor secret
resource "kubernetes_secret" "harbor_secret" {
  metadata {
    name      = "harbor-secret"
    namespace = kubernetes_namespace.harbor.metadata[0].name
  }

  data = {
    secretKey                      = random_password.harbor_secret_key.result
    HARBOR_ADMIN_PASSWORD          = "Harbor12345"
    CSRF_KEY                       = random_password.harbor_xsrf_key.result
    secret                         = random_password.harbor_core_secret.result
    JOBSERVICE_SECRET              = random_password.harbor_jobservice_secret.result
    REGISTRY_HTTP_SECRET           = random_password.harbor_registry_secret.result
    REGISTRY_CREDENTIAL_PASSWORD   = random_password.harbor_registry_credential.result
    REGISTRY_PASSWD                = random_password.harbor_registry_credential.result
    REGISTRY_HTPASSWD              = "harbor_registry_user:${bcrypt(random_password.harbor_registry_credential.result)}"
  }

  depends_on = [kubernetes_namespace.harbor]
}
