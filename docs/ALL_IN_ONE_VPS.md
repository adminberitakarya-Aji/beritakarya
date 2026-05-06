# Panduan Deploy Backend (API + Database) di VPS 🚀

Panduan ini ditujukan bagi Anda yang ingin menghemat biaya dengan menggabungkan **Express API** dan **PostgreSQL Database** dalam satu VPS menggunakan Docker Compose.

## 📋 Prasyarat
- Sebuah VPS (Ubuntu 20.04/22.04 direkomendasikan).
- Spek minimum: 1 GB RAM (2 GB lebih baik), 1 Core CPU.
- Sudah menginstal Docker & Docker Compose.
  ```bash
  # Cara cepat install Docker di Ubuntu:
  curl -fsSL https://get.docker.com -o get-docker.sh
  sudo sh get-docker.sh
  ```

## 🛠️ Langkah-Langkah Deployment

### 1. Persiapkan Environment
Buat file `.env.production` di direktori root proyek Anda di VPS:

```env
# Database Internal (Docker)
POSTGRES_USER=beritakarya
POSTGRES_PASSWORD=GANTI_DENGAN_PASSWORD_KUAT
POSTGRES_DB=beritakarya_prod

# Koneksi Prisma ke Database Docker (Internal Network)
DATABASE_URL="postgresql://beritakarya:GANTI_DENGAN_PASSWORD_KUAT@postgres:5432/beritakarya_prod"

# JWT & AI
JWT_SECRET=ganti-dengan-string-acak-64-karakter
OPENAI_API_KEY=sk-your-key-here

# Apps Config
WEB_URL=https://beritakarya.co
API_URL=https://api.beritakarya.co
NODE_ENV=production
```

### 2. Jalankan dengan Docker Compose
Gunakan file konfigurasi khusus backend yang sudah saya siapkan:

```bash
# Jalankan API & Database di background
docker compose -f infra/docker/docker-compose.backend.yml --env-file .env.production up -d
```

### 3. Inisialisasi Database (Pertama Kali)
Setelah container berjalan, Anda perlu melakukan push skema database:

```bash
# Masuk ke container API dan jalankan prisma push
docker exec -it beritakarya_api npx prisma db push
```

## 🌐 Ekspos API ke Publik (Nginx)
Agar `api.beritakarya.co` bisa diakses, gunakan Nginx di VPS Anda sebagai reverse proxy:

```nginx
# /etc/nginx/sites-available/api.beritakarya.co
server {
    listen 80;
    server_name api.beritakarya.co;

    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 💰 Kenapa Hemat?
- **Tanpa Supabase**: Database gratis selamanya di VPS sendiri.
- **Tanpa S3 Storage**: Foto disimpan langsung di harddisk VPS (volume `uploads_data`).
- **Tanpa Hosting Tambahan**: Cukup bayar 1 VPS untuk semua urusan backend.

## ⚠️ Tips Maintenance
- **Backup Database**: Jalankan perintah ini secara berkala untuk backup:
  ```bash
  docker exec beritakarya_db pg_dumpall -U beritakarya > backup.sql
  ```
- **Update Kode**: 
  1. `git pull origin main`
  2. `docker compose -f infra/docker/docker-compose.backend.yml up -d --build`
