# image updater needs applications to be in the same namespace as argocd
# so, it doesn't work in this repo :(

# resource "helm_release" "argocd_image_updater" {
#   name       = "argocd-image-updater"
#   namespace  = kubernetes_namespace.argo_cd_local.metadata[0].name
#   repository = "https://argoproj.github.io/argo-helm"
#   chart      = "argocd-image-updater"
#   version    = "0.11.0" # Use the latest or preferred version

#   values = [
#     yamlencode({
#       config = {
#         argocd = {
#           # Set the server address for Argo CD, matching the internal ClusterIP
#           serverAddress = "http://argo-cd-local-argocd-server.argo-cd-local.svc.cluster.local:80"
#           insecure      = true
#           plaintext     = true
#         }
#         metrics = {
#           enabled = true # Enable metrics for monitoring (optional)
#         }
#       }
#     })
#   ]
# }
