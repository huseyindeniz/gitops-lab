#!/bin/bash

# Define cluster details
declare -A cluster_data=(
  ["local-management"]="58001 $HOME/certs/local-management.crt"
  ["local-staging"]="58002 $HOME/certs/local-staging.crt"
  ["local-production"]="58003 $HOME/certs/local-production.crt"
)

# Check if cluster name is provided
if [ -z "$1" ]; then
  echo "Usage: $0 <cluster_name>"
  echo "Available clusters: ${!cluster_data[*]}"
  exit 1
fi

cluster_name=$1

# Validate cluster name
if [[ -z "${cluster_data[$cluster_name]}" ]]; then
  echo "Invalid cluster name: $cluster_name"
  echo "Available clusters: ${!cluster_data[*]}"
  exit 1
fi

# Extract port and cert path
read -r port cert_path <<<"${cluster_data[$cluster_name]}"

echo "Checking if $cluster_name is reachable on port $port with cert $cert_path"

# Perform the request and capture response
response=$(curl -s --cacert "$cert_path" "https://localhost:$port/api/v1/namespaces")

echo $response

# Check for a successful connection
if [[ "$response" == *"\"code\": 200"* ]] || [[ "$response" == *"\"code\": 403"* ]]; then
  echo "$cluster_name connection is OK (200 or 403)"
else
  echo "$cluster_name connection FAILED."
fi
