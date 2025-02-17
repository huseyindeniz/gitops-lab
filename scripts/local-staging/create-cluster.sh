minikube start \
  --driver docker \
  --network bridge \
  --cpus 2 \
  --nodes 3 \
  --memory 8192 \
  --gpus all \
  --profile local-staging

minikube addons enable metrics-server -p local-staging
minikube addons enable dashboard -p local-staging
minikube addons enable storage-provisioner -p local-staging
