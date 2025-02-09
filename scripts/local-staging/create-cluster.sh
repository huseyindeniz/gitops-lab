minikube start \
  --driver docker \
  --network bridge \
  --cpus 2 \
  --nodes 3 \
  --memory 8192 \
  --gpus all \
  --profile local-staging

# Copy cluster cert to the shared certs folder
cp ~/.minikube/profiles/local-staging/apiserver.crt ~/certs/local-staging.pem

minikube addons enable metrics-server -p local-staging
minikube addons enable dashboard -p local-staging
minikube addons enable storage-provisioner -p local-staging
