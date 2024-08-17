# providers.tf for shared providers config

provider "kubernetes" {
  config_path    = var.kubeconfig_path
  config_context = "minikube"
}

provider "helm" {
  kubernetes {
    config_path = var.kubeconfig_path
  }
}

