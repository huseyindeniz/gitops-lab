# resource "helm_release" "prometheus" {
#   name       = "prometheus"
#   repository = "https://prometheus-community.github.io/helm-charts"
#   chart      = "kube-prometheus-stack"
#   namespace  = "monitoring"

#   set {
#     name  = "alertmanager.enabled"
#     value = "true"
#   }

#   set {
#     name  = "server.service.type"
#     value = "LoadBalancer"
#   }
# }
