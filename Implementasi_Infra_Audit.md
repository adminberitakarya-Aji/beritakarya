# 🛠️ Implementasi Infra Audit — BeritaKarya
> **Status**: Siap Dieksekusi | **Prioritas**: P0 — Production Critical
> **Estimasi Total**: ~2–3 jam eksekusi
> **Arsitektur Target**: Vercel (Frontend) + VPS Host-Nginx + Docker Backend

---

## 📋 Ringkasan Masalah & Fix

| # | Masalah | Severity | Fase |
|---|---------|----------|------|
| 1 | `middleware.ts` tidak ada → multi-tenant mati | 🔴 KRITIS | 1 |
| 2 | Dua Nginx (host + Docker) berebut port 80/443 | 🔴 KRITIS | 2 |
| 3 | Port 3001 bocor ke publik (bypass security) | 🔴 KRITIS | 1 |
| 4 | `docker-compose.prod.yml` depends_on web yg tidak ada | 🔴 KRITIS | 4 |
| 5 | `nginx.prod.conf` proxy ke `api:3001` (Docker DNS) tapi Nginx di host | 🔴 KRITIS | 2 |
| 6 | SSL renewal manual → expired tiap 90 hari | 🟡 HIGH | 3 |
| 7 | `$subdomain` undefined di `nginx.conf` dev | 🟡 MEDIUM | 4 |
| 8 | Typo `.com` di `nginx.staging.conf` | 🟢 LOW | 4 |

---

## ⚙️ Arsitektur Final yang Dituju

```
Internet
   │
   ▼
Namecheap DNS (NS → Vercel)
   ├── beritakarya.co       → Vercel (A/CNAME)
   ├── *.beritakarya.co     → Vercel (wildcard)
   └── api.beritakarya.co   → VPS IP (A Record)
                                 │
                                 ▼
                          VPS (DigitalOcean)
                          ┌──────────────────┐
                          │ Nginx HOST-LEVEL  │ :80/:443
                          │ + Certbot SSL     │
                          └────────┬─────────┘
                                   │ proxy_pass localhost:3001
                                   ▼
                          ┌──────────────────┐
                          │  Docker Network   │
                          │  ┌─────────────┐ │
                          │  │  api:3001   │ │ (expose only, not published)
                          │  └──────┬──────┘ │
                          │         │         │
                          │  ┌──────▼──────┐ │
                          │  │ postgres:5432│ │ (internal only)
                          │  └─────────────┘ │
                          └──────────────────┘
```

---

## 🚀 FASE 1: Perbaikan Kritis di Lokal (Commit ke GitHub)

> **Waktu estimasi**: 30 menit
> **Lokasi**: Di komputer lokal, lalu `git push`

---

### TASK 1.1 — Buat `middleware.ts` (Multi-Tenant Routing)

**Masalah**: `proxy.ts` ada tapi tidak digunakan oleh Next.js karena tidak ada `middleware.ts`.

**Buat file baru**: `apps/web/middleware.ts`

```typescript
// apps/web/middleware.ts
// Re-export proxy sebagai default middleware Next.js
// Ini mengaktifkan wildcard multi-tenant routing:
// bandung.beritakarya.co → /bandung/...
// beritakarya.co → /pusat/...

export { proxy as default, config } from './proxy'
```

**Verifikasi**: File `proxy.ts` sudah memiliki `export const config` dengan matcher yang benar:
```typescript
// proxy.ts (sudah ada, tidak perlu diubah)
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)']\
}
```

**Test lokal**:
```bash
# Di terminal
cd d:\beritakarya
pnpm dev

# Buka browser: http://localhost:3000?site=pusat
# Harus redirect/rewrite ke /pusat/
# Buka: http://localhost:3000?site=bandung
# Harus redirect/rewrite ke /bandung/
```

---

### TASK 1.2 — Fix `docker-compose.backend.yml` (Tutup Port 3001)

**Masalah**: `ports: "3001:3001"` mempublikasikan port ke host → API bisa diakses langsung tanpa Nginx.

**File**: `infra/docker/docker-compose.backend.yml`

**Ubah bagian `api`**:
```yaml
# SEBELUM (SALAH):
api:
  ports:
    - "3001:3001"    # ← Port published ke publik!

# SESUDAH (BENAR):
api:
  expose:
    - "3001"         # ← Internal Docker network saja
```

**File lengkap setelah fix** `infra/docker/docker-compose.backend.yml`:
```yaml
version: '3.9'

services:
  postgres:
    image: postgres:15-alpine
    container_name: beritakarya_db
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-beritakarya}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-ganti_password_ini}
      POSTGRES_DB: ${POSTGRES_DB:-beritakarya}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    expose:
      - "5432"          # ← Internal only (sudah benar)
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-beritakarya} -d ${POSTGRES_DB:-beritakarya}"]
      interval: 10s
      timeout: 5s
      retries: 5

  api:
    build:
      context: ../../
      dockerfile: infra/docker/api.Dockerfile
    container_name: beritakarya_api
    environment:
      - NODE_ENV=production
      - PORT=3001
    env_file:
      - ../../.env.production
    expose:
      - "3001"          # ← DIUBAH: internal only
    ports:
      - "127.0.0.1:3001:3001"  # ← Hanya localhost, tidak publik!
    volumes:
      - uploads_data:/app/apps/api/uploads   # ← Fix path (lihat Task 1.3)
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  postgres_data:
  uploads_data:
```

> [!IMPORTANT]
> `ports: "127.0.0.1:3001:3001"` artinya port hanya bisa diakses dari **localhost VPS saja** (oleh Nginx host-level), tidak bisa dari internet.

---

### TASK 1.3 — Fix Upload Volume Path Mismatch

**Masalah**: Volume di-mount di `/app/uploads` tapi API menulis ke `/app/apps/api/uploads`.

**Di `api.Dockerfile`**:
```dockerfile
# Line 42: Dockerfile membuat folder di:
RUN mkdir -p /app/apps/api/uploads
```

**Di `docker-compose.backend.yml`** (sebelumnya):
```yaml
volumes:
  - uploads_data:/app/uploads   # ← SALAH! Path tidak match
```

**Setelah fix** (sudah termasuk di Task 1.2):
```yaml
volumes:
  - uploads_data:/app/apps/api/uploads   # ← BENAR
```

---

### TASK 1.4 — Commit Semua Fix ke GitHub

```bash
# Di terminal lokal
cd d:\beritakarya

git add apps/web/middleware.ts
git add infra/docker/docker-compose.backend.yml

git commit -m "fix: add middleware.ts for multi-tenant routing, secure API port binding

- Add apps/web/middleware.ts to activate Next.js proxy middleware
  (wildcard multi-tenant routing: *.beritakarya.co)
- Change docker-compose.backend.yml ports from published to
  localhost-only binding (127.0.0.1:3001:3001) to prevent
  API exposure without Nginx security layer
- Fix uploads volume path to match Dockerfile path
  (/app/apps/api/uploads)"

git push origin main
```

---

## 🌐 FASE 2: Perbaikan Nginx di VPS

> **Waktu estimasi**: 30–45 menit
> **Lokasi**: SSH ke VPS

---

### TASK 2.1 — Audit Kondisi VPS Saat Ini

SSH ke VPS dan periksa:

```bash
# 1. Cek Nginx yang berjalan
sudo systemctl status nginx
docker ps | grep nginx

# 2. Cek siapa yang menempati port 80/443
sudo ss -tlnp | grep -E ':80|:443'

# 3. Cek siapa yang menempati port 3001
sudo ss -tlnp | grep :3001
```

**Interpretasi hasil**:
- Jika `systemctl status nginx` → **active**: Nginx host berjalan ✅
- Jika `docker ps | grep nginx` → ada container nginx: **matikan ini** ← sumber konflik
- Jika port 3001 terlihat di 0.0.0.0:3001: **port bocor** (perlu fix fase 1)
- Jika port 3001 terlihat di 127.0.0.1:3001: **sudah aman** ✅

---

### TASK 2.2 — Hentikan Docker Nginx (Jika Ada)

```bash
# Jika sebelumnya ada container lama, matikan:
cd /opt/beritakarya  # atau folder project Anda
# Hapus semua container yang mungkin berkonflik
docker compose -f infra/docker/docker-compose.backend.yml down

# Gunakan HANYA docker-compose.backend.yml ke depannya
docker compose -f infra/docker/docker-compose.backend.yml up -d
```

---

### TASK 2.3 — Buat/Update Nginx Host Config yang Benar

**Buat file**: `/etc/nginx/sites-available/api.beritakarya.co`

```nginx
# /etc/nginx/sites-available/api.beritakarya.co
# ─────────────────────────────────────────────
# Nginx HOST-LEVEL config untuk api.beritakarya.co
# Nginx ini berjalan langsung di VPS (bukan dalam Docker)
# API Express.js berjalan di Docker dan hanya bind ke 127.0.0.1:3001
# ─────────────────────────────────────────────

# Rate limiting zones
limit_req_zone $binary_remote_addr zone=api_general:10m rate=100r/m;
limit_req_zone $binary_remote_addr zone=api_auth:10m    rate=10r/m;

# HTTP → HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name api.beritakarya.co;

    # Untuk Certbot challenge (HARUS ada sebelum SSL aktif)
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

    # SSL Certificates (dikelola Certbot)
    ssl_certificate     /etc/letsencrypt/live/api.beritakarya.co/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.beritakarya.co/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;
    ssl_session_cache   shared:SSL:10m;
    ssl_session_timeout 1d;
    ssl_prefer_server_ciphers on;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Upload limit (untuk media upload)
    client_max_body_size 20M;

    # Security headers
    server_tokens off;
    add_header X-Frame-Options       "SAMEORIGIN"   always;
    add_header X-XSS-Protection      "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff"      always;

    # Media files — serve langsung dari volume upload
    # (lebih efisien daripada melewati Express)
    location /api/v1/media/uploads/ {
        alias /opt/beritakarya/uploads/;
        expires 30d;
        add_header Cache-Control "public, no-transform";
        add_header Access-Control-Allow-Origin "*" always;
        try_files $uri =404;
    }

    # Auth routes — rate limit lebih ketat
    location /api/v1/auth/ {
        limit_req zone=api_auth burst=5 nodelay;
        limit_req_status 429;

        proxy_pass             http://127.0.0.1:3001;
        proxy_http_version     1.1;
        proxy_set_header       Host              $host;
        proxy_set_header       X-Real-IP         $remote_addr;
        proxy_set_header       X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header       X-Forwarded-Proto $scheme;
        proxy_connect_timeout  10s;
        proxy_send_timeout     30s;
        proxy_read_timeout     30s;
    }

    # Health & Metrics (tidak perlu rate limit)
    location ~ ^/(health|metrics)$ {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        access_log off;
    }

    # Semua API routes lainnya
    location / {
        limit_req zone=api_general burst=20 nodelay;
        limit_req_status 429;

        proxy_pass             http://127.0.0.1:3001;
        proxy_http_version     1.1;
        proxy_set_header       Host              $host;
        proxy_set_header       X-Real-IP         $remote_addr;
        proxy_set_header       X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header       X-Forwarded-Proto $scheme;
        proxy_connect_timeout  10s;
        proxy_send_timeout     60s;
        proxy_read_timeout     60s;

        # Buffer settings untuk response besar
        proxy_buffer_size          128k;
        proxy_buffers              4 256k;
        proxy_busy_buffers_size    256k;
    }
}
```

**Aktifkan config**:
```bash
# Symlink ke sites-enabled
sudo ln -s /etc/nginx/sites-available/api.beritakarya.co \
           /etc/nginx/sites-enabled/api.beritakarya.co

# Hapus default config jika ada
sudo rm -f /etc/nginx/sites-enabled/default

# Test konfigurasi
sudo nginx -t

# Jika OK, reload
sudo systemctl reload nginx
```

---

### TASK 2.4 — Setup Upload Folder di Host

Karena media serving dilakukan langsung oleh Nginx dari host path, buat folder dan pastikan permissions benar:

```bash
# Buat folder uploads di host
sudo mkdir -p /opt/beritakarya/uploads
sudo chown -R 1001:1001 /opt/beritakarya/uploads  # UID apiuser dari Dockerfile
sudo chmod 755 /opt/beritakarya/uploads

# Update docker-compose.backend.yml untuk mount ke path yang sama
# (tambahkan di volumes section — sudah termasuk di Task 1.2):
# uploads_data:/app/apps/api/uploads
```

**Atau**, gunakan bind mount langsung (lebih transparan):
```yaml
# infra/docker/docker-compose.backend.yml
api:
  volumes:
    - /opt/beritakarya/uploads:/app/apps/api/uploads  # Bind mount langsung
```

---

## 🔒 FASE 3: SSL Renewal Otomatis

> **Waktu estimasi**: 20 menit
> **Lokasi**: SSH ke VPS

---

### TASK 3.1 — Dapatkan SSL Certificate untuk `api.beritakarya.co`

Karena domain `api.beritakarya.co` punya A Record ke VPS (bukan ke Vercel), kita bisa pakai HTTP-01 challenge (lebih mudah, bisa auto-renew):

```bash
# PERTAMA: Pastikan port 80 sudah dihandle Nginx dan
# folder acme-challenge ada
sudo mkdir -p /var/www/certbot

# Dapatkan certificate untuk api.beritakarya.co saja
sudo certbot --nginx \
  -d api.beritakarya.co \
  --email admin@beritakarya.co \
  --agree-tos \
  --no-eff-email

# Certbot akan otomatis modifikasi Nginx config
# dan setup cron/systemd timer untuk auto-renewal
```

> [!NOTE]
> Wildcard SSL `*.beritakarya.co` tidak diperlukan di VPS karena subdomains (beritakarya.co, bandung.beritakarya.co) semua pointing ke Vercel. VPS hanya perlu SSL untuk `api.beritakarya.co`.

---

### TASK 3.2 — Verifikasi Auto-Renewal

```bash
# Test dry-run renewal
sudo certbot renew --dry-run

# Cek timer systemd (Ubuntu 20.04+)
sudo systemctl status certbot.timer

# Atau cek crontab
sudo crontab -l | grep certbot
```

---

## 🧹 FASE 4: Cleanup & File Fixes

> **Waktu estimasi**: 15 menit
> **Lokasi**: Di komputer lokal

---

### TASK 4.1 — Fix nginx.conf (Dev) — Hapus $subdomain Undefined

**File**: `infra/nginx/nginx.conf`

```nginx
# SEBELUM (SALAH):
location /api/ {
  proxy_pass http://backend;
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Site-ID $subdomain;  # ← UNDEFINED!
}

# SESUDAH (BENAR):
location /api/ {
  proxy_pass http://backend;
  proxy_set_header Host              $host;
  proxy_set_header X-Real-IP        $remote_addr;
  proxy_set_header X-Forwarded-For  $proxy_add_x_forwarded_for;
  # X-Site-ID diset oleh Next.js middleware (proxy.ts), bukan Nginx dev
}
```

---

### TASK 4.2 — Fix nginx.staging.conf — Typo .com → .co

**File**: `infra/nginx/nginx.staging.conf`

```nginx
# SEBELUM (SALAH):
if ($host ~* "^([^.]+)\.staging\.beritakarya\.com$") {
#                                             ^^^^ TYPO!

# SESUDAH (BENAR):
if ($host ~* "^([^.]+)\.staging\.beritakarya\.co$") {
#                                             ^^^ Benar
```

---

### TASK 4.3 — Tandai docker-compose.prod.yml sebagai DEPRECATED

File `docker-compose.prod.yml` punya `depends_on: web` yang tidak ada di VPS. Daripada dihapus (bisa berguna nanti jika ingin full self-hosted), tandai sebagai deprecated:

```yaml
# infra/docker/docker-compose.prod.yml
# ─────────────────────────────────────────────────────────
# ⚠️  DEPRECATED — Jangan digunakan untuk deployment saat ini!
# 
# File ini berisi konfigurasi full-stack (Web + API + DB + Nginx)
# untuk skenario ALL-IN-ONE tanpa Vercel.
#
# Setup saat ini menggunakan:
# - Frontend: Vercel (apps/web)
# - Backend:  docker-compose.backend.yml (api + postgres)
# - Nginx:    Host-level Nginx di VPS
#
# File ini HANYA berguna jika Anda ingin pindah ke
# full self-hosted di masa depan.
# ─────────────────────────────────────────────────────────
version: '3.9'
# ... (sisa file tidak berubah)
```

---

### TASK 4.4 — Update Docs VERCEL_DEPLOYMENT.md

Fix inkonsistensi `NEXT_PUBLIC_API_URL`:

```markdown
# File: docs/VERCEL_DEPLOYMENT.md

## Konfigurasi Environment Variables

| Key | Value | Deskripsi |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `https://api.beritakarya.co` | URL Base API (TANPA /api/v1) |
| `NEXT_PUBLIC_URL` | `https://beritakarya.co` | URL utama frontend |
| `NODE_ENV` | `production` | Environment mode |

> ⚠️ **Penting**: Nilai `NEXT_PUBLIC_API_URL` adalah base URL **tanpa** suffix `/api/v1`.
> Kode di `lib/api.ts` sudah otomatis menambahkan `/api/v1`.
```

---

### TASK 4.5 — Commit Cleanup ke GitHub

```bash
cd d:\beritakarya

git add infra/nginx/nginx.conf
git add infra/nginx/nginx.staging.conf
git add infra/docker/docker-compose.prod.yml
git add docs/VERCEL_DEPLOYMENT.md

git commit -m "fix: cleanup nginx configs and deprecated docker-compose

- Fix undefined \$subdomain variable in nginx.conf (dev)
- Fix typo .com → .co in nginx.staging.conf
- Mark docker-compose.prod.yml as deprecated with clear docs
- Clarify NEXT_PUBLIC_API_URL format in VERCEL_DEPLOYMENT.md"

git push origin main
```

---

## ✅ Checklist Verifikasi Final

### Di VPS (via SSH)

```bash
# 1. Cek hanya satu Nginx berjalan (host-level)
sudo systemctl status nginx          # → active
docker ps | grep nginx               # → TIDAK ADA output

# 2. Cek port binding
sudo ss -tlnp | grep -E ':80|:443'   # → nginx (bukan docker)
sudo ss -tlnp | grep :3001           # → 127.0.0.1:3001 saja (bukan 0.0.0.0)

# 3. Test API via HTTPS
curl https://api.beritakarya.co/health
# → {"status":"healthy","timestamp":"...","services":{"database":"healthy"}}

# 4. Test media serving
curl -I https://api.beritakarya.co/api/v1/media/uploads/test.jpg
# → 404 atau 200 (bukan 502)

# 5. Test SSL
curl -v https://api.beritakarya.co/health 2>&1 | grep -E 'SSL|TLS|certificate'
# → SSL connection using TLSv1.3

# 6. Test port 3001 TIDAK bisa diakses dari luar
# (jalankan dari komputer Anda, bukan VPS)
curl http://IP_VPS:3001/health --connect-timeout 5
# → curl: (28) Connection timed out ← BAGUS, port tertutup

# 7. Test auto-renewal SSL
sudo certbot renew --dry-run
# → Congratulations, all simulated renewals succeeded
```

### Di Browser / Frontend

```bash
# 8. Test multi-tenant routing
# Buka: https://beritakarya.co
# → Harus load halaman portal pusat (bukan error)

# 9. Test wildcard subdomain (jika DNS sudah propagate)
# Buka: https://bandung.beritakarya.co
# → Harus load halaman portal bandung

# 10. Test dashboard login
# Buka: https://beritakarya.co/login
# → Login form muncul, bisa login

# 11. Test API CORS
# Di browser console: 
# fetch('https://api.beritakarya.co/health').then(r => r.json()).then(console.log)
# → {status: "healthy", ...}
```

---

## 📊 Summary: File yang Diubah

| File | Aksi | Fase |
|------|------|------|
| `apps/web/middleware.ts` | **BUAT BARU** | 1 |
| `infra/docker/docker-compose.backend.yml` | Edit ports + volume path | 1 |
| `infra/nginx/nginx.conf` | Fix $subdomain | 4 |
| `infra/nginx/nginx.staging.conf` | Fix typo .com → .co | 4 |
| `infra/docker/docker-compose.prod.yml` | Tambah deprecated notice | 4 |
| `docs/VERCEL_DEPLOYMENT.md` | Fix docs API URL | 4 |
| `/etc/nginx/sites-available/api.beritakarya.co` | **BUAT BARU di VPS** | 2 |

**Total**: 5 file diubah di repo + 1 file baru di VPS

---

## ⚠️ Urutan Eksekusi yang Benar

```
1. LOKAL: Fase 1 (Task 1.1 → 1.4) → git push
       ↓
2. VPS:   git pull → Fase 2 (Task 2.1 → 2.4)
       ↓
3. VPS:   Fase 3 SSL (Task 3.1 → 3.2)
       ↓
4. LOKAL: Fase 4 Cleanup (Task 4.1 → 4.5) → git push
       ↓
5. VERIFIKASI: Semua checklist hijau ✅
```
