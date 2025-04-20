# Copy cluster cert to the shared certs folder

cp ~/.minikube/profiles/local-staging/apiserver.crt /mnt/d/github/gitops-lab/certs/local-staging.pem
cp ~/.minikube/profiles/local-staging/apiserver.crt /mnt/d/github/gitops-lab/terraform/local-management/certs/local-staging.pem

create debug pod with:

curl
nslookup
dig
wget
tcpdump
ip, netstat, nc, traceroute

kubectl run debug-pod --image=nicolaka/netshoot --restart=Never -n default -- sleep 3600

enter into pod:

kubectl exec -it debug-pod -n default -- sh

watch pods status:

watch kubectl get pods -n default

delete pod:

kubectl delete pod debug-pod -n default

check connection to management cluster:

curl -v harbor.management.local:8081
curl -vk https://harbor.management.local:44301
nslookup harbor.management.local
dig harbor.management.local

minikube cp /mnt/d/volumes/shared/sample-ai-backend/models/isnet-general-use.pth local-staging:/mnt/d/volumes/shared/sample-ai-backend/models/isnet-general-use.pth -p local-staging -n local-staging

# extract istio cert

kubectl get secret staging-local-tls-secret -n istio-system -o jsonpath='{.data.tls\.crt}' | base64 --decode > istio-ca.crt

kubectl get secret istio-ca-secret -n istio-system -o jsonpath='{.data.root-cert\.pem}' | base64 --decode > istio-root-ca.crt

cat istio-root-ca.crt istio-ca.crt > istio-full-chain.crt

# test if loki working

curl -X POST "http://loki.staging.local/loki/api/v1/push" -H "Content-Type: application/json" --data-raw '{
"streams": [
{
"stream": {
"job": "test",
"level": "info"
},
"values": [
[ "'$(date +%s%N)'", "hello from curl test ?" ]
]
}
]
}'

# minio client usage

# Add your local MinIO server

mc alias set localminio http://api.minio.staging.local minio minio123

# Make sure your model bucket exists

mc mb localminio/triton-model-repo

# Upload the unzipped model

mc cp --recursive ./simple/ localminio/triton-model-repo/
