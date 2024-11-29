resource "argocd_application" "argo_wsl_root_applications" {
  metadata {
    name      = "argo-wsl-root-applications"
    namespace = var.argo_namespace
  }

  spec {
    project = "default"

    source {
      repo_url        = "https://github.com/${var.flux_github_org}/${var.flux_github_repository}.git"
      target_revision = "main"
      path            = "${var.flux_path}/wsl"
      directory {
        recurse = true
      }
    }

    destination {
      server    = "https://172.17.0.5:8443"
      namespace = "wsl-cluster"
    }

    sync_policy {
      automated {
        prune     = true
        self_heal = true
      }
    }
  }

  depends_on = [argocd_cluster.wsl_cluster]
}

