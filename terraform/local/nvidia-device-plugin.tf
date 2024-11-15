resource "kubernetes_manifest" "nvidia_device_plugin" {
  manifest = {
    apiVersion = "apps/v1"
    kind       = "DaemonSet"
    metadata = {
      name      = "nvidia-device-plugin-daemonset"
      namespace = "kube-system"
      labels = {
        app = "nvidia-device-plugin"
      }
    }
    spec = {
      selector = {
        matchLabels = {
          app = "nvidia-device-plugin"
        }
      }
      template = {
        metadata = {
          labels = {
            app = "nvidia-device-plugin"
          }
        }
        spec = {
          tolerations = [
            {
              key      = "nvidia.com/gpu"
              operator = "Exists"
              effect   = "NoSchedule"
            }
          ]
          containers = [
            {
              name  = "nvidia-device-plugin-ctr"
              image = "nvidia/k8s-device-plugin:v0.13.0"
              securityContext = {
                privileged = true
              }
              volumeMounts = [
                {
                  name      = "device-plugin"
                  mountPath = "/var/lib/kubelet/device-plugins"
                  readOnly  = false
                }
              ]
            }
          ]
          volumes = [
            {
              name = "device-plugin"
              hostPath = {
                path = "/var/lib/kubelet/device-plugins"
              }
            }
          ]
        }
      }
    }
  }
}
