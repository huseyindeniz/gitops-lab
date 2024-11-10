# # Start Minikube with 3 nodes, 4 CPUs, and 8GB of memory in the "test-cluster" profile
minikube start --nodes 3 --cpus 4 --memory 8192 -p test-cluster

# Enable necessary addons
minikube addons enable metrics-server -p test-cluster
minikube addons enable dashboard -p test-cluster
minikube addons enable ingress -p test-cluster

# Prompt the user to run the Minikube tunnel
echo "Cluster setup is complete. Run 'minikube tunnel -p test-cluster' to start the Minikube tunnel if needed."
