# Get the full server address for local-management and remove the "https://" part
CLUSTER_API=$(kubectl config view -o jsonpath="{.clusters[?(@.name==\"local-management\")].cluster.server}" | sed 's|https://||')

echo "local-management API detected at: $CLUSTER_API"

# Forward to a static port 58001
echo "Forwarding $CLUSTER_API to localhost:58001..."
sudo socat TCP-LISTEN:58001,fork TCP:$CLUSTER_API