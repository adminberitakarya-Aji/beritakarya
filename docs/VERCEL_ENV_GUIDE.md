# Environment Variables untuk Vercel Deployment 🚀

## 📋 Arsitektur Sistem

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│   Vercel        │         │   VPS (Docker)  │         │   PostgreSQL    │
│   (Frontend)    │◄────────┤   (Backend API) │◄────────┤   (Database)    │
│   Next.js       │  HTTPS  │   Express/Node  │  TCP    │   Docker        │
└─────────────────┘         └─────────────────┘         └─────────────────┘
```

**Setup BeritaKarya:**
- **Frontend**: Vercel (Next.js)
- **Backend**: VPS dengan Docker (API + PostgreSQL)
- **Database**: PostgreSQL di Docker container

---

## 🔑 Environment Variables untuk Vercel

### Frontend (apps/web) - WAJIB

Inputkan di Vercel Dashboard → Settings → Environment Variables:

| Variable | Value | Deskripsi |
|----------|-------|-----------|
| `NEXT_PUBLIC_API_URL` | `https://api.beritakarya.co/api/v1` | URL API Backend di VPS |
| `NEXT_PUBLIC_URL` | `https://beritakarya.co` | URL utama frontend |
| `NODE_ENV` | `production` | Environment mode |

### Frontend (apps/web) - OPSIONAL

Jika menggunakan fitur tambahan:

| Variable | Value | Deskripsi |
|----------|-------|-----------|
| `NEXT_PUBLIC_GA_ID` | `G-XXXXXXXXXX` | Google Analytics ID |

---

## ⚠️ Variabel yang TIDAK Perlu di Vercel

Variabel berikut **HANYA** diperlukan di Backend (VPS), **JANGAN** input di Vercel:

- ❌ `DATABASE_URL` - Database connection string
- ❌ `DIRECT_URL` - Direct database connection
- ❌ `POSTGRES_USER` - Database username
- ❌ `POSTGRES_PASSWORD` - Database password
- ❌ `POSTGRES_DB` - Database name
- ❌ `JWT_SECRET` - JWT secret key
- ❌ `OPENAI_API_KEY` - OpenAI API key
- ❌ `CORS_ORIGIN` - CORS configuration

**Alasan:** Frontend di Vercel hanya berkomunikasi dengan Backend API di VPS. Database dan sensitive data berada di VPS.

---

## 📝 File .env yang Diperbarui

### 1. `.env.production.example` (Root)
Template lengkap untuk production deployment dengan Docker + VPS.

### 2. `apps/web/.env.example`
Template untuk development frontend (sudah disamakan dengan production example).

### 3. `apps/api/.env`
Konfigurasi backend di VPS (Docker internal network).

---

## 🚀 Langkah Deployment Vercel

### 1. Setup Project di Vercel
1. Buka Vercel Dashboard → New Project
2. Pilih repository `beritakarya`
3. Konfigurasi:
   - **Root Directory**: `apps/web`
   - **Build Command**: `cd ../.. && pnpm build --filter=web`
   - **Install Command**: `cd ../.. && pnpm install`

### 2. Input Environment Variables
Di Vercel Dashboard → Settings → Environment Variables:

```
NEXT_PUBLIC_API_URL=https://api.beritakarya.co/api/v1
NEXT_PUBLIC_URL=https://beritakarya.co
NODE_ENV=production
```

### 3. Setup Domain
1. Tambahkan domain: `beritakarya.co`
2. Tambahkan wildcard: `*.beritakarya.co`
3. Update DNS:
   - **Type**: `CNAME`
   - **Name**: `*`
   - **Value**: `cname.vercel-dns.com`

### 4. Deploy
Klik **Deploy** dan tunggu build selesai.

---

## 🔍 Checklist Sebelum Deployment

- [ ] Backend API sudah berjalan di VPS
- [ ] Database PostgreSQL sudah running di Docker
- [ ] Backend API accessible dari internet (bukan hanya localhost)
- [ ] CORS di backend mengizinkan `https://beritakarya.co` dan `*.beritakarya.co`
- [ ] Firewall VPS mengizinkan traffic dari Vercel
- [ ] Environment variables sudah diinput di Vercel
- [ ] Domain sudah diarahkan ke Vercel

---

## 🐛 Troubleshooting

### Frontend tidak bisa mengakses API
**Masalah:** Error CORS atau connection refused

**Solusi:**
1. Cek CORS configuration di backend (`apps/api/.env` → `CORS_ORIGIN`)
2. Pastikan backend API accessible dari internet:
   ```bash
   curl https://api.beritakarya.co/api/v1/health
   ```
3. Verifikasi firewall VPS mengizinkan port 443/80

### Build gagal di Vercel
**Masalah:** Error saat build

**Solusi:**
1. Cek build logs di Vercel
2. Pastikan `pnpm-lock.yaml` sudah di-commit
3. Verifikasi dependencies di `package.json`

### Multi-tenancy tidak berfungsi
**Masalah:** Subdomain tidak berfungsi

**Solusi:**
1. Pastikan wildcard domain sudah ditambahkan di Vercel
2. Cek DNS configuration untuk `*.beritakarya.co`
3. Verifikasi middleware `apps/web/proxy.ts` sudah aktif

---

## 📚 Dokumentasi Terkait

- [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) - Panduan deployment lengkap
- [PRODUCTION_SETUP.md](./PRODUCTION_SETUP.md) - Setup backend di VPS
- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) - Struktur database

---

## 💡 Tips

1. **Jangan** commit file `.env` yang berisi sensitive data
2. Gunakan `.env.example` sebagai template untuk environment baru
3. Selalu test di preview environment sebelum production
4. Monitor logs di Vercel dan VPS untuk troubleshooting
5. Gunakan environment variables yang berbeda untuk staging dan production