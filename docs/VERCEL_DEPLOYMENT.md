# Panduan Deployment ke Vercel (Frontend) 🚀

Dokumen ini menjelaskan cara mendeploy aplikasi frontend (Next.js) BeritaKarya ke Vercel dalam lingkungan monorepo.

## 📋 Arsitektur Deployment

**Setup BeritaKarya:**
- **Frontend**: Vercel (Next.js)
- **Backend**: VPS dengan Docker (API + PostgreSQL)
- **Database**: PostgreSQL di Docker container

## 📋 Prasyarat
- Akun Vercel yang terhubung ke GitHub/GitLab
- Domain utama (misal: `beritakarya.co`) sudah diarahkan ke Vercel
- Backend API sudah berjalan di VPS (lihat [PRODUCTION_SETUP.md](./PRODUCTION_SETUP.md))

## 🛠️ Langkah-Langkah Deployment

### 1. Hubungkan Repositori
1. Di Dashboard Vercel, klik **New Project**
2. Pilih repositori `beritakarya`
3. Pada bagian **Project Settings**:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: `apps/web`
   - **Build Command**: `cd ../.. && pnpm build --filter=web` (Sudah terkonfigurasi di `vercel.json`)
   - **Install Command**: `cd ../.. && pnpm install`

### 2. Konfigurasi Environment Variables
Buka tab **Environment Variables** dan tambahkan variabel berikut:

| Key | Value (Contoh) | Deskripsi |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `https://api.beritakarya.co/api/v1` | URL API Backend di VPS |
| `NEXT_PUBLIC_URL` | `https://beritakarya.co` | URL utama frontend |
| `NODE_ENV` | `production` | Environment mode |

**Catatan:** Frontend di Vercel hanya membutuhkan URL API backend. Database berada di VPS dan diakses melalui backend API.

### 3. Konfigurasi Multi-Tenancy (Wildcard Domain)
Agar portal daerah (misal: `bandung.beritakarya.co`) dapat berjalan:
1. Buka **Settings > Domains** di project Vercel
2. Tambahkan domain utama: `beritakarya.co`
3. Tambahkan **Wildcard Domain**: `*.beritakarya.co`
4. Di panel DNS penyedia domain Anda, tambahkan record:
   - **Type**: `CNAME`
   - **Name**: `*`
   - **Value**: `cname.vercel-dns.com`

### 4. Aktivasi Middleware Multi-Tenant
Pastikan file `apps/web/proxy.ts` digunakan sebagai middleware utama. Jika belum ada file `apps/web/middleware.ts`, Anda bisa membuatnya dengan isi:

```typescript
// apps/web/middleware.ts
export { proxy as default } from './proxy'
```

Atau rename `proxy.ts` menjadi `middleware.ts` jika Anda lebih suka standar Next.js.

## 🔄 Turborepo Remote Caching (Opsional)
Untuk mempercepat build di Vercel, Anda bisa mengaktifkan Remote Caching:
1. Jalankan `npx turbo login` di lokal
2. Jalankan `npx turbo link`
3. Vercel akan otomatis mendeteksi token jika terhubung dalam tim yang sama

## ⚠️ Catatan Penting

### Backend & Database
- **API Backend**: Vercel hanya menghosting Frontend. Backend API dan Database berjalan di VPS dengan Docker
- **CORS Configuration**: Pastikan backend di VPS mengizinkan request dari domain Vercel (`https://beritakarya.co` dan `*.beritakarya.co`)
- **Database Access**: Database tidak diakses langsung dari Vercel, melainkan melalui API backend di VPS

### Environment Variables
- Frontend hanya membutuhkan `NEXT_PUBLIC_API_URL` untuk berkomunikasi dengan backend
- Variabel database (`DATABASE_URL`, `DIRECT_URL`) hanya diperlukan di backend (VPS)
- `JWT_SECRET` hanya diperlukan di backend untuk validasi token

### Troubleshooting
- Jika frontend tidak bisa mengakses API, cek CORS configuration di backend
- Pastikan backend API di VPS accessible dari internet (bukan hanya localhost)
- Verifikasi firewall di VPS mengizinkan traffic dari Vercel
