minikube start \
  --driver docker \
  --network bridge \
  --cpus 2 \
  --nodes 3 \
  --memory 8192 \
  --gpus all \
  --profile local-production

# Copy cluster cert to the shared certs folder
cp ~/.minikube/profiles/local-production/apiserver.crt ~/certs/local-production.pem

minikube addons enable metrics-server -p local-production
minikube addons enable dashboard -p local-production
minikube addons enable storage-provisioner -p local-production
