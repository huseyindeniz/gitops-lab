# Bitnami to Kubernetes Operators Migration

## Background

In August 2025, Bitnami stopped publishing new container images and Helm charts to Docker Hub as part of their transition to a commercial "Bitnami Secure Images" model. This required migrating away from Bitnami charts to open-source alternatives.

## Migration Summary

All Bitnami dependencies have been replaced with production-ready Kubernetes Operators:

| Component | Old Solution | New Solution | License |
|-----------|-------------|--------------|---------|
| PostgreSQL | Bitnami Helm Chart | CloudNativePG Operator | Apache 2.0 |
| Redis | Bitnami Helm Chart | OT-CONTAINER-KIT Redis Operator | Apache 2.0 |
| MinIO | Bitnami Helm Chart | MinIO Operator | AGPLv3 |

## What Changed

### 1. Kubernetes Operators Installed

Three new Terraform modules were created to install operators:

```
terraform/modules/cloudnative-pg-operator/
terraform/modules/redis-operator/
terraform/modules/minio-operator/
```

Each cluster now installs these operators via `terraform/<cluster>/operators.tf`:

```hcl
module "cnpg_operator" {
  source = "../modules/cloudnative-pg-operator"
}

module "redis_operator" {
  source = "../modules/redis-operator"
}

module "minio_operator" {
  source = "../modules/minio-operator"
}
```

### 2. PostgreSQL Module Updated

**Location**: `terraform/modules/postgresql/`

**Changes**:
- Removed Bitnami Helm chart installation
- Added CloudNativePG `Cluster` CRD resource
- Created backward-compatible service: `{prefix}-postgresql` → `{prefix}-pg-rw`
- Created backward-compatible secret: `{prefix}-postgres-password`
- Deprecated `pv_path` variable (operator manages storage)

**Applications are NOT affected** - connection strings remain identical:
- Service: `{prefix}-postgresql:5432`
- Secret: `{prefix}-postgres-password` (keys: `password`, `POSTGRES_PASSWORD`)

### 3. Redis Module Updated

**Location**: `terraform/modules/redis/`

**Changes**:
- Removed Bitnami Helm chart installation
- Added OT-CONTAINER-KIT `Redis` CRD resource
- Created backward-compatible service: `{prefix}-redis-master` → `{prefix}-redis`
- Deprecated `pv_path` variable (operator manages storage)

**Applications are NOT affected** - connection strings remain identical:
- Service: `{prefix}-redis-master:6379`

### 4. MinIO Migrated to Operator

**Location**: `flux/apps/local-staging/minIO/` and `flux/apps/local-production/minIO/`

**Changes**:
- Removed Bitnami Helm chart from ArgoCD Application
- Created MinIO `Tenant` CRD in `raw-manifests/<cluster>/minio/tenant.yaml`
- ArgoCD Application now deploys raw manifests instead of Helm chart

## How Operators Work

### Operator Pattern

1. **Installation**: Operator pods run continuously in dedicated namespaces
   - CloudNativePG: `cnpg-system`
   - Redis Operator: `ot-operators`
   - MinIO Operator: `minio-operator`

2. **Resource Management**: Operators watch for Custom Resource Definitions (CRDs)
   - PostgreSQL: `Cluster` CRD
   - Redis: `Redis` CRD
   - MinIO: `Tenant` CRD

3. **Automatic Provisioning**: When a CRD is created, operators automatically provision:
   - Pods (database/cache/storage instances)
   - Services (for connectivity)
   - PVCs (for persistent storage)
   - Secrets (for credentials)

4. **Lifecycle Management**: Operators continuously manage:
   - Health monitoring
   - Automatic failover
   - Backups and restores
   - Rolling updates
   - Scaling

### Example: PostgreSQL Workflow

```
Terraform creates:
├─ Cluster CRD: harbor-pg (in harbor namespace)
│
CloudNativePG Operator sees this and creates:
├─ Pod: harbor-pg-1 (PostgreSQL instance)
├─ Service: harbor-pg-rw (read-write endpoint)
├─ Service: harbor-pg-ro (read-only endpoint)
├─ Service: harbor-pg-r (any instance)
├─ PVC: harbor-pg-1 (managed storage)
│
Terraform creates backward compatibility:
├─ Service: harbor-postgresql → harbor-pg-rw
└─ Secret: harbor-postgres-password
```

## Backward Compatibility

All applications continue to work without changes due to compatibility resources:

### PostgreSQL
```hcl
# Compatibility Service (ExternalName)
resource "kubernetes_service" "postgresql_compatibility" {
  metadata {
    name = "${var.resources_prefix}-postgresql"
  }
  spec {
    type = "ExternalName"
    external_name = "${var.resources_prefix}-pg-rw.${var.postgresql_namespace}.svc.cluster.local"
  }
}

# Compatibility Secret
resource "kubernetes_secret" "postgresql_password_secret" {
  data = {
    password          = random_password.postgresql_password.result
    POSTGRES_PASSWORD = random_password.postgresql_password.result
  }
}
```

### Redis
```hcl
# Compatibility Service (ExternalName)
resource "kubernetes_service" "redis_master_compatibility" {
  metadata {
    name = "${var.resources_prefix}-redis-master"
  }
  spec {
    type = "ExternalName"
    external_name = "${var.resources_prefix}-redis.${var.redis_namespace}.svc.cluster.local"
  }
}
```

## Deployment

### First Time Setup

1. **Install Operators** (one-time per cluster):
   ```bash
   cd terraform/local-staging
   terraform init
   terraform apply
   ```

2. **Deploy Applications** (modules automatically use operators):
   ```bash
   # PostgreSQL and Redis are created via existing module calls
   # Harbor: module "harbor_postgresql" { source = "../modules/postgresql" }
   # Sample-dotnet: module "weather_forecast_postgresql" { ... }
   ```

3. **Sync ArgoCD** (for MinIO):
   ```bash
   # ArgoCD will automatically deploy MinIO Tenant CRDs
   ```

### Migrating Existing Deployments

**IMPORTANT**: Migrating live databases requires careful planning.

1. **Backup Data** before migration
2. **Delete old Bitnami resources**:
   ```bash
   helm uninstall <release-name> -n <namespace>
   ```
3. **Apply new operator-based resources**
4. **Restore data** to new instances

## Benefits of Operator Migration

1. **No Vendor Lock-in**: All operators are open-source (Apache 2.0 / AGPLv3)
2. **Production-Ready**: Operators provide enterprise features:
   - Automatic failover
   - Backup/restore automation
   - Rolling updates without downtime
   - Monitoring integration
3. **Active Development**: All operators are actively maintained by their communities
4. **Cost**: Completely free (no subscription required)
5. **GitOps Friendly**: Declarative CRD-based management

## Troubleshooting

### Operator Not Creating Resources

Check operator logs:
```bash
# CloudNativePG
kubectl logs -n cnpg-system -l app.kubernetes.io/name=cloudnative-pg

# Redis Operator
kubectl logs -n ot-operators -l name=redis-operator

# MinIO Operator
kubectl logs -n minio-operator -l name=minio-operator
```

### Service Not Found

Verify CRD was created successfully:
```bash
# PostgreSQL
kubectl get cluster -n <namespace>
kubectl describe cluster <cluster-name> -n <namespace>

# Redis
kubectl get redis -n <namespace>
kubectl describe redis <redis-name> -n <namespace>

# MinIO
kubectl get tenant -n <namespace>
kubectl describe tenant <tenant-name> -n <namespace>
```

### Connection Issues

Check if compatibility services exist:
```bash
kubectl get svc -n <namespace> | grep postgresql
kubectl get svc -n <namespace> | grep redis
```

## Resources

- [CloudNativePG Documentation](https://cloudnative-pg.io/)
- [OT-CONTAINER-KIT Redis Operator](https://ot-container-kit.github.io/redis-operator/)
- [MinIO Operator Documentation](https://min.io/docs/minio/kubernetes/upstream/)
- [Bitnami Deprecation Notice](https://github.com/bitnami/containers/issues/83267)
