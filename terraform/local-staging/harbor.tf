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

  resources_prefix     = kubernetes_namespace.harbor.metadata[0].name
  postgresql_namespace = kubernetes_namespace.harbor.metadata[0].name
  db_user              = "user_harbor"
  db_name              = "registry"
  db_port              = 5432
  storage_size         = "1Gi"

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
    REGISTRY_HTPASSWD              = "harbor_registry_user:${random_password.harbor_registry_credential.bcrypt_hash}"
  }

  depends_on = [kubernetes_namespace.harbor]
}

# TLS Secrets for Harbor Core (token encryption)
resource "tls_private_key" "harbor_core_token" {
  algorithm = "RSA"
  rsa_bits  = 4096
}

resource "tls_self_signed_cert" "harbor_core_token" {
  private_key_pem = tls_private_key.harbor_core_token.private_key_pem

  subject {
    common_name = "harbor-token-ca"
  }

  validity_period_hours = 87600 # 10 years

  allowed_uses = [
    "digital_signature",
    "key_encipherment",
  ]
}

resource "kubernetes_secret" "harbor_core_tls" {
  metadata {
    name      = "harbor-core-tls"
    namespace = kubernetes_namespace.harbor.metadata[0].name
  }

  type = "kubernetes.io/tls"

  data = {
    "tls.crt" = tls_self_signed_cert.harbor_core_token.cert_pem
    "tls.key" = tls_private_key.harbor_core_token.private_key_pem
  }

  depends_on = [kubernetes_namespace.harbor]
}

# TLS Secrets for Harbor Nginx (external TLS)
resource "tls_private_key" "harbor_nginx" {
  algorithm = "RSA"
  rsa_bits  = 4096
}

resource "tls_self_signed_cert" "harbor_nginx" {
  private_key_pem = tls_private_key.harbor_nginx.private_key_pem

  subject {
    common_name = "harbor.staging.local"
  }

  dns_names = ["harbor.staging.local"]

  validity_period_hours = 87600 # 10 years

  allowed_uses = [
    "digital_signature",
    "key_encipherment",
    "server_auth",
  ]
}

resource "kubernetes_secret" "harbor_nginx_tls" {
  metadata {
    name      = "harbor-nginx-tls"
    namespace = kubernetes_namespace.harbor.metadata[0].name
  }

  type = "kubernetes.io/tls"

  data = {
    "tls.crt" = tls_self_signed_cert.harbor_nginx.cert_pem
    "tls.key" = tls_private_key.harbor_nginx.private_key_pem
  }

  depends_on = [kubernetes_namespace.harbor]
}
