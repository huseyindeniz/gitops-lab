# resource "kubernetes_config_map" "deployment_environments" {
#   metadata {
#     name = "deployment-environments"
#   }

#   data = {
#     environments = jsonencode([
#       {
#         name = "stag-1"
#         type = "staging"
#       },
#       {
#         name = "stag-2"
#         type = "staging"
#       },
#       {
#         name = "prod-bluegreen"
#         type = "production"
#       },
#       {
#         name = "prod-canary"
#         type = "production"
#       }
#     ])
#   }
# }

# data "kubernetes_config_map" "deployment_environments" {
#   metadata {
#     name = kubernetes_config_map.deployment_environments.metadata[0].name
#   }
# }
