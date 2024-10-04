output "region" {
  description = "AWS region"
  value       = var.region
}

output "cluster_name" {
  description = "K8S Cluster Name"
  value       = module.eks.cluster_name
}
