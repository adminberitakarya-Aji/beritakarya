# 🚀 FINAL IMPLEMENTASI — BeritaKarya Platform

> **Single source of truth** untuk semua pekerjaan ke depan.
> Dibuat: 11 Mei 2026 | Berdasarkan: pengecekan langsung kode aktual + 5 dokumen audit
> **Update status checklist ini setiap kali task selesai.**

---

## 📊 STATUS RINGKASAN

| Fase | Deskripsi | Status |
|------|-----------|--------|
| **Fase 1** | Fix Kritis — Lokal (commit & push) | ✅ Selesai |
| **Fase 2** | Setup Nginx Host di VPS | ❌ Belum |
| **Fase 3** | SSL Auto-Renewal di VPS | ❌ Belum |
| **Fase 4** | Cleanup, Security, Testing | ✅ Selesai (kode) |

---

## ✅ SUDAH SELESAI (Dikonfirmasi dari Kode)

| # | Item | Bukti |
|---|------|-------|
| 1 | `apps/web/middleware.ts` sudah ada | File 65 bytes, export `proxy as middleware` |
| 2 | Port Docker sudah pakai `expose:` | `docker-compose.backend.yml` line 36 |
| 3 | `docker-compose.prod.yml` sudah ada deprecated notice | Lines 4-16 |
| 4 | `nginx.conf` bebas dari `$subdomain` undefined | File bersih |
| 5 | `nginx.staging.conf` domain sudah `.co` | Line 28, bukan `.com` |
| 6 | Upload volume path sudah benar | `uploads_data:/app/apps/api/uploads` |

---

## 🔴 FASE 1 — FIX KRITIS LOKAL

> **Lokasi:** Komputer lokal → `git push`
> **Estimasi:** 30 menit

---

### TASK 1.1 — Fix `middleware.ts` Export Style

**Masalah:** File saat ini menggunakan `export { proxy as middleware }` tapi Next.js convention untuk middleware mengharuskan export **default** dan menyertakan `config` agar matcher aktif.

**Cek `proxy.ts`:** Sudah punya `export const config` dengan matcher yang benar (line 80-82).

**File:** `apps/web/middleware.ts`

```typescript
// SEBELUM (saat ini):
import { proxy } from './proxy'
export { proxy as middleware }

// SESUDAH (yang benar untuk Next.js):
export { proxy as default, config } from './proxy'
```

**Verifikasi:**
- [ ] Buka `http://localhost:3000?site=pusat` → cookie `siteId=pusat` harus muncul di DevTools
- [ ] Buka `http://localhost:3000?site=bandung` → cookie `siteId=bandung` harus muncul
- [ ] Upload gambar di artikel → harus berhasil (tidak 400 SITE_REQUIRED)

> ✅ **DONE** — Dieksekusi 11 Mei 2026: `export { proxy as default, config } from './proxy'`

---

### TASK 1.2 — Fix `docker-compose.backend.yml` Port Binding

**Masalah:** Saat ini hanya `expose: "3001"` (internal Docker saja). Nginx di host tidak bisa menjangkau API container. Harus bind ke `127.0.0.1:3001` agar Nginx host bisa reach, tapi tetap tidak terbuka ke internet.

**File:** `infra/docker/docker-compose.backend.yml`

```yaml
# SEBELUM (saat ini, line 36-37):
    expose:
      - "3001"

# SESUDAH:
    expose:
      - "3001"
    ports:
      - "127.0.0.1:3001:3001"   # Hanya localhost VPS, tidak ke internet
```

> ⚠️ `expose` tetap dipertahankan (untuk Docker internal network).
> `ports: 127.0.0.1:3001:3001` memungkinkan Nginx host-level menjangkau API via `proxy_pass http://127.0.0.1:3001`.

**Verifikasi:**
- [ ] `sudo ss -tlnp | grep 3001` di VPS → harus tampil `127.0.0.1:3001` (bukan `0.0.0.0:3001`)

> ✅ **DONE** — Dieksekusi 11 Mei 2026: expose + `127.0.0.1:3001:3001`

---

### TASK 1.3 — Fix `nginx.prod.conf` proxy_pass Target

**Masalah:** `nginx.prod.conf` menggunakan `proxy_pass http://api:3001` (Docker DNS name). Tapi Nginx berjalan di **host level** (bukan di dalam Docker), sehingga `api` tidak bisa di-resolve → **502 Bad Gateway di production**.

**File:** `infra/nginx/nginx.prod.conf`

```nginx
# SEBELUM (line 75, 94):
proxy_pass  http://api:3001;

# SESUDAH:
proxy_pass  http://127.0.0.1:3001;
```

Ubah di **semua lokasi** yang menggunakan `http://api:3001`:
- Line 75: blok `/api/v1/auth/`
- Line 94: blok `/` (catch-all API)

**Juga fix media alias path** (line 57):
```nginx
# SEBELUM:
location /api/v1/media/uploads/ {
    alias /app/uploads/;           # ← path Docker internal, bukan host!

# SESUDAH:
location /api/v1/media/uploads/ {
    alias /opt/beritakarya/uploads/;   # ← path host yang benar
```

**Verifikasi:**
- [ ] `sudo nginx -t` → konfigurasi valid
- [ ] `curl https://api.beritakarya.co/health` → `{"status":"healthy"}`

> ✅ **DONE** — Dieksekusi 11 Mei 2026: semua `http://api:3001` → `http://127.0.0.1:3001`, alias `/app/uploads/` → `/opt/beritakarya/uploads/`

---

### TASK 1.4 — Fix `docker-compose.backend.yml` PostgreSQL Port

**Masalah:** PostgreSQL juga di-publish ke `0.0.0.0:5432` (line 14-15), bisa diakses dari internet.

**File:** `infra/docker/docker-compose.backend.yml`

```yaml
# SEBELUM (line 14-15):
    ports:
      - "5432:5432"

# SESUDAH:
    expose:
      - "5432"          # Internal Docker network saja
```

> API container sudah connect ke postgres via Docker internal DNS (`postgres:5432`), tidak perlu port published.

**Verifikasi:**
- [ ] `sudo ss -tlnp | grep 5432` → tidak tampil (atau hanya internal Docker)

> ✅ **DONE** — Dieksekusi 11 Mei 2026: `ports: 5432:5432` → `expose: 5432`

---

### TASK 1.5 — Commit & Push ke GitHub

```bash
cd d:\beritakarya

git add apps/web/middleware.ts
git add infra/docker/docker-compose.backend.yml
git add infra/nginx/nginx.prod.conf

git commit -m "fix: correct middleware export, API port binding, nginx proxy target

- Fix middleware.ts: use 'export default' convention for Next.js
- Fix docker-compose.backend.yml: bind API 127.0.0.1:3001 only (host Nginx can reach)
- Fix docker-compose.backend.yml: close postgres port 5432 from public
- Fix nginx.prod.conf: replace 'http://api:3001' with 'http://127.0.0.1:3001'
  (Nginx runs at host level, Docker DNS 'api' is unresolvable)
- Fix nginx.prod.conf: media alias path from /app/uploads to /opt/beritakarya/uploads"

git push origin main
```

**Verifikasi:**
- [ ] GitHub Actions CI berhasil (hijau)

---

## 🌐 FASE 2 — SETUP NGINX HOST DI VPS

> **Lokasi:** SSH ke VPS (`ssh user@IP_VPS`)
> **Estimasi:** 30–45 menit

---

### TASK 2.1 — Pull Perubahan di VPS

```bash
cd /opt/beritakarya
git pull origin main
```

---

### TASK 2.2 — Audit Kondisi VPS

```bash
# Cek Nginx host
sudo systemctl status nginx

# Cek siapa yang pakai port 80/443/3001
sudo ss -tlnp | grep -E ':80|:443|:3001'

# Pastikan tidak ada container Nginx lama
docker ps | grep nginx   # Harus KOSONG
```

**Interpretasi:**
- `nginx` active + port 80/443 dari `nginx` (bukan docker) → ✅
- Port 3001 dari `0.0.0.0` → ❌ fix belum ter-apply
- Ada container nginx di docker → matikan dulu

---

### TASK 2.3 — Restart Docker Compose dengan Config Baru

```bash
cd /opt/beritakarya
docker compose -f infra/docker/docker-compose.backend.yml down
docker compose -f infra/docker/docker-compose.backend.yml up -d --build

# Verifikasi
docker ps                          # api dan postgres harus running
sudo ss -tlnp | grep 3001          # harus tampil 127.0.0.1:3001
sudo ss -tlnp | grep 5432          # TIDAK BOLEH tampil
```

---

### TASK 2.4 — Buat Nginx Host Config

```bash
sudo nano /etc/nginx/sites-available/api.beritakarya.co
```

Isi file:

```nginx
# /etc/nginx/sites-available/api.beritakarya.co
# Nginx HOST-LEVEL — berjalan langsung di VPS, bukan di Docker

limit_req_zone $binary_remote_addr zone=api_general:10m rate=100r/m;
limit_req_zone $binary_remote_addr zone=api_auth:10m    rate=10r/m;

# HTTP → HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name api.beritakarya.co;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS API Server
server {
    listen 443 ssl;
    listen [::]:443 ssl;
    http2 on;
    server_name api.beritakarya.co;

    # SSL (dikelola Certbot — akan diisi otomatis oleh certbot --nginx)
    ssl_certificate     /etc/letsencrypt/live/api.beritakarya.co/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.beritakarya.co/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_session_cache   shared:SSL:10m;
    ssl_session_timeout 1d;
    ssl_prefer_server_ciphers on;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    client_max_body_size 20M;
    server_tokens off;

    add_header X-Frame-Options        "SAMEORIGIN"   always;
    add_header X-XSS-Protection       "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff"       always;

    # Media files — langsung dari volume upload
    location /api/v1/media/uploads/ {
        alias /opt/beritakarya/uploads/;
        expires 30d;
        add_header Cache-Control "public, no-transform";
        add_header Access-Control-Allow-Origin "*" always;
        try_files $uri =404;
    }

    # Auth — rate limit ketat
    location /api/v1/auth/ {
        limit_req zone=api_auth burst=5 nodelay;
        limit_req_status 429;
        proxy_pass             http://127.0.0.1:3001;
        proxy_http_version     1.1;
        proxy_set_header       Host              $host;
        proxy_set_header       X-Real-IP         $remote_addr;
        proxy_set_header       X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header       X-Forwarded-Proto $scheme;
    }

    # Health & Metrics
    location ~ ^/(health|metrics)$ {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        access_log off;
    }

    # Semua route lain
    location / {
        limit_req zone=api_general burst=20 nodelay;
        limit_req_status 429;
        proxy_pass             http://127.0.0.1:3001;
        proxy_http_version     1.1;
        proxy_set_header       Host              $host;
        proxy_set_header       X-Real-IP         $remote_addr;
        proxy_set_header       X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header       X-Forwarded-Proto $scheme;
        proxy_buffer_size      128k;
        proxy_buffers          4 256k;
    }
}
```

```bash
# Aktifkan config
sudo ln -s /etc/nginx/sites-available/api.beritakarya.co \
           /etc/nginx/sites-enabled/api.beritakarya.co

sudo rm -f /etc/nginx/sites-enabled/default

sudo nginx -t
sudo systemctl reload nginx
```

---

### TASK 2.5 — Setup Folder Upload di Host

```bash
sudo mkdir -p /opt/beritakarya/uploads
sudo chown -R 1001:1001 /opt/beritakarya/uploads
sudo chmod 755 /opt/beritakarya/uploads
```

**Verifikasi Fase 2:**
- [ ] `curl http://api.beritakarya.co/health` → redirect 301 ke HTTPS
- [ ] Docker `api` dan `postgres` running
- [ ] Port `3001` hanya di `127.0.0.1`
- [ ] Port `5432` tidak visible dari luar

---

## 🔒 FASE 3 — SSL AUTO-RENEWAL

> **Lokasi:** SSH ke VPS
> **Estimasi:** 20 menit

---

### TASK 3.1 — Dapatkan Certificate

```bash
sudo apt update
sudo apt install -y certbot python3-certbot-nginx

sudo mkdir -p /var/www/certbot

# HTTP-01 challenge — bisa auto-renew!
sudo certbot --nginx \
  -d api.beritakarya.co \
  --email admin@beritakarya.co \
  --agree-tos \
  --no-eff-email
```

> ✅ Certbot `--nginx` otomatis modifikasi config dan setup renewal timer.
> Wildcard SSL TIDAK diperlukan di VPS karena subdomains di-handle Vercel.

---

### TASK 3.2 — Verifikasi Auto-Renewal

```bash
sudo certbot renew --dry-run
sudo systemctl status certbot.timer
```

**Verifikasi Fase 3:**
- [ ] `curl -v https://api.beritakarya.co/health 2>&1 | grep TLS` → `TLSv1.3`
- [ ] `certbot renew --dry-run` → `All simulated renewals succeeded`

---

## 🧹 FASE 4 — CLEANUP & SECURITY HARDENING

> **Lokasi:** Komputer lokal → `git push`
> **Estimasi:** 2–3 jam

---

### TASK 4.1 — Validasi Environment Variables

**Buat file baru:** `apps/api/src/lib/envValidation.ts`

```typescript
import { env } from './env'

const required: Record<string, string | undefined> = {
  DATABASE_URL: env.DATABASE_URL,
  JWT_SECRET:   env.JWT_SECRET,
}

const missing = Object.entries(required)
  .filter(([, v]) => !v)
  .map(([k]) => k)

if (missing.length > 0) {
  console.error(`❌ Missing env vars: ${missing.join(', ')}`)
  process.exit(1)
}

if (env.JWT_SECRET && env.JWT_SECRET.length < 32) {
  console.error('❌ JWT_SECRET harus minimal 32 karakter')
  process.exit(1)
}
```

Import di `apps/api/src/main.ts` baris paling atas:
```typescript
import './lib/envValidation'
```

**Verifikasi:**
- [ ] Server gagal start dengan pesan jelas jika `JWT_SECRET` < 32 karakter

> ✅ **DONE** — Dieksekusi 11 Mei 2026: `apps/api/src/lib/envValidation.ts` dibuat & diimport di `main.ts`

---

### TASK 4.2 — Perkuat CSP Headers (Semua Environment)

**File:** `apps/api/src/middleware/security.middleware.ts`

Ubah blok CSP (line 37-50):

```typescript
  // Content Security Policy — aktif di SEMUA environment
  const cspDirectives = [
    "default-src 'self'",
    env.NODE_ENV === 'production'
      ? "script-src 'self'"
      : "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://*.beritakarya.co wss://*.beritakarya.co ws://localhost:*",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'",
  ].join('; ')

  res.setHeader('Content-Security-Policy', cspDirectives)
```

**Verifikasi:**
- [ ] Di dev: tidak ada CSP error di console untuk operasi normal
- [ ] Di prod: CSP ketat aktif (check di DevTools → Network → Response Headers)

> ✅ **DONE** — Dieksekusi 11 Mei 2026: CSP diaktifkan di semua environment

---

### TASK 4.3 — Fix Error Handling Upload Gambar

**File:** `apps/web/components/editor/blocks/ImageBlock.tsx`

Cari catch block upload dan perbaiki:

```typescript
// SEBELUM:
} catch {
  alert('Upload gagal, coba lagi')
}

// SESUDAH:
} catch (error: any) {
  const msg = error?.response?.data?.error?.message || 'Upload gagal, coba lagi'
  console.error('[ImageBlock] Upload error:', error?.response?.data || error)
  alert(msg)
}
```

> ✅ **DONE** — Dieksekusi 11 Mei 2026: error handling lebih informatif

---

### TASK 4.4 — Update Dokumentasi `VERCEL_DEPLOYMENT.md`

**File:** `docs/VERCEL_DEPLOYMENT.md`

Cari yang menyebut `NEXT_PUBLIC_API_URL=https://api.beritakarya.co/api/v1` dan perbaiki:

```markdown
| `NEXT_PUBLIC_API_URL` | `https://api.beritakarya.co` | Base URL **tanpa** /api/v1 |

> ⚠️ `lib/api.ts` sudah otomatis menambahkan `/api/v1`.
```

> ✅ **DONE** — Dieksekusi 11 Mei 2026: dokumentasi URL & middleware export diperbarui

---

### TASK 4.5 — Fix Zustand `get()` di EditorialSidebar

**File:** `apps/web/components/editor/EditorToolbar.tsx` (ditemukan di file ini, bukan EditorialSidebar)

```typescript
// JANGAN (tidak reaktif — hanya baca sekali):
const { submitForReview } = useEditorStore.getState();

// BENAR (reaktif — auto-update saat state berubah):
const { submitForReview, ... } = useEditorStore();
```

> ✅ **DONE** — Dieksekusi 11 Mei 2026: di `EditorToolbar.tsx` (reaktif pattern)

---

### TASK 4.6 — Commit Cleanup

```bash
cd d:\beritakarya

git add apps/api/src/lib/envValidation.ts
git add apps/api/src/main.ts
git add apps/api/src/middleware/security.middleware.ts
git add apps/web/components/editor/blocks/ImageBlock.tsx
git add apps/web/components/editor/EditorToolbar.tsx
git add docs/VERCEL_DEPLOYMENT.md

git commit -m "fix: env validation, CSP all envs, upload error handling, docs, zustand pattern"

git push origin main
```

> ✅ **DONE** — Dieksekusi 11 Mei 2026: semua cleanup di-push ke main branch.

---

## ✅ CHECKLIST VERIFIKASI FINAL

### Lokal (sebelum push)
- [ ] `pnpm dev` berjalan tanpa error
- [ ] Cookie `siteId` ter-set saat buka `localhost:3000?site=pusat`
- [ ] Upload gambar berhasil di article editor

### VPS (setelah deploy)
- [ ] `curl https://api.beritakarya.co/health` → `{"status":"healthy"}`
- [ ] `sudo ss -tlnp | grep 3001` → hanya `127.0.0.1:3001`
- [ ] `sudo ss -tlnp | grep 5432` → tidak tampil
- [ ] `curl http://IP_VPS:3001/health --connect-timeout 5` → timeout
- [ ] `sudo certbot renew --dry-run` → sukses
- [ ] Upload gambar dari browser → berhasil

### Browser
- [ ] `beritakarya.co` → load halaman pusat
- [ ] `bandung.beritakarya.co` → load halaman bandung
- [ ] Login di `/login` → berhasil
- [ ] Upload gambar di editor → berhasil

---

## 📋 BACKLOG (Setelah Fase 1-4 Selesai)

| Priority | Item | Estimasi |
|----------|------|----------|
| P1 | Migrasi token ke httpOnly cookies (ganti localStorage) | 4 jam |
| P1 | Database: tambah composite index `[siteId, categoryId, status]` | 1 jam |
| P1 | Database: kebijakan retensi `PageView` (cleanup job) | 3 jam |
| P1 | Test coverage target 80%+ | 16 jam |
| P2 | Redis cache (artikel populer, session, rate limit) | 8 jam |
| P2 | Search engine Meilisearch | 1 minggu |
| P2 | CDN Cloudflare untuk media | 3 hari |
| P2 | Monitoring: Sentry + Grafana + Prometheus | 1 minggu |
| P3 | Comment system + moderasi | 1 minggu |
| P3 | i18n multi-language | 2 minggu |
| P3 | Push notifications (Web Push + email digest) | 1 minggu |

---

## 📁 REFERENSI DOKUMEN LAMA

File-file audit lama tetap disimpan sebagai referensi historis:

| File | Fungsi |
|------|--------|
| `COMPREHENSIVE_AUDIT_REPORT.md` | Background audit lengkap (23 temuan) |
| `IMAGE_UPLOAD_FAILURE_ANALYSIS.md` | Root cause analysis upload bug |
| `infra_audit.md` | Audit infrastruktur & domain |
| `Implementasi_Infra_Audit.md` | Panduan teknis per-fase (basis file ini) |
| `project_analysis.md` | Peta arsitektur & roadmap fitur |
| `plan_kerja.md` | Timeline 30 hari (digantikan file ini) |

> Semua insight dari 6 dokumen di atas sudah **distilasi dan diverifikasi** terhadap kode aktual ke dalam file ini.

---

## ⚠️ CATATAN PENTING

1. **Urutan wajib diikuti** — Fase 1 (lokal) → Fase 2 (VPS) → Fase 3 (SSL) → Fase 4 (cleanup). Jangan terbalik.
2. **Test setelah setiap task** — Jangan kumpulkan semua fix lalu test sekaligus.
3. **Backup database sebelum perubahan infrastruktur** — `pg_dump` dulu di VPS.
4. **Jangan deploy ke production** sebelum semua checklist Fase 1-3 hijau.
5. **File ini adalah single source of truth** — update checklist di file ini, bukan di dokumen lama.

---

**Status:** 🟡 IN PROGRESS
**Last Updated:** 11 Mei 2026
**Next Action:** TASK 1.1 — Fix middleware.ts export style
