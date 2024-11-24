# Start Minikube with 2 nodes, 2 CPUs, and 4GB of memory and gpu enabled in the "wsl-cluster" profile
minikube start --nodes 2 --cpus 2 --memory 4096 --gpus all -p wsl-cluster

# Enable necessary addons
minikube addons enable metrics-server -p wsl-cluster
minikube addons enable dashboard -p wsl-cluster
minikube addons enable ingress -p wsl-cluster

# Prompt the user to run the Minikube tunnel
echo "Cluster setup is complete. Run 'minikube tunnel -p wsl-cluster' to start the Minikube tunnel if needed."
