openssl s_client -connect core.harbor.domain:443 -showcerts </dev/null 2>/dev/null | openssl x509 -outform PEM > harbor-ca.crt
sudo cp harbor-ca.crt /usr/local/share/ca-certificates/harbor-ca.crt
sudo update-ca-certificates
curl -v https://core.harbor.domain/v2/