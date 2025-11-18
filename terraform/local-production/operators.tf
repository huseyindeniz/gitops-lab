# OPERATORS
# Install all required operators for the local-production cluster

# CloudNativePG Operator for PostgreSQL management
module "cnpg_operator" {
  source = "../modules/cloudnative-pg-operator"

  operator_namespace = "cnpg-system"
  operator_version   = module.versions.cnpg_operator_version
}

# Redis Operator for Redis management
module "redis_operator" {
  source = "../modules/redis-operator"

  operator_namespace = "ot-operators"
  operator_version   = module.versions.redis_operator_version
}

# MinIO Operator for object storage management
module "minio_operator" {
  source = "../modules/minio-operator"

  operator_namespace = "minio-operator"
  operator_version   = module.versions.minio_operator_version
}
