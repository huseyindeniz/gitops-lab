docker network create \
  --driver=bridge \
  --subnet=172.19.0.0/24 \
  --gateway=172.19.0.1 \
  local_network