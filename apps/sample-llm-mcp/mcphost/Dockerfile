# syntax=docker/dockerfile:1

FROM alpine:latest

# ARGs for flexible build
ARG MCPHOST_VERSION=v0.7.1

RUN apk add --no-cache wget ca-certificates tar

# Download and extract the mcphost binary
RUN wget -O /tmp/mcphost.tar.gz https://github.com/mark3labs/mcphost/releases/download/${MCPHOST_VERSION}/mcphost_Linux_x86_64.tar.gz \
    && tar -xzf /tmp/mcphost.tar.gz -C /usr/local/bin mcphost \
    && chmod +x /usr/local/bin/mcphost \
    && rm /tmp/mcphost.tar.gz
    
WORKDIR /app

# Only set ENTRYPOINT (no CMD)
ENTRYPOINT ["/usr/local/bin/mcphost"]