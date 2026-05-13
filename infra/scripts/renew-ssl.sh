#!/bin/bash

# SSL Certificate Renewal Script for BeritaKarya
# Usage: ./renew-ssl.sh
# Add to crontab: 0 3 * * * /opt/beritakarya/infra/scripts/renew-ssl.sh

set -e

echo "Checking SSL certificate renewal..."

# Renew certificates using Certbot
certbot renew --quiet --deploy-hook "systemctl reload nginx"

if [ $? -eq 0 ]; then
  echo "✅ SSL renewal completed successfully"
  exit 0
else
  echo "❌ SSL renewal failed"
  exit 1
fi