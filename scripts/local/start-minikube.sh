# Start Minikube with 3 nodes, 2 CPUs, and 8GB of memory in the "local-cluster" profile
# wsl-cluster will be added to the argocd that installed on this local-cluster
# because of this network is bridge
minikube start --nodes 3 --cpus 2 --memory 8192 --profile local-cluster --network bridge

# Enable necessary addons
minikube addons enable metrics-server -p local-cluster
minikube addons enable dashboard -p local-cluster
minikube addons enable ingress -p local-cluster
minikube addons enable storage-provisioner -p local-cluster

# Prompt the user to run the Minikube tunnel
echo "Cluster setup is complete."
echo "Run 'minikube tunnel -p local-cluster' to start the Minikube tunnel if needed."
echo "Run 'minikube dashboard -p local-cluster' to access kubernetes dashboard"
