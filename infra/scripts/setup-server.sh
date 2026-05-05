#!/bin/bash
set -e

echo "🔧 Setup BeritaKarya Server..."

# ── Update system ──────────────────────────────────────────
apt-get update -y
apt-get upgrade -y
apt-get install -y curl wget git ufw fail2ban

# ── Install Docker ─────────────────────────────────────────
if ! command -v docker &> /dev/null; then
  echo "📦 Installing Docker..."
  curl -fsSL https://get.docker.com | sh
  usermod -aG docker $SUDO_USER
fi

# ── Install Docker Compose ─────────────────────────────────
if ! command -v docker compose &> /dev/null; then
  echo "📦 Installing Docker Compose plugin..."
  apt-get install -y docker-compose-plugin
fi

# ── Firewall ───────────────────────────────────────────────
echo "🔒 Configuring UFW firewall..."
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# ── Fail2ban ───────────────────────────────────────────────
echo "🛡 Configuring fail2ban..."
systemctl enable fail2ban
systemctl start fail2ban

# ── App directories ────────────────────────────────────────
echo "📁 Creating app directories..."
mkdir -p /opt/beritakarya
mkdir -p /opt/beritakarya/infra
mkdir -p /backups
mkdir -p /var/log/beritakarya

chown -R $SUDO_USER:$SUDO_USER /opt/beritakarya
chown -R $SUDO_USER:$SUDO_USER /backups

# ── Swap (untuk VPS kecil) ─────────────────────────────────
if [ ! -f /swapfile ]; then
  echo "💾 Creating 2GB swapfile..."
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

# ── Log rotation ───────────────────────────────────────────
cat > /etc/logrotate.d/beritakarya << 'EOF'
/var/log/beritakarya/*.log {
  daily
  rotate 14
  compress
  delaycompress
  missingok
  notifempty
}
EOF

echo ""
echo "✅ Server setup selesai!"
echo "Next: upload project ke /opt/beritakarya dan jalankan deploy.sh"
