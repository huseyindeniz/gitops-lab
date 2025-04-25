locals {
  argo_workflows_crds = {
    clusterworkflowtemplates = "https://raw.githubusercontent.com/argoproj/argo-workflows/refs/heads/main/manifests/base/crds/minimal/argoproj.io_clusterworkflowtemplates.yaml"
    cronworkflows            = "https://raw.githubusercontent.com/argoproj/argo-workflows/refs/heads/main/manifests/base/crds/minimal/argoproj.io_cronworkflows.yaml"
    workflowartifactgctasks  = "https://raw.githubusercontent.com/argoproj/argo-workflows/refs/heads/main/manifests/base/crds/minimal/argoproj.io_workflowartifactgctasks.yaml"
    workfloweventbindings    = "https://raw.githubusercontent.com/argoproj/argo-workflows/refs/heads/main/manifests/base/crds/minimal/argoproj.io_workfloweventbindings.yaml"
    workflows                = "https://raw.githubusercontent.com/argoproj/argo-workflows/refs/heads/main/manifests/base/crds/minimal/argoproj.io_workflows.yaml"
    workflowtaskresults      = "https://raw.githubusercontent.com/argoproj/argo-workflows/refs/heads/main/manifests/base/crds/minimal/argoproj.io_workflowtaskresults.yaml"
    workflowtasksets         = "https://raw.githubusercontent.com/argoproj/argo-workflows/refs/heads/main/manifests/base/crds/minimal/argoproj.io_workflowtasksets.yaml"
    workflowtemplates        = "https://raw.githubusercontent.com/argoproj/argo-workflows/refs/heads/main/manifests/base/crds/minimal/argoproj.io_workflowtemplates.yaml"
  }
}

data "http" "argo_workflows_crds" {
  for_each = local.argo_workflows_crds
  url      = each.value
}

resource "kubectl_manifest" "argo_workflows_crds" {
  for_each = data.http.argo_workflows_crds

  yaml_body = each.value.response_body
}
