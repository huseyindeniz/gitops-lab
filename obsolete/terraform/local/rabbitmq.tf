
# resource "helm_release" "generic_rabbitmq" {
#   name             = "generic-rabbitmq"
#   namespace        = "rabbitmq"
#   repository       = "oci://registry-1.docker.io/bitnamicharts"
#   chart            = "rabbitmq"
#   create_namespace = true
#   timeout          = 600

#   values = [file("${path.module}/values/rabbitmq-values.yaml")]
# }
