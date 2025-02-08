# Get the full server address for local-staging and remove the "https://" part
CLUSTER_API=$(kubectl config view -o jsonpath="{.clusters[?(@.name==\"local-staging\")].cluster.server}" | sed 's|https://||')

echo "local-staging API detected at: $CLUSTER_API"

# Forward to a static port 58002
echo "Forwarding $CLUSTER_API to localhost:58002..."
sudo socat TCP-LISTEN:58002,fork TCP:$CLUSTER_API