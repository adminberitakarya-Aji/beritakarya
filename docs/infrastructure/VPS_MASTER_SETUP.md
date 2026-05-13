# 🚀 BeritaKarya — VPS Master Deployment Guide
> **Version**: 1.0 (Final) | **Status**: Production Ready

Panduan ini adalah satu-satunya referensi untuk melakukan deployment ulang dari nol (Clean Install) di VPS DigitalOcean.

---

## 🛠️ Langkah 1: Persiapan VPS (Clean Up)
Hapus semua konfigurasi lama agar tidak ada konflik port atau sisa data.

```bash
# 1. Matikan semua kontainer Docker
docker stop $(docker ps -aq)
docker rm $(docker ps -aq)
docker network prune -f
docker volume prune -f

# 2. Hapus config Nginx lama
sudo rm -f /etc/nginx/sites-enabled/*
sudo rm -f /etc/nginx/sites-available/api.beritakarya.co

# 3. Siapkan folder media dengan izin yang benar
sudo mkdir -p /opt/beritakarya/uploads
sudo chown -R 1001:1001 /opt/beritakarya/uploads
sudo chmod 755 /opt/beritakarya/uploads
```

---

## 📦 Langkah 2: Deployment Backend (Docker)

1.  **Clone / Pull Kode**:
    ```bash
    cd ~/beritakarya
    git pull origin main
    ```

2.  **Siapkan Environment**:
    Pastikan file `.env.production` di root folder berisi:
    - `DATABASE_URL=postgresql://beritakarya:PASSWORD_ANDA@postgres:5432/beritakarya`
    - `JWT_SECRET=MINIMAL_32_KARAKTER_YANG_SANGAT_KUAT`
    - `API_URL=https://api.beritakarya.co`

3.  **Jalankan Docker**:
    ```bash
    docker compose -f infra/docker/docker-compose.backend.yml up -d --build
    ```

---

## 🌐 Langkah 3: Setup Nginx (Host-Level)

1.  **Buat Konfigurasi**:
    `sudo nano /etc/nginx/sites-available/api.beritakarya.co`

2.  **Tempel Kode Berikut**: (Gunakan versi final yang sudah tanpa double-header CORS)

```nginx
    # (Gunakan konfigurasi Nginx dari FULL_PROJECT_DOCUMENTATION.md)
```

---

## 🔒 Langkah 4: SSL (Certbot)
```bash
sudo certbot --nginx -d api.beritakarya.co
```

---

## ✅ Langkah 5: Verifikasi
```bash
curl https://api.beritakarya.co/health
```
Jika membalas `{"status":"healthy"}`, maka setup sukses!
