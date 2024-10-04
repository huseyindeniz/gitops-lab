data "google_client_config" "default" {}

locals {
  cluster_name = "gkedemo"
}

resource "google_container_cluster" "primary" {
  name                     = local.cluster_name
  project                  = var.project
  location                 = var.region
  remove_default_node_pool = true
  initial_node_count       = 1
  node_config {
    disk_size_gb = 30
  }

  networking_mode = "VPC_NATIVE"
  ip_allocation_policy {}

}

resource "google_container_node_pool" "primary_nodes" {
  project    = var.project
  name       = "${google_container_cluster.primary.name}-node-pool"
  location   = var.region
  cluster    = google_container_cluster.primary.name
  node_count = 1


  node_config {
    oauth_scopes = [
      "https://www.googleapis.com/auth/logging.write",
      "https://www.googleapis.com/auth/monitoring",
    ]

    labels = {
      env = var.project
    }

    machine_type = "e2-small"
    tags         = ["gke-node", "${var.project}-gke"]
    disk_size_gb = 30
    metadata = {
      disable-legacy-endpoints = "true"
    }
  }
}

resource "google_container_node_pool" "secondary_nodes" {
  project    = var.project
  name       = "secondary-node-pool"
  location   = var.region
  cluster    = google_container_cluster.primary.name
  node_count = 1

  node_config {
    oauth_scopes = [
      "https://www.googleapis.com/auth/logging.write",
      "https://www.googleapis.com/auth/monitoring",
    ]

    labels = {
      env = var.project
    }


    machine_type = "e2-medium"
    tags         = ["gke-node", "${var.project}-gke"]
    disk_size_gb = 30
    metadata = {
      disable-legacy-endpoints = "true"
    }
  }
}
