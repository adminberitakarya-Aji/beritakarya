# 📋 PLAN KERJA PERBAIKAN SISTEM BERITAKARYA

**Tanggal:** 8 Mei 2026  
**Status:** ACTIVE  
**Prioritas:** CRITICAL  
**Timeline:** 2 Minggu (14 Hari)

---

## 🎯 OBJECTIVE

Menghilangkan semua referensi Supabase dan mengkonfigurasi ulang sistem untuk menggunakan **All-in-One VPS** dengan Docker Compose dan Prisma untuk database management.

## 📊 SITUASI SAAT INI

### ✅ Sudah Benar:
- Infrastruktur VPS dengan Docker Compose
- Dokumentasi `docs/ALL_IN_ONE_VPS.md` yang jelas
- Docker configuration yang proper
- Nginx reverse proxy setup

### ❌ Masalah yang Ditemukan:
- 6 file masih mengandung referensi Supabase
- Credentials ter-expose di repository
- Konfigurasi database tidak sesuai dengan infrastruktur VPS
- Security risk akibat credentials yang ter-expose

---

## 🚨 PRIORITAS 1: CRITICAL (HARI 1-2)

### Tugas 1.1: Update Semua File `.env`
**Estimasi:** 1 jam  
**Status:** ⏳ PENDING  
**Priority:** 🔴 CRITICAL

#### File yang perlu diupdate:

1. **`.env` (Root Directory)**
   ```bash
   # HAPUS atau UPDATE dengan:
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

2. **`apps/web/.env`**
   ```bash
   # Frontend hanya perlu API URL
   NEXT_PUBLIC_API_URL=https://api.beritakarya.co
   NEXT_PUBLIC_URL=https://beritakarya.co
   ```

3. **`apps/api/.env`**
   ```bash
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

#### Langkah-langkah:
```bash
# 1. Backup file yang ada
cp .env .env.backup
cp apps/web/.env apps/web/.env.backup
cp apps/api/.env apps/api/.env.backup

# 2. Update file dengan konfigurasi yang benar
# (Copy-paste konfigurasi di atas)

# 3. Generate password yang kuat
openssl rand -base64 32  # Untuk POSTGRES_PASSWORD
openssl rand -base64 64  # Untuk JWT_SECRET

# 4. Verifikasi perubahan
cat .env
cat apps/web/.env
cat apps/api/.env
```

---

### Tugas 1.2: Hapus File Supabase
**Estimasi:** 5 menit  
**Status:** ⏳ PENDING  
**Priority:** 🔴 CRITICAL

#### File yang perlu dihapus:
```bash
# Hapus file Supabase setup
rm apps/api/prisma/supabase-setup.sql

# Verifikasi penghapusan
ls apps/api/prisma/
```

---

### Tugas 1.3: Update `.env.example`
**Estimasi:** 10 menit  
**Status:** ⏳ PENDING  
**Priority:** 🔴 CRITICAL

#### File: `apps/api/.env.example`
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

### Tugas 1.4: Update `.gitignore`
**Estimasi:** 5 menit  
**Status:** ⏳ PENDING  
**Priority:** 🔴 CRITICAL

#### File: `.gitignore`
```bash
# Environment Variables
.env
.env.local
.env.production
.env.*.local

# Apps
apps/api/.env
apps/web/.env
apps/web/.env.local

# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Database
*.db
*.sqlite
*.sqlite3

# Uploads
uploads/
temp/

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# Build
dist/
build/
.next/
out/

# Dependencies
node_modules/
.pnpm-store/
```

---

### Tugas 1.5: Remove dari Git Tracking
**Estimasi:** 10 menit  
**Status:** ⏳ PENDING  
**Priority:** 🔴 CRITICAL

#### Langkah-langkah:
```bash
# 1. Remove dari git tracking (jangan hapus file lokal)
git rm --cached .env
git rm --cached apps/web/.env
git rm --cached apps/web/.env.local
git rm --cached apps/api/.env

# 2. Commit perubahan
git add .gitignore
git commit -m "fix: remove .env files from git and update .gitignore"

# 3. Push ke repository
git push origin main
```

---

## 🔐 PRIORITAS 2: SECURITY (HARI 2-3)

### Tugas 2.1: Rotate Database Password
**Estimasi:** 30 menit  
**Status:** ⏳ PENDING  
**Priority:** 🔴 CRITICAL

#### Langkah-langkah:
```bash
# 1. Generate password baru
NEW_PASSWORD=$(openssl rand -base64 32)

# 2. Update file .env.production di VPS
# SSH ke VPS
ssh user@your-vps-ip

# 3. Update environment variables
nano .env.production
# Ganti POSTGRES_PASSWORD dengan password baru

# 4. Restart container
docker compose -f infra/docker/docker-compose.backend.yml down
docker compose -f infra/docker/docker-compose.backend.yml up -d

# 5. Verifikasi koneksi database
docker exec -it beritakarya_api npx prisma db push
```

---

### Tugas 2.2: Rotate JWT_SECRET
**Estimasi:** 20 menit  
**Status:** ⏳ PENDING  
**Priority:** 🔴 CRITICAL

#### Langkah-langkah:
```bash
# 1. Generate JWT_SECRET baru
NEW_JWT_SECRET=$(openssl rand -base64 64)

# 2. Update file .env.production di VPS
nano .env.production
# Ganti JWT_SECRET dengan secret baru

# 3. Restart container
docker compose -f infra/docker/docker-compose.backend.yml restart api

# 4. Test authentication
# Login ulang untuk mendapatkan token baru
```

---

### Tugas 2.3: Hapus Project Supabase
**Estimasi:** 15 menit  
**Status:** ⏳ PENDING  
**Priority:** 🔴 CRITICAL

#### Langkah-langkah:
```bash
# 1. Login ke Supabase Dashboard
# https://supabase.com/dashboard

# 2. Pilih project yang tidak digunakan
# Project ID: rmaqbqkemocbyrvqxpfi

# 3. Hapus project
# Settings → General → Delete Project

# 4. Verifikasi penghapusan
# Pastikan project tidak muncul lagi di dashboard
```

---

### Tugas 2.4: Implement Password Strength Requirements
**Estimasi:** 1 jam  
**Status:** ⏳ PENDING  
**Priority:** 🔴 HIGH

#### File: `apps/api/src/modules/auth/auth.controller.ts`
```typescript
const passwordSchema = z.object({
  password: z.string()
    .min(8, 'Password minimal 8 karakter')
    .regex(/[A-Z]/, 'Harus mengandung huruf kapital')
    .regex(/[0-9]/, 'Harus mengandung angka')
    .regex(/[^A-Za-z0-9]/, 'Harus mengandung karakter spesial')
})

const registerSchema = z.object({
  email: z.string().email(),
  password: passwordSchema,
  name: z.string().min(2),
  siteId: z.string().nullable().default(null)
})
```

---

### Tugas 2.5: Implement Account Lockout
**Estimasi:** 1.5 jam  
**Status:** ⏳ PENDING  
**Priority:** 🔴 HIGH

#### File Baru: `apps/api/src/lib/accountLockout.ts`
```typescript
const MAX_ATTEMPTS = 5
const LOCKOUT_DURATION = 15 * 60 * 1000 // 15 minutes

interface FailedAttempt {
  count: number
  lastAttempt: Date
}

const failedAttempts = new Map<string, FailedAttempt>()

export function checkAccountLockout(email: string): boolean {
  const attempt = failedAttempts.get(email)
  if (!attempt) return false
  
  const timeSinceLastAttempt = Date.now() - attempt.lastAttempt.getTime()
  if (timeSinceLastAttempt > LOCKOUT_DURATION) {
    failedAttempts.delete(email)
    return false
  }
  
  return attempt.count >= MAX_ATTEMPTS
}

export function recordFailedAttempt(email: string): void {
  const attempt = failedAttempts.get(email) || { count: 0, lastAttempt: new Date() }
  attempt.count++
  attempt.lastAttempt = new Date()
  failedAttempts.set(email, attempt)
}

export function resetFailedAttempts(email: string): void {
  failedAttempts.delete(email)
}
```

#### Update: `apps/api/src/modules/auth/auth.controller.ts`
```typescript
import { checkAccountLockout, recordFailedAttempt, resetFailedAttempts } from '../../lib/accountLockout'

authRouter.post('/login', asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = loginSchema.parse(req.body)
  
  // Check account lockout
  if (checkAccountLockout(email)) {
    return res.status(429).json({
      success: false,
      error: {
        code: 'ACCOUNT_LOCKED',
        message: 'Akun terkunci sementara. Coba lagi dalam 15 menit.'
      }
    })
  }
  
  try {
    const result = await authService.loginUser(email, password)
    resetFailedAttempts(email)
    res.json({ success: true, data: result })
  } catch (error) {
    recordFailedAttempt(email)
    throw error
  }
}))
```

---

### Tugas 2.6: Add HSTS Header
**Estimasi:** 15 menit  
**Status:** ⏳ PENDING  
**Priority:** 🔴 HIGH

#### File: `apps/api/src/middleware/security.middleware.ts`
```typescript
export function securityHeadersMiddleware(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  // ... existing headers ...

  // Add HSTS
  res.setHeader(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  )

  // Add XSS Protection
  res.setHeader('X-XSS-Protection', '1; mode=block')

  next()
}
```

---

## 🏗️ PRIORITAS 3: INFRASTRUCTURE (HARI 3-5)

### Tugas 3.1: Setup Database dengan Prisma di VPS
**Estimasi:** 2 jam  
**Status:** ⏳ PENDING  
**Priority:** 🔴 HIGH

#### Langkah-langkah:
```bash
# 1. SSH ke VPS
ssh user@your-vps-ip

# 2. Navigate ke project directory
cd /path/to/beritakarya

# 3. Pull latest code
git pull origin main

# 4. Build Docker images
docker compose -f infra/docker/docker-compose.backend.yml build

# 5. Start containers
docker compose -f infra/docker/docker-compose.backend.yml up -d

# 6. Wait for database to be ready
docker logs beritakarya_postgres

# 7. Generate Prisma client
docker exec -it beritakarya_api npx prisma generate

# 8. Push database schema
docker exec -it beritakarya_api npx prisma db push

# 9. Verify database
docker exec -it beritakarya_api npx prisma studio
# Buka http://localhost:5555 untuk melihat database

# 10. Test API
curl http://localhost:3001/health
```

---

### Tugas 3.2: Setup Nginx Reverse Proxy
**Estimasi:** 1 jam  
**Status:** ⏳ PENDING  
**Priority:** 🔴 HIGH

#### File: `/etc/nginx/sites-available/api.beritakarya.co`
```nginx
server {
    listen 80;
    server_name api.beritakarya.co;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.beritakarya.co;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/api.beritakarya.co/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.beritakarya.co/privkey.pem;

    # SSL Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security Headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Proxy Settings
    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health Check
    location /health {
        proxy_pass http://localhost:3001/health;
        access_log off;
    }
}
```

#### Langkah-langkah:
```bash
# 1. Create Nginx config
sudo nano /etc/nginx/sites-available/api.beritakarya.co

# 2. Enable site
sudo ln -s /etc/nginx/sites-available/api.beritakarya.co /etc/nginx/sites-enabled/

# 3. Test Nginx config
sudo nginx -t

# 4. Restart Nginx
sudo systemctl restart nginx

# 5. Setup SSL with Certbot
sudo certbot --nginx -d api.beritakarya.co
```

---

### Tugas 3.3: Setup SSL dengan Certbot
**Estimasi:** 30 menit  
**Status:** ⏳ PENDING  
**Priority:** 🔴 HIGH

#### Langkah-langkah:
```bash
# 1. Install Certbot (jika belum)
sudo apt update
sudo apt install certbot python3-certbot-nginx -y

# 2. Request SSL certificate
sudo certbot --nginx -d api.beritakarya.co

# 3. Follow prompts:
# - Enter email address
# - Agree to terms
# - Choose to redirect HTTP to HTTPS

# 4. Verify SSL
curl https://api.beritakarya.co/health

# 5. Setup auto-renewal
sudo certbot renew --dry-run

# 6. Check auto-renewal timer
sudo systemctl status certbot.timer
```

---

### Tugas 3.4: Setup Docker Compose untuk Production
**Estimasi:** 1.5 jam  
**Status:** ⏳ PENDING  
**Priority:** 🔴 HIGH

#### File: `.env.production` (di VPS)
```env
# Database Internal (Docker)
POSTGRES_USER=beritakarya
POSTGRES_PASSWORD=YOUR_STRONG_PASSWORD_HERE
POSTGRES_DB=beritakarya_prod

# Koneksi Prisma ke Database Docker (Internal Network)
DATABASE_URL="postgresql://beritakarya:YOUR_STRONG_PASSWORD_HERE@postgres:5432/beritakarya_prod"
DIRECT_URL="postgresql://beritakarya:YOUR_STRONG_PASSWORD_HERE@postgres:5432/beritakarya_prod"

# JWT & AI
JWT_SECRET=YOUR_RANDOM_STRING_64_CHARACTERS_HERE
OPENAI_API_KEY=sk-your-openai-key-here

# Apps Config
WEB_URL=https://beritakarya.co
API_URL=https://api.beritakarya.co
NODE_ENV=production
PORT=3001
```

#### Langkah-langkah:
```bash
# 1. Create .env.production file
nano .env.production

# 2. Paste configuration above
# Ganti YOUR_STRONG_PASSWORD_HERE dengan password yang kuat
# Ganti YOUR_RANDOM_STRING_64_CHARACTERS_HERE dengan random string

# 3. Set proper permissions
chmod 600 .env.production

# 4. Test Docker Compose
docker compose -f infra/docker/docker-compose.backend.yml config

# 5. Start services
docker compose -f infra/docker/docker-compose.backend.yml up -d

# 6. Check logs
docker compose -f infra/docker/docker-compose.backend.yml logs -f
```

---

### Tugas 3.5: Implement Database Backup Strategy
**Estimasi:** 1.5 jam  
**Status:** ⏳ PENDING  
**Priority:** 🔴 HIGH

#### Script: `infra/scripts/backup-database.sh`
```bash
#!/bin/bash

# Database Backup Script for BeritaKarya
# Usage: ./backup-database.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/beritakarya"
BACKUP_FILE="$BACKUP_DIR/beritakarya_backup_$DATE.sql"

# Create backup directory if not exists
mkdir -p $BACKUP_DIR

# Backup database
docker exec beritakarya_postgres pg_dump -U beritakarya beritakarya_prod > $BACKUP_FILE

# Compress backup
gzip $BACKUP_FILE

# Keep only last 7 days of backups
find $BACKUP_DIR -name "beritakarya_backup_*.sql.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_FILE.gz"
```

#### Setup Cron Job:
```bash
# 1. Make script executable
chmod +x infra/scripts/backup-database.sh

# 2. Copy to VPS
scp infra/scripts/backup-database.sh user@your-vps-ip:/usr/local/bin/

# 3. Setup cron job (daily at 2 AM)
crontab -e

# Add this line:
0 2 * * * /usr/local/bin/backup-database.sh >> /var/log/beritakarya-backup.log 2>&1

# 4. Test backup script
/usr/local/bin/backup-database.sh

# 5. Verify backup
ls -lh /var/backups/beritakarya/
```

---

## 🧪 PRIORITAS 4: TESTING (HARI 5-7)

### Tugas 4.1: Test Database Connection
**Estimasi:** 30 menit  
**Status:** ⏳ PENDING  
**Priority:** 🔴 HIGH

#### Langkah-langkah:
```bash
# 1. Test Prisma connection
docker exec -it beritakarya_api npx prisma db pull

# 2. Test database schema
docker exec -it beritakarya_api npx prisma validate

# 3. Test database push
docker exec -it beritakarya_api npx prisma db push --force-reset

# 4. Verify tables
docker exec -it beritakarya_postgres psql -U beritakarya -d beritakarya_prod -c "\dt"

# 5. Test API health check
curl http://localhost:3001/health

# 6. Test API with SSL
curl https://api.beritakarya.co/health
```

---

### Tugas 4.2: Test Authentication
**Estimasi:** 1 jam  
**Status:** ⏳ PENDING  
**Priority:** 🔴 HIGH

#### Test Cases:
```bash
# 1. Test Register
curl -X POST https://api.beritakarya.co/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!",
    "name": "Test User"
  }'

# 2. Test Login
curl -X POST https://api.beritakarya.co/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!"
  }'

# 3. Test Protected Route
curl -X GET https://api.beritakarya.co/api/v1/users \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# 4. Test Account Lockout (5 failed attempts)
for i in {1..6}; do
  curl -X POST https://api.beritakarya.co/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email": "test@example.com", "password": "wrongpass"}'
done

# 5. Test Rate Limiting
for i in {1..15}; do
  curl https://api.beritakarya.co/api/v1/articles
done
```

---

### Tugas 4.3: Test API Endpoints
**Estimasi:** 2 jam  
**Status:** ⏳ PENDING  
**Priority:** 🔴 HIGH

#### Test Script: `test-api.sh`
```bash
#!/bin/bash

API_URL="https://api.beritakarya.co"

echo "Testing API Endpoints..."

# Health Check
echo "1. Health Check"
curl -s $API_URL/health | jq .

# Articles
echo "2. Get Articles"
curl -s $API_URL/api/v1/articles | jq .

# Categories
echo "3. Get Categories"
curl -s $API_URL/api/v1/categories | jq .

# Sites
echo "4. Get Sites"
curl -s $API_URL/api/v1/sites | jq .

echo "API Tests Completed!"
```

---

### Tugas 4.4: Test File Upload
**Estimasi:** 1 jam  
**Status:** ⏳ PENDING  
**Priority:** 🔴 HIGH

#### Langkah-langkah:
```bash
# 1. Create test image
echo "Test image" > test.txt

# 2. Test upload
curl -X POST https://api.beritakarya.co/api/v1/media/upload \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "file=@test.txt"

# 3. Verify upload
# Check uploads directory in VPS
docker exec beritakarya_api ls -lh uploads/

# 4. Test image optimization
# Upload a large image and check if it's optimized
```

---

### Tugas 4.5: Test AI Integration
**Estimasi:** 1.5 jam  
**Status:** ⏳ PENDING  
**Priority:** 🔴 HIGH

#### Langkah-langkah:
```bash
# 1. Test AI Write
curl -X POST https://api.beritakarya.co/api/v1/ai/write \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "expand",
    "content": "Berita terbaru tentang teknologi"
  }'

# 2. Test AI Optimize
curl -X POST https://api.beritakarya.co/api/v1/ai/optimize \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Your content here"
  }'

# 3. Check AI Usage
curl -X GET https://api.beritakarya.co/api/v1/ai/usage \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# 4. Verify AI Usage in Database
docker exec -it beritakarya_postgres psql -U beritakarya -d beritakarya_prod \
  -c "SELECT * FROM \"AIUsage\" ORDER BY createdAt DESC LIMIT 5;"
```

---

## 📊 PRIORITAS 5: MONITORING (HARI 7-9)

### Tugas 5.1: Setup Uptime Monitoring
**Estimasi:** 2 jam  
**Status:** ⏳ PENDING  
**Priority:** 🔴 HIGH

#### Langkah-langkah:
```bash
# 1. Install Uptime Robot (free)
# https://uptimerobot.com/

# 2. Add monitor for API
# - URL: https://api.beritakarya.co/health
# - Check interval: 5 minutes
# - Alert: Email when down

# 3. Add monitor for Frontend
# - URL: https://beritakarya.co
# - Check interval: 5 minutes
# - Alert: Email when down

# 4. Setup status page
# Create status.beritakarya.co with Uptime Robot
```

---

### Tugas 5.2: Setup Error Tracking (Sentry)
**Estimasi:** 2.5 jam  
**Status:** ⏳ PENDING  
**Priority:** 🔴 HIGH

#### Langkah-langkah:
```bash
# 1. Create Sentry account
# https://sentry.io/

# 2. Create new project
# - Name: BeritaKarya API
# - Platform: Node.js

# 3. Install Sentry SDK
cd apps/api
pnpm add @sentry/node

# 4. Initialize Sentry
npx @sentry/wizard@latest -i next

# 5. Update code to use Sentry
# apps/api/src/main.ts
import * as Sentry from "@sentry/node"

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});

# 6. Test error tracking
# Trigger an error and check Sentry dashboard
```

---

### Tugas 5.3: Setup Log Aggregation
**Estimasi:** 2 jam  
**Status:** ⏳ PENDING  
**Priority:** 🔴 HIGH

#### Langkah-langkah:
```bash
# 1. Setup log rotation
sudo nano /etc/logrotate.d/beritakarya

# Add this content:
/var/log/beritakarya/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        docker compose -f /path/to/beritakarya/infra/docker/docker-compose.backend.yml restart api
    endscript
}

# 2. Test log rotation
sudo logrotate -f /etc/logrotate.d/beritakarya --debug

# 3. Setup log monitoring
# Install logwatch
sudo apt install logwatch -y

# 4. Configure logwatch
sudo nano /etc/logwatch/conf/logwatch.conf

# 5. Test logwatch
sudo logwatch --range today
```

---

### Tugas 5.4: Setup Performance Monitoring
**Estimasi:** 2.5 jam  
**Status:** ⏳ PENDING  
**Priority:** 🔴 HIGH

#### Langkah-langkah:
```bash
# 1. Install New Relic (free tier)
# https://newrelic.com/

# 2. Install New Relic agent
cd apps/api
pnpm add newrelic

# 3. Initialize New Relic
npx newrelic init

# 4. Update configuration
# newrelic.js
exports.config = {
  app_name: ['BeritaKarya API'],
  license_key: process.env.NEW_RELIC_LICENSE_KEY,
  logging: {
    level: 'info'
  }
}

# 5. Test monitoring
# Make some API calls and check New Relic dashboard

# 6. Setup alerts
# - CPU usage > 80%
# - Memory usage > 80%
# - Response time > 2s
# - Error rate > 5%
```

---

## 📝 PRIORITAS 6: DOCUMENTATION (HARI 9-10)

### Tugas 6.1: Update README.md
**Estimasi:** 1.5 jam  
**Status:** ⏳ PENDING  
**Priority:** 🔴 HIGH

#### Updates needed:
```markdown
# BeritaKarya 📰

Platform publikasi berita multi-tenant modern kelas dunia dengan asisten AI terintegrasi, alur kerja editorial profesional, dan sistem analitik real-time.

## 🚀 Fitur Unggulan

### 🏛️ Arsitektur Multi-Tenant Dinamis
Satu core engine untuk mengelola jaringan portal berita (Pusat & Daerah). Konfigurasi domain dinamis yang dikelola via database, memungkinkan penambahan situs baru tanpa redeploy aplikasi.

### ✍️ Editorial Workflow Profesional
- **Block-based Editor**: Editor artikel fleksibel (teks, gambar, quote, grid).
- **Review Queue**: Alur kerja formal: `Draft` → `Submitted` → `Review` → `Scheduled` → `Published`.
- **Article Versioning**: Simpan snapshot konten dan pulihkan versi lama kapan saja.
- **Kalender Editorial**: Visualisasi jadwal terbit dalam tampilan kalender bulanan.

### 📊 Analytics & Monitoring
- **Real-time Traffic**: Visualisasi data pembaca menggunakan Recharts.
- **Monitor Tim**: Pantau produktivitas wartawan (output harian, views, status online).
- **Audit Log**: Transparansi penuh aksi administratif (siapa mengubah apa, kapan, dan IP address).

### 🤖 Smart Assistant (AI)
- **AI Content Helper**: Menulis ulang, memperluas paragraf, dan optimasi headline.
- **Automated Metadata**: Ekstraksi meta tags dan saran SEO otomatis.
- **Usage Tracking**: Audit penggunaan token AI per user/site.

### 🖼️ Manajemen Media & SEO
- **Media Manager**: Optimasi otomatis ke WebP, resize, watermarking, dan manajemen metadata IPTC.
- **SEO Panel**: Preview OpenGraph (FB) & Twitter Cards secara real-time sebelum publikasi.
- **Reader Tools**: Font size adjuster, Print-friendly view, dan sistem komentar premium.

## 🛠️ Tech Stack

### Frontend & Dashboard
- **Next.js 16** (App Router)
- **React** & **TypeScript**
- **Tailwind CSS** & **Framer Motion**
- **Zustand** (State Management)
- **Lucide React** (Icons)

### Backend & API
- **Node.js** & **Express.js**
- **Prisma ORM** (PostgreSQL)
- **Server-Sent Events (SSE)** untuk real-time notifications
- **Sharp** (Image Processing)
- **JWT** (Authentication)

### Infrastructure
- **Docker** & **Docker Compose**
- **Nginx** (Reverse Proxy)
- **PostgreSQL** (Self-hosted di VPS)
- **Certbot** (SSL/TLS)

## 📁 Struktur Monorepo

\`\`\`text
beritakarya/
├── apps/
│   ├── api/          # Express.js Backend (Prisma, Multer, Sharp, SSE)
│   └── web/          # Next.js Frontend (Tailwind, Recharts, Framer Motion)
├── packages/         # Shared TypeScript interfaces
├── infra/            # Docker, Nginx, & CI/CD configurations
└── docs/             # Dokumentasi teknis & workflow editorial
\`\`\`

## 🛠️ Instalasi & Pengembangan

### Prerequisites
- Node.js v18+ & PNPM
- PostgreSQL 15+ (via Docker)
- VPS dengan Ubuntu 22.04+

### 1. Clone Repository
\`\`\`bash
git clone https://github.com/sabdakarya77-spec/beritakarya.git
cd beritakarya
\`\`\`

### 2. Install Dependencies
\`\`\`bash
pnpm install
\`\`\`

### 3. Setup Environment
\`\`\`bash
# Copy example files
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# Update environment variables
nano apps/api/.env
nano apps/web/.env
\`\`\`

### 4. Generate Prisma Client
\`\`\`bash
pnpm db:generate
\`\`\`

### 5. Run Development
\`\`\`bash
pnpm dev
\`\`\`

## 🚀 Deployment

### VPS Deployment (Recommended)
Lihat [Panduan All-in-One VPS](./docs/ALL_IN_ONE_VPS.md) untuk deployment lengkap.

### Quick Start
\`\`\`bash
# 1. SSH ke VPS
ssh user@your-vps-ip

# 2. Clone repository
git clone https://github.com/sabdakarya77-spec/beritakarya.git
cd beritakarya

# 3. Setup environment
nano .env.production

# 4. Start services
docker compose -f infra/docker/docker-compose.backend.yml up -d

# 5. Setup SSL
sudo certbot --nginx -d api.beritakarya.co
\`\`\`

## 🔐 Keamanan & Akses (RBAC)

1. **Superadmin**: Akses global lintas portal, manajemen situs, dan audit log pusat.
2. **Pimpinan Redaksi**: Manajemen redaksi daerah, approval artikel, dan statistik tim.
3. **Journalist**: Penulisan artikel dan pengiriman draft ke antrian review.
4. **Reader**: Akses publik, komentar, dan personalisasi bacaan.

## 📄 Dokumentasi

- [Workflow Editorial](./docs/EDITORIAL_WORKFLOW.md)
- [Skema Database](./docs/DATABASE_SCHEMA.md)
- [Panduan VPS](./docs/ALL_IN_ONE_VPS.md)
- [Panduan Produksi](./docs/PRODUCTION_SETUP.md)

## 🤝 Kontribusi

1. Fork repository
2. Buat branch baru (\`git checkout -b feature/AmazingFeature\`)
3. Commit perubahan (\`git commit -m 'Add some AmazingFeature'\`)
4. Push ke branch (\`git push origin feature/AmazingFeature\`)
5. Buka Pull Request

## 📞 Support

Untuk pertanyaan atau dukungan, hubungi tim development.

---

**© 2026 BeritaKarya Global Media. *Jernih Melihat Nusantara.*
\`\`\`
```

---

### Tugas 6.2: Update PRODUCTION_SETUP.md
**Estimasi:** 1.5 jam  
**Status:** ⏳ PENDING  
**Priority:** 🔴 HIGH

#### Updates needed:
- Hapus semua referensi ke Supabase
- Tambahkan section tentang Prisma di VPS
- Update langkah-langkah deployment
- Tambahkan troubleshooting section

---

### Tugas 6.3: Create TROUBLESHOOTING.md
**Estimasi:** 2 jam  
**Status:** ⏳ PENDING  
**Priority:** 🔴 HIGH

#### File: `docs/TROUBLESHOOTING.md`
```markdown
# Troubleshooting Guide

## Database Issues

### Database Connection Failed
**Problem:** API tidak bisa connect ke database

**Solution:**
\`\`\`bash
# 1. Check container status
docker ps

# 2. Check database logs
docker logs beritakarya_postgres

# 3. Test database connection
docker exec -it beritakarya_postgres psql -U beritakarya -d beritakarya_prod -c "SELECT 1"

# 4. Restart containers
docker compose -f infra/docker/docker-compose.backend.yml restart

# 5. Check environment variables
docker exec -it beritakarya_api env | grep DATABASE_URL
\`\`\`

### Prisma Migration Failed
**Problem:** Prisma db push gagal

**Solution:**
\`\`\`bash
# 1. Generate Prisma client
docker exec -it beritakarya_api npx prisma generate

# 2. Validate schema
docker exec -it beritakarya_api npx prisma validate

# 3. Force reset (WARNING: akan menghapus semua data)
docker exec -it beritakarya_api npx prisma db push --force-reset

# 4. Check migration status
docker exec -it beritakarya_api npx prisma migrate status
\`\`\`

## API Issues

### API Not Responding
**Problem:** API tidak merespon

**Solution:**
\`\`\`bash
# 1. Check API logs
docker logs beritakarya_api

# 2. Check API health
curl http://localhost:3001/health

# 3. Restart API container
docker restart beritakarya_api

# 4. Check Nginx status
sudo systemctl status nginx

# 5. Test Nginx config
sudo nginx -t
\`\`\`

### Authentication Failed
**Problem:** Login tidak berhasil

**Solution:**
\`\`\`bash
# 1. Check JWT_SECRET
docker exec -it beritakarya_api env | grep JWT_SECRET

# 2. Check database user
docker exec -it beritakarya_postgres psql -U beritakarya -d beritakarya_prod -c "SELECT * FROM \"User\" LIMIT 5"

# 3. Test authentication manually
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
\`\`\`

## SSL Issues

### SSL Certificate Expired
**Problem:** SSL certificate expired

**Solution:**
\`\`\`bash
# 1. Renew certificate
sudo certbot renew

# 2. Test renewal
sudo certbot renew --dry-run

# 3. Check certificate expiry
sudo certbot certificates

# 4. Restart Nginx
sudo systemctl restart nginx
\`\`\`

### SSL Not Working
**Problem:** HTTPS tidak berfungsi

**Solution:**
\`\`\`bash
# 1. Check Nginx SSL config
sudo cat /etc/nginx/sites-available/api.beritakarya.co

# 2. Check certificate files
ls -la /etc/letsencrypt/live/api.beritakarya.co/

# 3. Test SSL configuration
sudo nginx -t

# 4. Check firewall
sudo ufw status

# 5. Allow HTTPS
sudo ufw allow 443/tcp
sudo ufw allow 80/tcp
\`\`\`

## Performance Issues

### Slow API Response
**Problem:** API response lambat

**Solution:**
\`\`\`bash
# 1. Check system resources
htop

# 2. Check database performance
docker exec -it beritakarya_postgres psql -U beritakarya -d beritakarya_prod -c "SELECT * FROM pg_stat_activity"

# 3. Check slow queries
docker exec -it beritakarya_postgres psql -U beritakarya -d beritakarya_prod -c "SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10"

# 4. Restart containers
docker compose -f infra/docker/docker-compose.backend.yml restart

# 5. Check logs for errors
docker logs beritakarya_api --tail 100
\`\`\`

### High Memory Usage
**Problem:** Memory usage tinggi

**Solution:**
\`\`\`bash
# 1. Check memory usage
docker stats

# 2. Check Node.js memory
docker exec -it beritakarya_api node -e "console.log(process.memoryUsage())"

# 3. Restart containers
docker compose -f infra/docker/docker-compose.backend.yml restart

# 4. Check for memory leaks
# Use Node.js profiler
\`\`\`

## Docker Issues

### Container Not Starting
**Problem:** Container tidak bisa start

**Solution:**
\`\`\`bash
# 1. Check container logs
docker logs beritakarya_api
docker logs beritakarya_postgres

# 2. Check container status
docker ps -a

# 3. Rebuild containers
docker compose -f infra/docker/docker-compose.backend.yml down
docker compose -f infra/docker/docker-compose.backend.yml build
docker compose -f infra/docker/docker-compose.backend.yml up -d

# 4. Check disk space
df -h

# 5. Clean up unused resources
docker system prune -a
\`\`\`

### Volume Issues
**Problem:** Data tidak tersimpan

**Solution:**
\`\`\`bash
# 1. Check volumes
docker volume ls

# 2. Check volume details
docker volume inspect beritakarya_postgres_data

# 3. Backup data
docker run --rm -v beritakarya_postgres_data:/data -v $(pwd):/backup ubuntu tar czf /backup/postgres_backup.tar.gz /data

# 4. Restore data
docker run --rm -v beritakarya_postgres_data:/data -v $(pwd):/backup ubuntu tar xzf /backup/postgres_backup.tar.gz -C /
\`\`\`

## Getting Help

Jika masalah tidak teratasi:
1. Cek logs: \`docker logs <container_name>\`
2. Cek dokumentasi: \`docs/\`
3. Hubungi tim development
4. Buat issue di GitHub
```

---

### Tugas 6.4: Create DEPLOYMENT_CHECKLIST.md
**Estimasi:** 1.5 jam  
**Status:** ⏳ PENDING  
**Priority:** 🔴 HIGH

#### File: `docs/DEPLOYMENT_CHECKLIST.md`
```markdown
# Deployment Checklist

## Pre-Deployment

### Environment Setup
- [ ] VPS sudah disewa dan bisa diakses via SSH
- [ ] Domain sudah diarahkan ke IP VPS (A Record)
- [ ] Docker sudah terinstall di VPS
- [ ] Docker Compose sudah terinstall di VPS
- [ ] Nginx sudah terinstall di VPS
- [ ] Certbot sudah terinstall di VPS

### Code Preparation
- [ ] Semua `.env` files sudah dihapus dari git
- [ ] `.gitignore` sudah diupdate
- [ ] Semua referensi Supabase sudah dihapus
- [ ] Database schema sudah valid
- [ ] Semua tests sudah passing
- [ ] Code sudah di-build tanpa error

### Security
- [ ] Password database sudah diganti dengan password yang kuat
- [ ] JWT_SECRET sudah diganti dengan random string
- [ ] SSL certificate sudah terinstall
- [ ] Firewall sudah dikonfigurasi
- [ ] SSH key-based authentication sudah diaktifkan

## Deployment

### Database Setup
- [ ] PostgreSQL container sudah berjalan
- [ ] Prisma client sudah di-generate
- [ ] Database schema sudah di-push
- [ ] Seed data sudah dijalankan (jika diperlukan)
- [ ] Database connection sudah terverifikasi

### API Setup
- [ ] API container sudah berjalan
- [ ] Health check endpoint sudah merespon
- [ ] Environment variables sudah terkonfigurasi
- [ ] Logs sudah terkonfigurasi
- [ ] Error tracking sudah di-setup

### Frontend Setup
- [ ] Frontend sudah di-deploy ke Vercel
- [ ] Environment variables sudah dikonfigurasi
- [ ] API URL sudah terkonfigurasi
- [ ] Build sudah berhasil
- [ ] Frontend sudah bisa diakses

### SSL Setup
- [ ] SSL certificate sudah terinstall
- [ ] HTTP sudah redirect ke HTTPS
- [ ] SSL certificate sudah auto-renew
- [ ] SSL configuration sudah terverifikasi

## Post-Deployment

### Verification
- [ ] API bisa diakses via HTTPS
- [ ] Frontend bisa diakses via HTTPS
- [ ] Authentication sudah berfungsi
- [ ] Database connection sudah stabil
- [ ] File upload sudah berfungsi
- [ ] AI integration sudah berfungsi

### Monitoring
- [ ] Uptime monitoring sudah di-setup
- [ ] Error tracking sudah di-setup
- [ ] Log aggregation sudah di-setup
- [ ] Performance monitoring sudah di-setup
- [ ] Alert system sudah di-setup

### Backup
- [ ] Database backup sudah di-setup
- [ ] Backup schedule sudah dikonfigurasi
- [ ] Backup restore sudah di-test
- [ ] Backup retention policy sudah di-set

### Documentation
- [ ] README sudah di-update
- [ ] Deployment guide sudah di-update
- [ ] Troubleshooting guide sudah dibuat
- [ ] API documentation sudah di-update
- [ ] Architecture diagram sudah dibuat

## Security Verification

### Authentication & Authorization
- [ ] Password strength requirements sudah diimplement
- [ ] Account lockout sudah diimplement
- [ ] Rate limiting sudah di-test
- [ ] JWT token rotation sudah diimplement
- [ ] Role-based access control sudah di-test

### Security Headers
- [ ] HSTS header sudah diimplement
- [ ] CSP header sudah diimplement
- [ ] XSS protection sudah diimplement
- [ ] Clickjacking protection sudah di-test
- [ ] MIME type sniffing prevention sudah di-test

### Input Validation
- [ ] Zod validation sudah diimplement
- [ ] DOMPurify sanitization sudah di-test
- [ ] SQL injection protection sudah di-test
- [ ] XSS protection sudah di-test
- [ ] CSRF protection sudah di-test

## Performance Verification

### Database Performance
- [ ] Database indexing sudah optimal
- [ ] Query optimization sudah diimplement
- [ ] Connection pooling sudah dikonfigurasi
- [ ] Slow query monitoring sudah di-setup
- [ ] Database backup sudah di-setup

### API Performance
- [ ] Response time < 200ms
- [ ] Error rate < 1%
- [ ] Uptime > 99.9%
- [ ] Rate limiting sudah diimplement
- [ ] Caching sudah diimplement

### Frontend Performance
- [ ] Page load time < 1s
- [ ] Core Web Vitals sudah passing
- [ ] Image optimization sudah diimplement
- [ ] Code splitting sudah diimplement
- [ ] Lazy loading sudah diimplement

## Final Verification

### Functional Testing
- [ ] User registration sudah berfungsi
- [ ] User login sudah berfungsi
- [ ] Article creation sudah berfungsi
- [ ] Article publishing sudah berfungsi
- [ ] Media upload sudah berfungsi
- [ ] AI features sudah berfungsi

### Integration Testing
- [ ] Frontend-Backend integration sudah berfungsi
- [ ] Database integration sudah stabil
- [ ] Third-party services sudah terintegrasi
- [ ] Email notifications sudah berfungsi
- [ ] Real-time updates sudah berfungsi

### Load Testing
- [ ] System sudah di-test dengan 100 concurrent users
- [ ] System sudah di-test dengan 1000 concurrent users
- [ ] Database sudah di-test dengan high load
- [ ] API sudah di-test dengan high load
- [ ] Frontend sudah di-test dengan high load

## Sign-off

### Team Approval
- [ ] Senior Developer: _______________
- [ ] DevOps Engineer: _______________
- [ ] Security Specialist: _______________
- [ ] Product Owner: _______________

### Deployment Date: _______________
### Go-Live Date: _______________
```

---

## 🔄 PRIORITAS 7: CI/CD (HARI 10-12)

### Tugas 7.1: Setup GitHub Actions CI
**Estimasi:** 3 jam  
**Status:** ⏳ PENDING  
**Priority:** 🔴 HIGH

#### File: `.github/workflows/ci.yml`
```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Lint
        run: pnpm lint

  type-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Type check
        run: pnpm type-check

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Run tests
        run: pnpm test

  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Build
        run: pnpm build

  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Run security audit
        run: |
          pnpm audit
          npm audit --audit-level=moderate
```

---

### Tugas 7.2: Setup GitHub Actions CD
**Estimasi:** 3.5 jam  
**Status:** ⏳ PENDING  
**Priority:** 🔴 HIGH

#### File: `.github/workflows/deploy.yml`
```yaml
name: Deploy to VPS

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to VPS
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /path/to/beritakarya
            git pull origin main
            docker compose -f infra/docker/docker-compose.backend.yml pull
            docker compose -f infra/docker/docker-compose.backend.yml up -d --build
            docker exec -it beritakarya_api npx prisma db push
```

---

### Tugas 7.3: Setup Automated Testing
**Estimasi:** 2.5 jam  
**Status:** ⏳ PENDING  
**Priority:** 🔴 HIGH

#### Langkah-langkah:
```bash
# 1. Install testing dependencies
cd apps/api
pnpm add -D vitest @vitest/coverage-v8 supertest

# 2. Create test configuration
# apps/api/vitest.config.mts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'dist/']
    }
  }
})

# 3. Create test files
# apps/api/src/__tests__/auth.test.ts
# apps/api/src/__tests__/articles.test.ts
# apps/api/src/__tests__/media.test.ts

# 4. Run tests
pnpm test

# 5. Generate coverage report
pnpm test -- --coverage
```

---

## 📈 PRIORITAS 8: OPTIMIZATION (HARI 12-14)

### Tugas 8.1: Implement Response Caching
**Estimasi:** 2 jam  
**Status:** ⏳ PENDING  
**Priority:** 🔴 MEDIUM

#### File: `apps/api/src/lib/cache.ts`
```typescript
import NodeCache from 'node-cache'

const cache = new NodeCache({
  stdTTL: 300, // 5 minutes default
  checkperiod: 600
})

export function getCache(key: string): any {
  return cache.get(key)
}

export function setCache(key: string, value: any, ttl?: number): void {
  cache.set(key, value, ttl)
}

export function deleteCache(key: string): void {
  cache.del(key)
}

export function clearCache(): void {
  cache.flushAll()
}
```

---

### Tugas 8.2: Implement Query Optimization
**Estimasi:** 2.5 jam  
**Status:** ⏳ PENDING  
**Priority:** 🔴 MEDIUM

#### Langkah-langkah:
```typescript
// 1. Add select for specific fields
const articles = await prisma.article.findMany({
  select: {
    id: true,
    title: true,
    slug: true,
    publishedAt: true,
    viewCount: true
  }
})

// 2. Implement pagination
const articles = await prisma.article.findMany({
  skip: (page - 1) * limit,
  take: limit,
  orderBy: { publishedAt: 'desc' }
})

// 3. Add composite indexes
// apps/api/prisma/schema.prisma
@@index([siteId, status, publishedAt])
@@index([authorId, publishedAt])

// 4. Use connection pooling
// apps/api/prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
  connection_limit = 10
}
```

---

### Tugas 8.3: Implement CDN for Static Assets
**Estimasi:** 2 jam  
**Status:** ⏳ PENDING  
**Priority:** 🔴 MEDIUM

#### Langkah-langkah:
```bash
# 1. Setup Cloudflare CDN
# https://dash.cloudflare.com/

# 2. Add domain
# Add beritakarya.co to Cloudflare

# 3. Configure caching rules
# - Static assets: 1 year
# - Images: 1 month
# - API: 5 minutes

# 4. Update DNS
# Change nameservers to Cloudflare

# 5. Test CDN
curl -I https://beritakarya.co/static/image.jpg
```

---

### Tugas 8.4: Implement Bundle Size Optimization
**Estimasi:** 2.5 jam  
**Status:** ⏳ PENDING  
**Priority:** 🔴 MEDIUM

#### Langkah-langkah:
```bash
# 1. Analyze bundle size
cd apps/web
pnpm build
pnpm analyze

# 2. Optimize dependencies
# Remove unused dependencies
pnpm remove unused-package

# 3. Implement dynamic imports
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <LoadingSpinner />,
  ssr: false
})

# 4. Optimize images
# Use Next.js Image component
import Image from 'next/image'

# 5. Enable compression
# next.config.mjs
module.exports = {
  compress: true,
  swcMinify: true
}
```

---

## 📊 SUMMARY

### Timeline Overview

| Hari | Prioritas | Tugas Utama |
|------|-----------|--------------|
| 1-2 | CRITICAL | Update .env files, hapus Supabase references |
| 2-3 | SECURITY | Rotate credentials, implement security features |
| 3-5 | INFRASTRUCTURE | Setup VPS, Docker, Nginx, SSL |
| 5-7 | TESTING | Test database, API, authentication, file upload |
| 7-9 | MONITORING | Setup uptime monitoring, error tracking, logging |
| 9-10 | DOCUMENTATION | Update README, create troubleshooting guide |
| 10-12 | CI/CD | Setup GitHub Actions, automated testing |
| 12-14 | OPTIMIZATION | Implement caching, query optimization, CDN |

### Total Estimated Time: 14 Hari (2 Minggu)

### Critical Path:
1. **Hari 1-2:** Perbaikan critical issues (Supabase vs VPS)
2. **Hari 2-3:** Security improvements
3. **Hari 3-5:** Infrastructure setup
4. **Hari 5-7:** Testing dan verification

### Success Criteria:
- ✅ Semua referensi Supabase sudah dihapus
- ✅ Database sudah berjalan di VPS dengan Prisma
- ✅ SSL sudah terinstall dan berfungsi
- ✅ Semua tests sudah passing
- ✅ Monitoring sudah di-setup
- ✅ Documentation sudah di-update
- ✅ CI/CD sudah diimplementasikan
- ✅ System sudah siap untuk production

---

## 🎯 NEXT STEPS

### Immediate (Hari Ini):
1. Mulai dengan Tugas 1.1: Update semua file `.env`
2. Lanjutkan dengan Tugas 1.2: Hapus file Supabase
3. Selesaikan Tugas 1.3-1.5: Update .gitignore dan remove dari git

### This Week:
1. Selesaikan semua tugas Priority 1-3
2. Setup infrastructure di VPS
3. Implement security improvements

### Next Week:
1. Selesaikan semua tugas Priority 4-6
2. Setup monitoring dan documentation
3. Implement CI/CD dan optimization

---

## 📞 SUPPORT

Untuk pertanyaan atau bantuan selama proses perbaikan:
1. Cek dokumentasi di folder `docs/`
2. Refer ke `SUPABASE_VPS_CONFLICT_REPORT.md` untuk detail konflik
3. Refer ke `AUDIT_REPORT_BERITAKARYA.md` untuk audit lengkap
4. Hubungi tim development jika mengalami masalah

---

**© 2026 BeritaKarya Global Media. All Rights Reserved.**
*Confidential - Internal Use Only*