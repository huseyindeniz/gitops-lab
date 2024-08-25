resource "kubernetes_namespace" "project_001_staging_argo_cd" {
  metadata {
    name = "project-001-staging-argo-cd"
  }
}
