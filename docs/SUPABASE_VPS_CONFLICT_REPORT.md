# 🚨 LAPORAN KONFLIK SUPABASE VS VPS INFRASTRUCTURE

**Tanggal:** 8 Mei 2026  
**Status:** CRITICAL - PERLU PERHATIAN SEGERA  
**Infrastruktur Aktif:** All-in-One VPS (Docker, Nginx, Certbot)

---

## 📊 EXECUTIVE SUMMARY

Ditemukan **6 file** yang masih mengandung referensi ke Supabase, padahal infrastruktur yang digunakan adalah **All-in-One VPS** dengan Docker Compose. Ini dapat menyebabkan:

- ❌ Koneksi database yang salah
- ❌ Bentrok antara konfigurasi Supabase dan VPS
- ❌ Error saat deployment ke VPS
- ❌ Security risk (credentials Supabase ter-expose)

---

## 🔍 FILE YANG MASIH MENGANDUNG REFERENSI SUPABASE

### 1. `.env` (Root Directory)
**Status:** 🔴 CRITICAL  
**Isi:**
```env
# DATABASE — Ganti dengan connection string dari Supabase baru
# Supabase → Settings → Database → Connection string (URI)
# Port 6543 = pooler (untuk app), Port 5432 = direct (untuk migration)
DATABASE_URL="postgresql://postgres.rmaqbqkemocbyrvqxpfi:BeritaKarya6669@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
```

**Masalah:**
- Connection string mengarah ke Supabase, bukan database VPS
- Password ter-expose: `BeritaKarya6669`
- Tidak sesuai dengan infrastruktur VPS yang digunakan

**Solusi:**
```env
# Database Internal (Docker)
POSTGRES_USER=beritakarya
POSTGRES_PASSWORD=GANTI_DENGAN_PASSWORD_KUAT
POSTGRES_DB=beritakarya_prod

# Koneksi Prisma ke Database Docker (Internal Network)
DATABASE_URL="postgresql://beritakarya:GANTI_DENGAN_PASSWORD_KUAT@postgres:5432/beritakarya_prod"
```

---

### 2. `apps/web/.env`
**Status:** 🔴 CRITICAL  
**Isi:**
```env
DATABASE_URL="postgresql://postgres.rmaqbqkemocbyrvqxpfi:BeritaKarya6669@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
```

**Masalah:**
- Sama seperti di atas, mengarah ke Supabase
- Frontend seharusnya tidak memiliki DATABASE_URL (hanya NEXT_PUBLIC_API_URL)

**Solusi:**
```env
# Frontend hanya perlu API URL
NEXT_PUBLIC_API_URL=https://api.beritakarya.co
NEXT_PUBLIC_URL=https://beritakarya.co
```

---

### 3. `apps/api/prisma/supabase-setup.sql`
**Status:** 🟡 WARNING  
**Isi:**
```sql
-- 🗄️ BERITAKARYA — Supabase First-Time Setup
-- ============================================================
-- ⚡ FRESH DATABASE — Jalankan 1x di Supabase SQL Editor
--
-- Langkah:
--   1. Buat project baru di supabase.com
--   2. Buka SQL Editor
--   3. Copy-paste script ini
```

**Masalah:**
- File ini tidak diperlukan untuk infrastruktur VPS
- Bisa membingungkan developer baru
- Menghabiskan space repository

**Solusi:**
- **HAPUS** file ini
- Atau rename menjadi `vps-setup.sql` dan update kontennya untuk VPS

---

### 4. `apps/api/.env.example`
**Status:** 🟡 WARNING  
**Isi:**
```env
# DATABASE — PostgreSQL connection strings (Supabase/Local)
# DATABASE_URL is for the application (pooling supported)
```

**Masalah:**
- Komentar masih menyebutkan Supabase
- Bisa menyesatkan developer

**Solusi:**
```env
# DATABASE — PostgreSQL connection strings (VPS Docker/Local)
# DATABASE_URL is for the application (Docker internal network)
```

---

### 5. `apps/api/.env`
**Status:** 🔴 CRITICAL  
**Isi:**
```env
# DATABASE — Ganti dengan connection string dari Supabase baru
# Supabase → Settings → Database → Connection string (URI)
# Port 6543 = pooler (untuk app), Port 5432 = direct (untuk migration)
DATABASE_URL="postgresql://postgres.rmaqbqkemocbyrvqxpfi:BeritaKarya6669@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.rmaqbqkemocbyrvqxpfi:BeritaKarya6669@aws-1-ap-southeast-1.supabase.com:5432/postgres"
```

**Masalah:**
- Connection string mengarah ke Supabase
- DIRECT_URL juga mengarah ke Supabase
- Password ter-expose

**Solusi:**
```env
# Database Internal (Docker)
POSTGRES_USER=beritakarya
POSTGRES_PASSWORD=GANTI_DENGAN_PASSWORD_KUAT
POSTGRES_DB=beritakarya_prod

# Koneksi Prisma ke Database Docker (Internal Network)
DATABASE_URL="postgresql://beritakarya:GANTI_DENGAN_PASSWORD_KUAT@postgres:5432/beritakarya_prod"
DIRECT_URL="postgresql://beritakarya:GANTI_DENGAN_PASSWORD_KUAT@postgres:5432/beritakarya_prod"

# JWT & AI
JWT_SECRET=ganti-dengan-string-acak-64-karakter
OPENAI_API_KEY=sk-your-key-here

# Apps Config
WEB_URL=https://beritakarya.co
API_URL=https://api.beritakarya.co
NODE_ENV=production
```

---

### 6. `docs/ALL_IN_ONE_VPS.md`
**Status:** ✅ CORRECT  
**Isi:**
```markdown
## 💰 Kenapa Hemat?
- **Tanpa Supabase**: Database gratis selamanya di VPS sendiri.
- **Tanpa S3 Storage**: Foto disimpan langsung di harddisk VPS (volume `uploads_data`).
- **Tanpa Hosting Tambahan**: Cukup bayar 1 VPS untuk semua urusan backend.
```

**Status:** ✅ BAIK  
**Catatan:** Dokumentasi ini sudah benar dan jelas menyatakan TIDAK menggunakan Supabase.

---

## 🎯 REKOMENDASI TINDAKAN

### Prioritas 1: CRITICAL (Segera)

1. **Update semua file `.env`**
   ```bash
   # Hapus atau update file berikut:
   - .env
   - apps/web/.env
   - apps/api/.env
   ```

2. **Hapus file Supabase setup**
   ```bash
   # Hapus file ini:
   rm apps/api/prisma/supabase-setup.sql
   ```

3. **Update `.env.example`**
   ```bash
   # Update file ini:
   apps/api/.env.example
   ```

### Prioritas 2: HIGH (Dalam 24 jam)

4. **Update `.gitignore`**
   ```bash
   # Pastikan file .env tidak ter-commit
   echo ".env" >> .gitignore
   echo "apps/api/.env" >> .gitignore
   echo "apps/web/.env" >> .gitignore
   echo "apps/web/.env.local" >> .gitignore
   ```

5. **Rotate credentials**
   - Ganti password database yang ter-expose
   - Ganti JWT_SECRET
   - Hapus project Supabase yang tidak digunakan

### Prioritas 3: MEDIUM (Dalam 1 minggu)

6. **Update dokumentasi**
   - Pastikan semua dokumentasi konsisten dengan infrastruktur VPS
   - Hapus referensi ke Supabase dari README
   - Tambahkan catatan tentang perbedaan infrastruktur

7. **Update audit report**
   - Update AUDIT_REPORT_BERITAKARYA.md dengan informasi ini
   - Tambahkan section khusus tentang konflik infrastruktur

---

## 📋 CHECKLIST PERBAIKAN

### File yang perlu dihapus:
- [ ] `apps/api/prisma/supabase-setup.sql`

### File yang perlu diupdate:
- [ ] `.env` (root)
- [ ] `apps/web/.env`
- [ ] `apps/api/.env`
- [ ] `apps/api/.env.example`

### File yang perlu dicek:
- [ ] `README.md` - Hapus referensi Supabase
- [ ] `docs/PRODUCTION_SETUP.md` - Update jika ada referensi Supabase
- [ ] `docs/DATABASE_SCHEMA.md` - Update jika ada referensi Supabase

### Security:
- [ ] Rotate database password
- [ ] Rotate JWT_SECRET
- [ ] Hapus project Supabase yang tidak digunakan
- [ ] Update `.gitignore`

---

## 🔐 SECURITY IMPLICATIONS

### Password yang Ter-expose:
- **Database Password:** `BeritaKarya6669`
- **Supabase Project ID:** `rmaqbqkemocbyrvqxpfi`
- **Region:** `aws-1-ap-southeast-1`

### Risiko:
1. **Unauthorized Access** - Siapa saja yang memiliki akses ke repository bisa mengakses database
2. **Data Breach** - Data sensitif bisa dicuri
3. **Service Disruption** - Attacker bisa menghapus atau memodifikasi data

### Tindakan yang Diperlukan:
1. **IMMEDIATE:** Hapus semua credentials dari repository
2. **IMMEDIATE:** Rotate semua passwords dan secrets
3. **IMMEDIATE:** Hapus project Supabase yang tidak digunakan
4. **SHORT-TERM:** Implement secrets management untuk production

---

## 📊 PERBANDINGAN INFRASTRUKTUR

### Supabase (TIDAK DIGUNAKAN)
- ❌ Cloud database service
- ❌ Biaya bulanan
- ❌ Ketergantungan pada third-party
- ❌ Limitasi free tier

### VPS Docker (DIGUNAKAN)
- ✅ Self-hosted database
- ✅ Gratis (sudah termasuk dalam biaya VPS)
- ✅ Full control
- ✅ Unlimited (tergantung resource VPS)
- ✅ Sesuai dengan `docs/ALL_IN_ONE_VPS.md`

---

## 🎯 KESIMPULAN

**Status:** 🔴 CRITICAL - PERLU TINDAKAN SEGERA

Project ini menggunakan infrastruktur **All-in-One VPS** dengan Docker Compose, namun masih terdapat **6 file** yang mengandung referensi ke Supabase. Ini dapat menyebabkan:

1. **Koneksi database yang salah** - Aplikasi akan mencoba koneksi ke Supabase padahal database ada di VPS
2. **Security risk** - Credentials ter-expose di repository
3. **Confusion** - Developer baru bisa bingung dengan infrastruktur yang digunakan

**Tindakan yang Diperlukan:**
1. Hapus/update semua file `.env` yang mengarah ke Supabase
2. Hapus file `supabase-setup.sql`
3. Update dokumentasi untuk konsisten dengan infrastruktur VPS
4. Rotate semua credentials yang ter-expose
5. Update `.gitignore` untuk mencegah commit file `.env`

**Timeline:**
- **IMMEDIATE (1-2 jam):** Update semua file `.env` dan hapus file Supabase
- **TODAY (24 jam):** Rotate credentials dan update `.gitignore`
- **THIS WEEK (7 hari):** Update dokumentasi dan audit report

---

**© 2026 BeritaKarya Global Media. All Rights Reserved.**
*Confidential - Internal Use Only*