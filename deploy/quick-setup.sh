#!/bin/bash
#
# Quick setup script - Downloads and runs the main setup script
# 
# Usage on fresh droplet:
# curl -sSL https://raw.githubusercontent.com/evolvesystems/audiotricks/main/deploy/quick-setup.sh | bash
#

echo "Downloading AudioTricks setup script..."
wget https://raw.githubusercontent.com/evolvesystems/audiotricks/main/deploy/setup-droplet.sh
chmod +x setup-droplet.sh
./setup-droplet.sh