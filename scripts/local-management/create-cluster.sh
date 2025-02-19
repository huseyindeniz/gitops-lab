export NO_PROXY=172.17.0.2,172.17.0.3,172.17.0.4,172.17.0.5,172.17.0.6,172.17.0.7,172.17.0.51,172.17.0.101

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