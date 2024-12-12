resource "argocd_cluster" "wsl_cluster" {
  name   = "wsl-cluster-local"
  server = "https://172.17.0.5:8443"

  config {
    bearer_token = var.wsl_cluster_bearer_token

    tls_client_config {
      // ca_data = file("path/to/ca.pem")
      ca_data = file("certs/wsl-ca.pem")
      // ca_data = "-----BEGIN CERTIFICATE-----\nfoo\nbar\n-----END CERTIFICATE-----"
      // ca_data = base64decode("LS0tLS1CRUdJTiBDRVJUSUZ...")
      // insecure = true
    }
  }
}
