#!/bin/bash

# Start Minikube
minikube start

# Enable necessary addons
minikube addons enable metrics-server
minikube addons enable dashboard
minikube addons enable ingress

# Start the Minikube tunnel and keep it running in the foreground
echo "Starting Minikube tunnel... (Keep this terminal open)"
minikube tunnel
