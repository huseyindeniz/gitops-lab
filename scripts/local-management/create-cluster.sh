# export NO_PROXY=172.17.0.2,172.17.0.3,172.17.0.4,172.17.0.5,172.17.0.6,172.17.0.7,172.17.0.8,172.17.0.9,172.17.0.10,172.17.0.51

minikube start \
  --driver docker \
  --network bridge \
  --cpus 2 \
  --nodes 3 \
  --memory 8192 \
  --profile local-management

minikube addons enable storage-provisioner -p local-management