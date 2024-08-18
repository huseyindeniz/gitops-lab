resource "kubernetes_manifest" "my_sample_app_argo_cd" {
  manifest = {
    apiVersion = "argoproj.io/v1alpha1"
    kind       = "Application"
    metadata = {
      name      = "my-sample-app"
      namespace = "argocd"
    }
    spec = {
      project = "default"
      source = {
        repoURL        = "https://github.com/huseyindeniz/cicd-lab.git"
        path           = "helm-charts/sample-app"
        targetRevision = "HEAD"
        helm = {
          value_files = [
            "values.yaml"
          ]
        }
      }
      destination = {
        server    = "https://kubernetes.default.svc"
        namespace = "default"
      }
      sync_policy = {
        automated = {
          self_heal = true
        }
      }
    }
  }
}
