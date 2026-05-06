# Panduan Deploy Backend (API + Database) di VPS 🚀

Panduan ini ditujukan bagi Anda yang ingin menghemat biaya dengan menggabungkan **Express API** dan **PostgreSQL Database** dalam satu VPS menggunakan Docker Compose.

## 📋 Persiapan Server (Instalasi Alat)

Sebelum mendeploy, Anda perlu menginstal 4 alat utama di VPS Anda (Ubuntu 22.04):

### 1. Docker & Docker Compose (Wajib)
Ini adalah jantung dari sistem Anda. Docker akan menjalankan Database dan API secara otomatis tanpa Anda perlu menginstal Node.js atau PostgreSQL secara manual di sistem utama.
```bash
# Cara cepat install Docker di Ubuntu:
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
```

### 2. Git (Wajib)
Untuk mengambil/menarik kode proyek Anda dari GitHub ke dalam VPS dengan rapi dan mudah diupdate.
```bash
sudo apt update
sudo apt install git -y
```

### 3. Nginx (Wajib untuk Online)
Nginx bertugas sebagai "satpam" di depan. Dia yang menerima tamu dari internet (`api.beritakarya.co`) dan meneruskannya ke dalam aplikasi di dalam Docker.
```bash
sudo apt install nginx -y
```

### 4. Certbot (Wajib untuk HTTPS/SSL)
Agar API Anda aman (menggunakan `https://`). Ini wajib agar frontend Vercel bisa berkomunikasi dengan aman ke backend Anda.
```bash
sudo apt install certbot python3-certbot-nginx -y
```

---

## 🔄 Ringkasan Urutan Kerja Deployment
1. **Sewa VPS** (Ubuntu 22.04).
2. **Login via SSH** ke VPS tersebut.
3. **Instal 4 alat di atas** (Docker, Git, Nginx, Certbot).
4. **Clone Repo**: `git clone https://github.com/username/beritakarya.git` (Ganti dengan link repo Anda).
5. **Setup .env**: Buat file `.env.production` sesuai panduan di bawah.
6. **Jalankan Docker**: `docker compose -f infra/docker/docker-compose.backend.yml --env-file .env.production up -d`.
7. **Setup SSL**: Jalankan `sudo certbot --nginx -d api.beritakarya.co`.

**Keuntungan**: Anda **TIDAK PERLU** menginstal Node.js, NPM, atau PostgreSQL secara manual di VPS, karena semuanya sudah dibungkus rapi di dalam Docker. Ini menjaga VPS Anda tetap bersih dan ringan.

---

## 🛠️ Langkah-Langkah Detail Deployment

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

## 🌐 Cara Mendapatkan & Mengatur API URL

Setelah Anda memiliki VPS, alur untuk mendapatkan API URL sangat sederhana:

### 1. Tentukan Subdomain
Anda tentukan sendiri namanya, yang paling umum adalah: `api.beritakarya.co`

### 2. Hubungkan ke IP VPS (di Namecheap)
1. Login ke **Namecheap**.
2. Buka menu **Advanced DNS**.
3. Tambahkan **A Record**:
   - **Host**: `api`
   - **Value**: Masukkan **IP VPS Anda** (Contoh: `103.22.xx.xx`).

### 3. Aktifkan HTTPS (di VPS)
Setelah Anda menjalankan perintah Certbot di VPS (`sudo certbot --nginx -d api.beritakarya.co`), maka subdomain tersebut resmi menjadi:
👉 **`https://api.beritakarya.co`**

---

### Di mana URL ini dimasukkan?
Anda perlu memasukkan URL `https://api.beritakarya.co` tersebut di **dua tempat**:

1.  **Di Vercel (Frontend)**: Masukkan di Environment Variables sebagai `NEXT_PUBLIC_API_URL`.
2.  **Di VPS (Backend)**: Masukkan di file `.env.production` sebagai `API_URL`.

**Kesimpulannya**: API URL adalah alamat "pintu masuk" ke backend Anda yang sudah diamankan dengan SSL (HTTPS). Alamat ini Anda buat sendiri lewat Namecheap dan diaktifkan lewat VPS.

---

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
