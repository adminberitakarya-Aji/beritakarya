# Panduan Setup Produksi 🚀

Langkah-langkah untuk mendeploy BeritaKarya ke lingkungan produksi (VPS, Docker, atau Cloud).

## 📋 Prasyarat
- Node.js v18+ & PNPM
- PostgreSQL v14+
- Nginx (sebagai Reverse Proxy)

## 🛠️ Langkah Instalasi Manual

### 1. Konfigurasi Environment
Salin file `.env.example` di direktori root, `apps/api`, dan `apps/web`.

**Variabel Kritis:**
- `DATABASE_URL`: Koneksi PostgreSQL.
- `JWT_SECRET`: String acak panjang (min 64 karakter).
- `NEXT_PUBLIC_API_URL`: URL backend (misal: `https://api.beritakarya.co`).
- `OPENAI_API_KEY`: Kunci API untuk fitur asisten AI.

### 2. Build Aplikasi
Gunakan Turborepo untuk mem-build seluruh monorepo:
```bash
pnpm install
pnpm build
```

### 3. Migrasi Database
Sinkronkan skema database:
```bash
# Dari root
pnpm db:push
```

### 4. Menjalankan Service
Anda bisa menggunakan **PM2** untuk mengelola proses Node.js:
```bash
# Menjalankan API
pm2 start apps/api/dist/index.js --name "bk-api"

# Menjalankan Frontend (Next.js)
pm2 start "pnpm run start" --name "bk-web" --cwd "./apps/web"
```

## 🐳 Deployment via Docker (Rekomendasi)
Tersedia konfigurasi `docker-compose.yml` di folder `infra/`.

```bash
docker-compose -f infra/docker/docker-compose.backend.yml up -d
```

## 🔄 CI/CD & Auto-Deployment
Proyek ini mendukung integrasi **GitHub Actions**. Pipeline secara otomatis akan:
1. Menjalankan unit tests & linting.
2. Melakukan build verifikasi.
3. (Opsional) Melakukan deployment ke server via SSH atau Docker Registry.

Pastikan rahasia (`Secrets`) berikut dikonfigurasi di GitHub:
- `DATABASE_URL`
- `SSH_PRIVATE_KEY` (untuk deploy via SSH)
- `DOCKER_PASSWORD` (jika menggunakan Docker Hub)

## 🔒 Keamanan Produksi
1. **SSL/TLS**: Wajib menggunakan HTTPS via Nginx (Certbot/LetsEncrypt).
2. **Rate Limiting**: Backend sudah menyertakan rate limiter, pastikan Nginx meneruskan header `X-Forwarded-For`.
3. **Storage**: Pastikan folder `apps/api/uploads` memiliki izin tulis. Untuk skala besar, disarankan menggunakan S3-compatible storage.

## 📡 Integrasi Eksternal
- **AI**: Masukkan `OPENAI_API_KEY` untuk mengaktifkan asisten.
- **Komentar**: Daftarkan domain di Disqus/Hyvor dan masukkan ID di konfigurasi situs.
- **Analytics**: Gunakan dashboard internal atau tambahkan Google Analytics via component.
- **Frontend Hosting**: Sebagai alternatif PM2/Docker, Anda bisa menggunakan **Vercel** untuk mendeploy `apps/web`. Lihat [Panduan Vercel](./VERCEL_DEPLOYMENT.md).
