# Start Minikube with 2 nodes, 2 CPUs, and 4GB of memory in the "local-cluster" profile
minikube start --nodes 2 --cpus 2 --memory 4096 --profile local-cluster --network bridge

# Enable necessary addons
minikube addons enable metrics-server -p local-cluster
minikube addons enable dashboard -p local-cluster
minikube addons enable ingress -p local-cluster

# Prompt the user to run the Minikube tunnel
echo "Cluster setup is complete. Run 'minikube tunnel -p local-cluster' to start the Minikube tunnel if needed."
