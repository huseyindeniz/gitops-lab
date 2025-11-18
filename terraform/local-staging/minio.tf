resource "kubernetes_namespace" "minio" {
  metadata {
    name = "minio"
  }
}

# PV and PVC removed - MinIO Operator manages its own storage via Tenant CRD
