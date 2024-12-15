# Start Minikube with 2 nodes, 2 CPUs, and 4GB of memory and gpu enabled in the "wsl-cluster" profile
# this cluster will be added to the argocd that installed on local-cluster
# because of this network is bridge
minikube start --nodes 3 --cpus 2 --memory 8192 --gpus all --profile wsl-cluster --driver docker --network bridge

# Enable necessary addons
minikube addons enable metrics-server -p wsl-cluster
minikube addons enable yakd -p wsl-cluster
minikube addons enable ingress -p wsl-cluster

# Prompt the user to run the Minikube tunnel
echo "Cluster setup is complete."
echo "Run 'minikube tunnel -p wsl-cluster' to start the Minikube tunnel if needed."
echo "Run 'minikube service yakd-dashboard -n yakd-dashboard -p wsl-cluster' to access yakd dashboard"

# kubectl port-forward --address=0.0.0.0 --context=wsl-cluster pod/kube-apiserver-wsl-cluster 6443:8443 -n kube-system

