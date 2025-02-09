minikube start \
  --driver docker \
  --network bridge \
  --cpus 2 \
  --nodes 3 \
  --memory 8192 \
  --profile local-management

# Copy cluster cert to the shared certs folder
cp ~/.minikube/profiles/local-management/apiserver.crt ~/certs/local-management.pem

minikube addons enable metrics-server -p local-management
minikube addons enable dashboard -p local-management
minikube addons enable storage-provisioner -p local-management
