# 📋 RENCANA KERJA EKSEKUSI AUDIT

**Tanggal Dibuat:** 11 Mei 2026  
**Berdasarkan:** Comprehensive Audit Report & Image Upload Failure Analysis  
**Target Selesai:** 11 Juni 2026 (30 hari)

---

## 🎯 TUJUAN UTAMA

1. **Menyelesaikan semua masalah KRITIS** sebelum deployment produksi
2. **Memperbaiki fungsionalitas upload gambar** yang rusak
3. **Memperkuat keamanan** platform secara keseluruhan
4. **Menstandarkan proses deployment** untuk konsistensi

---

## 📊 PRIORITAS MASALAH

### 🔴 KRITIS (Harus Selesai dalam 24 Jam)

| # | Masalah | Dampak | Estimasi Waktu |
|---|--------|--------|---------------|
| 1 | Missing `middleware.ts` | Multi-tenant routing rusak total | 5 menit |
| 2 | Eksposur port Docker | API dapat diakses tanpa Nginx | 10 menit |
| 3 | Error 500 upload gambar | Upload gambar gagal total | 1-2 jam |

### 🟡 TINGGI (Harus Selesai dalam 1 Minggu)

| # | Masalah | Dampak | Estimasi Waktu |
|---|--------|--------|---------------|
| 4 | Konfigurasi Nginx error | Header tidak terkirim | 30 menit |
| 5 | Validasi environment | Runtime error potensial | 2 jam |
| 6 | Header keamanan CSP | Postur keamanan tidak konsisten | 1 jam |
| 7 | Perpanjangan SSL otomatis | Sertifikat kedaluwarsa 90 hari | 3 jam |

### 🟢 SEDANG (Harus Selesai dalam 1 Bulan)

| # | Masalah | Dampak | Estimasi Waktu |
|---|--------|--------|---------------|
| 8 | Penyimpanan token | Rentan XSS | 4 jam |
| 9 | Optimasi database | Performa lambat | 6 jam |
| 10 | Coverage tes | Bug di produksi | 16 jam |
| 11 | Kebingungan Docker Compose | Deployment salah | 1 jam |

### 🔵 RENDAH (Bisa Ditunda)

| # | Masalah | Dampak | Estimasi Waktu |
|---|--------|--------|---------------|
| 12 | Indeks database | Query lambat | 2 jam |
| 13 | Retensi data | Database bloat | 4 jam |
| 14 | Aturan ESLint | Kualitas kode | 2 jam |
| 15 | Dokumentasi kedaluwarsa | Kebingungan | 3 jam |

---

## 🗓️ TIMELINE IMPLEMENTASI

### MINGGU 1 (11-17 Mei 2026) - FASE KRITIS

#### Hari 1: 11 Mei 2026 (Hari Ini)
- [x] Audit comprehensive selesai
- [x] Analisis kegagalan upload gambar selesai
- [ ] **TUGAS HARI INI:**
  - [x] Buat `apps/web/middleware.ts` (5 menit)
  - [x] Perbaiki eksposur port Docker (10 menit)
  - [x] Investigasi dan perbaiki error 500 upload gambar (1-2 jam)
  - [ ] Tes upload gambar setelah perbaikan (30 menit)

#### Hari 2: 12 Mei 2026
- [ ] Perbaiki konfigurasi Nginx (30 menit)
- [ ] Perbaiki typo domain staging (15 menit)
- [ ] Tes semua konfigurasi Nginx (30 menit)
- [ ] Implementasikan validasi environment (2 jam)
- [ ] Tes validasi di semua environment (1 jam)

#### Hari 3: 13 Mei 2026
- [ ] Perkuat header keamanan CSP (1 jam)
- [ ] Terapkan CSP di semua environment (30 menit)
- [ ] Implementasikan pelaporan CSP (1 jam)
- [ ] Setup monitoring sertifikat SSL (1 jam)

#### Hari 4: 14 Mei 2026
- [ ] Implementasikan perpanjangan SSL otomatis (2 jam)
- [ ] Setup Certbot DNS plugin (1 jam)
- [ ] Tes perpanjangan otomatis (30 menit)
- [ ] Dokumentasikan proses SSL (30 menit)

#### Hari 5: 15 Mei 2026
- [ ] Hapus file Docker Compose deprecated (15 menit)
- [ ] Dokumentasikan file mana yang digunakan (30 menit)
- [ ] Tambahkan script validasi (1 jam)
- [ ] Review dan update dokumentasi (1 jam)

#### Hari 6-7: 16-17 Mei 2026
- [ ] Testing komprehensif semua perbaikan
- [ ] Bug fixing jika ditemukan
- [ ] Dokumentasi perubahan
- [ ] Persiapan deployment staging

### MINGGU 2 (18-24 Mei 2026) - FASE KEAMANAN

#### Hari 8-9: 18-19 Mei 2026
- [ ] Migrasi token ke httpOnly cookies (4 jam)
- [ ] Implementasikan rotasi token (2 jam)
- [ ] Tambahkan perlindungan CSRF (2 jam)
- [ ] Tes autentikasi baru (2 jam)

#### Hari 10-11: 20-21 Mei 2026
- [ ] Tambahkan indeks database yang hilang (2 jam)
- [ ] Implementasikan kebijakan retensi data (3 jam)
- [ ] Setup job cleanup terjadwal (1 jam)
- [ ] Tes performa database (2 jam)

#### Hari 12-13: 22-23 Mei 2026
- [ ] Aktifkan enkripsi PostgreSQL at rest (2 jam)
- [ ] Implementasikan enkripsi tingkat kolom (2 jam)
- [ ] Setup TLS untuk koneksi database (1 jam)
- [ ] Tes keamanan database (1 jam)

#### Hari 14: 24 Mei 2026
- [ ] Review keamanan minggu ini
- [ ] Update dokumentasi keamanan
- [ ] Persiapan deployment ke staging

### MINGGU 3 (25-31 Mei 2026) - FASE PENGUJIAN

#### Hari 15-17: 25-27 Mei 2026
- [ ] Tingkatkan coverage tes ke 80%+ (8 jam)
- [ ] Tambahkan tes integrasi (4 jam)
- [ ] Implementasikan tes E2E dengan Playwright (4 jam)
- [ ] Setup pipeline tes otomatis (2 jam)

#### Hari 18-19: 28-29 Mei 2026
- [ ] Implementasikan pipeline deployment otomatis (4 jam)
- [ ] Tambahkan kemampuan rollback (2 jam)
- [ ] Implementasikan deployment blue-green (2 jam)
- [ ] Tes deployment otomatis (2 jam)

#### Hari 20-21: 30-31 Mei 2026
- [ ] Setup monitoring performa (APM) (3 jam)
- [ ] Implementasikan sistem alert (2 jam)
- [ ] Setup monitoring uptime (1 jam)
- [ ] Tes monitoring dan alert (2 jam)

### MINGGU 4 (1-7 Juni 2026) - FASE FINALISASI

#### Hari 22-23: 1-2 Juni 2026
- [ ] Review semua perbaikan
- [ ] Testing komprehensif end-to-end
- [ ] Load testing untuk skalabilitas
- [ ] Security audit final

#### Hari 24-25: 3-4 Juni 2026
- [ ] Update semua dokumentasi
- [ ] Buat changelog
- [ ] Review code dengan tim
- [ ] Persiapan deployment produksi

#### Hari 26-27: 5-6 Juni 2026
- [ ] Deployment ke staging
- [ ] Testing di staging
- [ ] Bug fixing jika ditemukan
- [ ] Approval untuk produksi

#### Hari 28-30: 7-9 Juni 2026
- [ ] Deployment ke produksi
- [ ] Monitoring pasca-deployment
- [ ] Dokumentasi deployment
- [ ] Retrospective tim

---

## 🔧 DETAIL IMPLEMENTASI

### TUGAS #1: Buat `apps/web/middleware.ts`

**Prioritas:** 🔴 KRITIS  
**Estimasi:** 5 menit  
**Dependencies:** Tidak ada

**Langkah-langkah:**
1. Buka terminal di `apps/web`
2. Buat file `middleware.ts` dengan isi:
```typescript
import { proxy } from './proxy'

export { proxy as middleware }
```
3. Simpan file
4. Restart development server
5. Verifikasi cookie `siteId` ter-set di browser

**Verifikasi:**
- [ ] File `middleware.ts` ada di `apps/web/`
- [ ] Cookie `siteId` ter-set saat membuka halaman
- [ ] Multi-tenant routing berfungsi
- [ ] Upload gambar berhasil

---

### TUGAS #2: Perbaiki Eksposur Port Docker

**Prioritas:** 🔴 KRITIS  
**Estimasi:** 10 menit  
**Dependencies:** Tidak ada

**Langkah-langkah:**
1. Buka `infra/docker/docker-compose.backend.yml`
2. Cari bagian `api:`
3. Ubah:
```yaml
api:
  ports:
    - "3001:3001"  # ← HAPUS INI
```
4. Ganti dengan:
```yaml
api:
  expose:
    - "3001"  # ← GUNAKAN INI
```
5. Restart Docker containers
6. Verifikasi API tidak dapat diakses langsung via `IP:3001`

**Verifikasi:**
- [ ] Port 3001 tidak terbuka ke host
- [ ] API hanya dapat diakses via Nginx
- [ ] Semua request lewat Nginx berhasil
- [ ] Security headers teraplikasi

---

### TUGAS #3: Perbaiki Error 500 Upload Gambar

**Prioritas:** 🔴 KRITIS  
**Estimasi:** 1-2 jam  
**Dependencies:** Tugas #1 (middleware.ts)

**Investigasi Awal:**
Error 500 menunjukkan masalah di server side. Kemungkinan penyebab:
1. Sharp dependency tidak terinstall
2. File system permissions issue
3. Database connection error
4. Environment configuration issue

**Langkah-langkah Investigasi:**
1. Cek log server untuk error detail
2. Verifikasi Sharp terinstall: `npm list sharp`
3. Cek permissions folder `uploads/`
4. Verifikasi database connection
5. Cek environment variables

**Langkah-langkah Perbaikan:**
1. Jika Sharp tidak terinstall:
   ```bash
   cd apps/api
   npm install sharp
   ```
2. Jika permissions issue:
   ```bash
   chmod -R 755 apps/api/uploads
   ```
3. Jika database connection issue:
   - Verifikasi `DATABASE_URL` di `.env`
   - Test connection: `npx prisma db push`
4. Restart server
5. Tes upload gambar

**Verifikasi:**
- [ ] Sharp terinstall dengan benar
- [ ] Folder uploads memiliki permissions yang benar
- [ ] Database connection berhasil
- [ ] Upload gambar berhasil
- [ ] Gambar terproses dengan watermark
- [ ] Thumbnail tergenerate

---

### TUGAS #4: Perbaiki Konfigurasi Nginx

**Prioritas:** 🟡 TINGGI  
**Estimasi:** 30 menit  
**Dependencies:** Tidak ada

**Langkah-langkah:**
1. Buka `infra/nginx/nginx.conf`
2. Cari baris:
```nginx
proxy_set_header X-Site-ID $subdomain;  # Variable not defined
```
3. Hapus baris tersebut atau definisikan variabel:
```nginx
map $host $subdomain {
    ~^([^.]+)\.beritakarya\.co$ $1;
    default "pusat";
}
```
4. Buka `infra/nginx/nginx.staging.conf`
5. Cari dan perbaiki typo:
```nginx
# DARI:
if ($host ~* "^([^.]+)\.staging\.beritakarya\.com$") {

# KE:
if ($host ~* "^([^.]+)\.staging\.beritakarya\.co$") {
```
6. Test konfigurasi: `nginx -t`
7. Reload Nginx: `nginx -s reload`

**Verifikasi:**
- [ ] Konfigurasi Nginx valid
- [ ] Nginx reload berhasil
- [ ] Header X-Site-ID terkirim dengan benar
- [ ] Staging environment dapat diakses

---

### TUGAS #5: Implementasikan Validasi Environment

**Prioritas:** 🟡 TINGGI  
**Estimasi:** 2 jam  
**Dependencies:** Tidak ada

**Langkah-langkah:**
1. Buat file `apps/api/src/lib/envValidation.ts`:
```typescript
import { z } from 'zod'

const requiredEnvVars = {
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  API_URL: process.env.API_URL,
}

const missingVars = Object.entries(requiredEnvVars)
  .filter(([_, value]) => !value)
  .map(([key]) => key)

if (missingVars.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missingVars.join(', ')}`
  )
}

// Validate JWT secret strength
if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters')
}
```

2. Import di `apps/api/src/main.ts`:
```typescript
import './lib/envValidation'
```

3. Buat file `apps/web/src/lib/envValidation.ts`:
```typescript
const requiredEnvVars = {
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
}

const missingVars = Object.entries(requiredEnvVars)
  .filter(([_, value]) => !value)
  .map(([key]) => key)

if (missingVars.length > 0 && typeof window === 'undefined') {
  console.warn(`Missing environment variables: ${missingVars.join(', ')}`)
}
```

4. Import di `apps/web/app/layout.tsx`:
```typescript
import '../src/lib/envValidation'
```

**Verifikasi:**
- [ ] Server gagal start jika env vars missing
- [ ] JWT secret divalidasi
- [ ] Warning ditampilkan untuk missing vars
- [ ] Semua env vars terdokumentasi

---

### TUGAS #6: Perkuat Header Keamanan CSP

**Prioritas:** 🟡 TINGGI  
**Estimasi:** 1 jam  
**Dependencies:** Tidak ada

**Langkah-langkah:**
1. Buka `apps/api/src/middleware/security.middleware.ts`
2. Ubah CSP untuk diterapkan di semua environment:
```typescript
export function securityHeadersMiddleware(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  // ... existing headers ...

  // Apply CSP in all environments
  const isDev = env.NODE_ENV !== 'production'
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Allow inline scripts in dev
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://*.beritakarya.co https://beritakarya.co ws://localhost:* wss://*.beritakarya.co",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'"
  ]

  if (!isDev) {
    // Stricter CSP in production
    cspDirectives[1] = "script-src 'self' 'nonce-{random}'"
  }

  res.setHeader(
    'Content-Security-Policy',
    cspDirectives.join('; ')
  )

  // Add CSP reporting endpoint
  if (!isDev) {
    res.setHeader(
      'Content-Security-Policy-Report-Only',
      cspDirectives.join('; ') + "; report-uri /api/v1/csp-report"
    )
  }

  next()
}
```

3. Buat endpoint untuk CSP report:
```typescript
// apps/api/src/modules/security/security.controller.ts
router.post('/csp-report', (req, res) => {
  logger.warn('CSP Violation:', req.body)
  res.status(204).send()
})
```

**Verifikasi:**
- [ ] CSP diterapkan di semua environment
- [ ] CSP report endpoint berfungsi
- [ ] Tidak ada CSP violation di console
- [ ] Inline scripts berfungsi di dev

---

### TUGAS #7: Implementasikan Perpanjangan SSL Otomatis

**Prioritas:** 🟡 TINGGI  
**Estimasi:** 3 jam  
**Dependencies:** Tidak ada

**Langkah-langkah:**
1. Install Certbot DNS plugin:
```bash
sudo apt-get update
sudo apt-get install certbot python3-certbot-dns-cloudflare
```

2. Setup Cloudflare API credentials:
```bash
# Buat file ~/.secrets/certbot-cloudflare.ini
dns_cloudflare_api_token = YOUR_CLOUDFLARE_API_TOKEN
```

3. Set permissions:
```bash
chmod 600 ~/.secrets/certbot-cloudflare.ini
```

4. Request sertifikat:
```bash
sudo certbot certonly \
  --dns-cloudflare \
  --dns-cloudflare-credentials ~/.secrets/certbot-cloudflare.ini \
  --dns-cloudflare-propagation-seconds 30 \
  -d "*.beritakarya.co" \
  -d "beritakarya.co" \
  -d "api.beritakarya.co"
```

5. Setup auto-renewal:
```bash
sudo certbot renew --dry-run
```

6. Buat cron job untuk auto-renewal:
```bash
sudo crontab -e
# Tambahkan:
0 0 * * * certbot renew --quiet --post-hook "systemctl reload nginx"
```

7. Setup monitoring:
```bash
# Buat script check-ssl.sh
#!/bin/bash
EXPIRY=$(echo | openssl s_client -servername api.beritakarya.co -connect api.beritakarya.co:443 2>/dev/null | openssl x509 -noout -dates | grep notAfter | cut -d= -f2)
DAYS_LEFT=$(( ($(date -d "$EXPIRY" +%s) - $(date +%s)) / 86400 ))

if [ $DAYS_LEFT -lt 30 ]; then
  echo "WARNING: SSL certificate expires in $DAYS_LEFT days"
  # Send alert (email, Slack, etc.)
fi
```

**Verifikasi:**
- [ ] Sertifikat SSL berhasil diterbitkan
- [ ] Auto-renewal berfungsi
- [ ] Cron job ter-setup
- [ ] Monitoring script berfungsi
- [ ] Alert dikirim jika sertifikat akan kedaluwarsa

---

## 📋 CHECKLIST VERIFIKASI

### Sebelum Deployment Staging

- [ ] Semua masalah KRITIS terselesaikan
- [ ] Upload gambar berfungsi
- [ ] Multi-tenant routing berfungsi
- [ ] SSL certificate valid
- [ ] Nginx configuration valid
- [ ] Environment variables ter-set dengan benar
- [ ] Database connection stabil
- [ ] Tes unit lulus
- [ ] Tes integrasi lulus
- [ ] Tes E2E lulus

### Sebelum Deployment Produksi

- [ ] Semua masalah TINGGI terselesaikan
- [ ] Coverage tes ≥ 80%
- [ ] Security audit lulus
- [ ] Load testing lulus
- [ ] Monitoring ter-setup
- [ ] Alert system ter-setup
- [ ] Backup database terbaru
- [ ] Rollback plan siap
- [ ] Dokumentasi lengkap
- [ ] Tim approval diperoleh

---

## 🚨 RISK MITIGATION

### Risiko #1: Deployment Gagal

**Mitigasi:**
- Selalu deploy ke staging terlebih dahulu
- Buat backup sebelum deployment
- Siapkan rollback plan
- Gunakan deployment blue-green

### Risiko #2: Regresi Bug

**Mitigasi:**
- Tingkatkan coverage tes
- Implementasikan tes E2E
- Review code dengan teliti
- Testing komprehensif di staging

### Risiko #3: Downtime

**Mitigasi:**
- Gunakan deployment blue-green
- Schedule maintenance window
- Komunikasikan ke user
- Monitor secara real-time

### Risiko #4: Security Breach

**Mitigasi:**
- Implementasikan semua security fixes
- Security audit rutin
- Monitoring security events
- Incident response plan siap

---

## 📊 METRICS SUCCESS

### Technical Metrics

- [ ] Semua masalah KRITIS = 0
- [ ] Semua masalah TINGGI = 0
- [ ] Coverage tes ≥ 80%
- [ ] Build time < 5 menit
- [ ] Response time < 200ms
- [ ] Uptime ≥ 99.9%

### Business Metrics

- [ ] Upload gambar berfungsi 100%
- [ ] Multi-tenant routing berfungsi 100%
- [ ] User dapat membuat artikel 100%
- [ ] Tidak ada bug kritikal di produksi
- [ ] Security score ≥ A+

---

## 👥 TANGGUNG JAWAB

| Role | Nama | Tanggung Jawab |
|------|------|---------------|
| Lead Developer | - | Koordinasi overall, review code |
| Backend Developer | - | Perbaikan API, database, security |
| Frontend Developer | - | Perbaikan UI, middleware, testing |
| DevOps Engineer | - | Deployment, monitoring, SSL |
| QA Engineer | - | Testing, quality assurance |
| Project Manager | - | Timeline, resources, approval |

---

## 📞 KONTAK DARURAT

Jika terjadi masalah kritis selama eksekusi:

1. **Stop deployment** jika ada error
2. **Rollback** ke versi sebelumnya
3. **Investigate** root cause
4. **Fix** masalah
5. **Test** perbaikan
6. **Redeploy** dengan approval

---

## 📝 CATATAN PENTING

1. **JANGAN skip testing** - Setiap perbaikan harus di-test
2. **Backup sebelum perubahan** - Selalu buat backup
3. **Dokumentasikan perubahan** - Update changelog
4. **Komunikasikan progress** - Daily standup
5. **Prioritaskan kritis** - Selesaikan masalah kritis dulu

---

**Dokumen ini akan di-update secara berkala sesuai progress.**

**Status:** 🟡 IN PROGRESS  
**Last Updated:** 11 Mei 2026  
**Next Review:** 12 Mei 2026