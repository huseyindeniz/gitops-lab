# OPERATORS
# Install all required operators for the local-production cluster

# CloudNativePG Operator for PostgreSQL management
module "cnpg_operator" {
  source = "../modules/cloudnative-pg-operator"

  operator_namespace = "cnpg-system"
  operator_version   = module.versions.cnpg_operator_version

  depends_on = [module.local_istio]
}

# Redis Operator for Redis management
module "redis_operator" {
  source = "../modules/redis-operator"

  operator_namespace = "ot-operators"
  operator_version   = module.versions.redis_operator_version

  depends_on = [module.cnpg_operator]
}

# MinIO Operator for object storage management
module "minio_operator" {
  source = "../modules/minio-operator"

  operator_namespace = "minio-operator"
  operator_version   = module.versions.minio_operator_version

  depends_on = [module.redis_operator]
}
