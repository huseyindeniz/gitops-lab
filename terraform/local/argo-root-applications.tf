resource "argocd_application" "argo_root_applications" {
  metadata {
    name      = "argo-local-root-applications"
    namespace = var.argo_namespace
  }

  spec {
    project = "default"

    source {
      repo_url        = "https://github.com/${var.flux_github_org}/${var.flux_github_repository}.git"
      target_revision = "main"
      path            = "${var.flux_path}/applications"
      directory {
        recurse = true
      }
    }

    destination {
      server    = "https://kubernetes.default.svc"
      namespace = var.argo_namespace
    }

    sync_policy {
      automated {
        prune     = true
        self_heal = true
      }
    }
  }

  depends_on = [module.local_argo, flux_bootstrap_git.flux_bootstrap]
}

