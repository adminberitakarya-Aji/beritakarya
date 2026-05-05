# Panduan Setup Produksi 🚀

Langkah-langkah untuk mendeploy BeritaKarya ke lingkungan produksi (VPS, Docker, atau Cloud).

## 📋 Prasyarat
- Node.js v18+ & PNPM
- PostgreSQL v14+
- Redis (opsional, untuk caching/session skala besar)
- Nginx (sebagai Reverse Proxy)

## 🛠️ Langkah Instalasi

### 1. Konfigurasi Environment
Salin file `.env.production.example` menjadi `.env` di direktori root, `apps/api`, dan `apps/web`.

**Variabel Kritis:**
- `DATABASE_URL`: Koneksi PostgreSQL.
- `JWT_SECRET`: String acak panjang (min 64 karakter).
- `NEXT_PUBLIC_URL`: URL utama frontend (misal: `https://beritakarya.com`).
- `NEXT_PUBLIC_API_URL`: URL backend (misal: `https://api.beritakarya.com`).

### 2. Build Aplikasi
Gunakan Turborepo untuk mem-build seluruh monorepo secara efisien:
```bash
pnpm build
```

### 3. Migrasi Database
Pastikan skema database sinkron:
```bash
cd apps/api
npx prisma db push --accept-data-loss # Gunakan migrate deploy jika sudah ada data sensitif
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
docker-compose -f infra/docker/docker-compose.prod.yml up -d
```

## 🔒 Keamanan Produksi
1. **SSL/TLS**: Wajib menggunakan HTTPS via Nginx (Certbot/LetsEncrypt).
2. **Rate Limiting**: Backend sudah menyertakan rate limiter, pastikan Nginx meneruskan header `X-Forwarded-For`.
3. **Storage**: Pastikan folder `apps/api/uploads` memiliki izin tulis oleh user sistem. Untuk skala besar, disarankan migrasi ke S3-compatible storage.

## 📡 Integrasi Eksternal
- **AI**: Masukkan `OPENAI_API_KEY` untuk mengaktifkan fitur asisten.
- **Komentar**: Daftarkan domain Anda di Disqus atau Hyvor Talk dan masukkan ID-nya di `siteSettings`.
- **Analytics**: Platform sudah memiliki analytics internal, namun Anda tetap bisa menambahkan Google Analytics via `GoogleAnalytics` component.
