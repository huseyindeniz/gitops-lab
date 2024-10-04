provider "azurerm" {
  subscription_id = var.subscriptionId
  features {}
}

locals {
  cluster_name = "aksdemo"
}

resource "azurerm_resource_group" "default" {
  name     = "${local.cluster_name}-rg"
  location = "East US"

  tags = {
    environment = "Demo"
  }
}

resource "azurerm_kubernetes_cluster" "default" {
  name                = local.cluster_name
  location            = azurerm_resource_group.default.location
  resource_group_name = azurerm_resource_group.default.name
  dns_prefix          = "${local.cluster_name}-k8s"
  kubernetes_version  = "1.29.8"

  default_node_pool {
    name            = "default"
    node_count      = 2
    vm_size         = "standard_b2s"
    os_disk_size_gb = 30
  }

  service_principal {
    client_id     = var.appId
    client_secret = var.password
  }

  role_based_access_control_enabled = true

  tags = {
    environment = "Demo"
  }
}

resource "azurerm_kubernetes_cluster_node_pool" "additional" {
  name                  = "two"
  kubernetes_cluster_id = azurerm_kubernetes_cluster.default.id
  vm_size               = "standard_b2ms"
  node_count            = 2
  os_disk_size_gb       = 30
}

data "azurerm_kubernetes_cluster" "credentials" {
  name                = azurerm_kubernetes_cluster.default.name
  resource_group_name = azurerm_resource_group.default.name
}
