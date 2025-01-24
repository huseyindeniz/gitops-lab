#!/bin/bash

echo "Copying the script file from host to Minikube..."
minikube cp "./create_dirs.sh" "/mnt/h/" -p wsl-cluster

minikube ssh "bash -s < /mnt/h/create_dirs.sh; exit" -p wsl-cluster

MODEL_FILE_SOURCE="/mnt/h/volumes/sample-ai-backend/models/isnet-general-use.pth"
MINIKUBE_DEST_PATH="/mnt/h/volumes/sample-ai-backend/models/isnet-general-use.pth"

echo "Copying model file from host to Minikube..."
minikube cp "$MODEL_FILE_SOURCE" "$MINIKUBE_DEST_PATH" -p wsl-cluster

echo "Verifying the file copy..."
minikube ssh "ls -l $MINIKUBE_DEST_PATH" -p wsl-cluster
