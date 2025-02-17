minikube start \
  --driver docker \
  --network bridge \
  --cpus 2 \
  --nodes 3 \
  --memory 8192 \
  --profile local-management

minikube addons enable metrics-server -p local-management
minikube addons enable dashboard -p local-management
minikube addons enable storage-provisioner -p local-management
