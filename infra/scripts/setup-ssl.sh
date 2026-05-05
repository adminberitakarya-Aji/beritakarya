#!/bin/bash
set -e

DOMAIN="beritakarya.com"
EMAIL="admin@beritakarya.com"
SSL_DIR="/etc/ssl/beritakarya"

echo "🔐 Setting up Wildcard SSL for *.$DOMAIN..."

# Install certbot
if ! command -v certbot &> /dev/null; then
  apt-get update
  apt-get install -y certbot
fi

# Request wildcard cert via DNS challenge
# Note: Ini membutuhkan interaksi manual atau API provider DNS (Cloudflare, dll)
echo "----------------------------------------------------------------"
echo "PENTING: Kita akan menggunakan DNS-01 challenge untuk wildcard."
echo "Anda akan diminta membuat TXT record di DNS panel Anda."
echo "----------------------------------------------------------------"

certbot certonly --manual \
  --preferred-challenges=dns \
  --email $EMAIL \
  --server https://acme-v02.api.letsencrypt.org/directory \
  --agree-tos \
  -d $DOMAIN -d "*.$DOMAIN"

# Copy/Link to app directory
mkdir -p $SSL_DIR
ln -sf /etc/letsencrypt/live/$DOMAIN/fullchain.pem $SSL_DIR/fullchain.pem
ln -sf /etc/letsencrypt/live/$DOMAIN/privkey.pem $SSL_DIR/privkey.pem

echo "✅ SSL certificates linked to $SSL_DIR"
echo "Jangan lupa restart NGINX: docker compose restart nginx"
