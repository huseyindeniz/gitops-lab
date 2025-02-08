# Get the full server address for local-production and remove the "https://" part
CLUSTER_API=$(kubectl config view -o jsonpath="{.clusters[?(@.name==\"local-production\")].cluster.server}" | sed 's|https://||')

echo "local-production API detected at: $CLUSTER_API"

# Forward to a static port 58003
echo "Forwarding $CLUSTER_API to localhost:58003..."
sudo socat TCP-LISTEN:58003,fork TCP:$CLUSTER_API