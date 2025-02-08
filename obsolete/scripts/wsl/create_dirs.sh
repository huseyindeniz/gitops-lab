#!/bin/bash

# Define base directory
BASE_DIR="/mnt/h/volumes"

# Create necessary directories
echo "Creating directories for sample-ai-backend..."
sudo mkdir -p "$BASE_DIR/sample-ai-backend"
sudo mkdir -p "$BASE_DIR/sample-ai-backend/models"
sudo mkdir -p "$BASE_DIR/sample-ai-backend/outputs"
sudo mkdir -p "$BASE_DIR/sample-ai-backend/uploads"

# Set permissions and ownership
echo "Setting permissions and ownership..."
sudo chmod -R 755 "$BASE_DIR/sample-ai-backend"

echo "Setup completed!"
