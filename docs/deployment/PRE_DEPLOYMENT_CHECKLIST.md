# ✅ Pre-Deployment Checklist (Staging)

**Goal**: Verify 2 remaining items before staging deployment  
**Date**: 2025-01-13  
**Status**: ⏠ Pending Verification

---

## Item 1: Verify .env.production on Staging VPS

### What to Check
File: `/opt/beritakarya/.env.production` (or wherever your Docker compose expects it)

### Required Variables
```bash
# Database
POSTGRES_USER=beritakarya
POSTGRES_PASSWORD=<strong_password_here>
POSTGRES_DB=beritakarya

# JWT & Auth
JWT_SECRET=<min_32_characters_random_string>
JWT_REFRESH_SECRET=<another_32_char_string>

# API & Site Configuration
API_URL=https://staging-api.beritakarya.co  # or production URL
NODE_ENV=production
PORT=3001

# Redis (if using)
REDIS_URL=redis://redis:6379

# Meilisearch (if using)
MEILISEARCH_URL=http://meilisearch:7700

# OpenAI (if using AI features)
OPENAI_API_KEY=<your_key>

# Email (if using notifications)
SMTP_HOST=<smtp_server>
SMTP_PORT=587
SMTP_USER=<email_user>
SMTP_PASS=<email_password>
```

### Verification Commands
```bash
# SSH to staging VPS
ssh user@staging-beritakarya.co

# Check if .env.production exists
ls -la /opt/beritakarya/.env.production

# View contents (careful with secrets!)
cat /opt/beritakarya/.env.production | grep -E "POSTGRES|JWT|API_URL|REDIS"

# Verify Docker compose can read it
docker compose -f infra/docker/docker-compose.backend.yml config
```

### Pass Criteria
- [ ] All required variables present
- [ ] No placeholder values (e.g., "ganti_password_ini", "your_password")
- [ ] JWT_SECRET is at least 32 characters
- [ ] Database credentials match actual PostgreSQL instance
- [ ] API_URL points to correct staging domain

---

## Item 2: Test Backup Script

### Script Location
`infra/scripts/backup-database.sh`

### What to Verify
1. Script is executable
2. Can run without errors
3. Creates backup file with correct naming
4. Backup is valid (can be restored)
5. Cron job configured (optional but recommended)

### Step-by-Step Test

#### A. Check Script Permissions
```bash
ssh user@staging-beritakarya.co

# Navigate to project
cd ~/beritakarya

# Check if script exists and is executable
ls -la infra/scripts/backup-database.sh

# If not executable, make it so
chmod +x infra/scripts/backup-database.sh
```

#### B. Run Backup Manually
```bash
# Execute the script
./infra/scripts/backup-database.sh

# Expected output:
# [INFO] Starting database backup...
# [INFO] Backup saved to: backups/backup_2025-01-13_07-30-00.sql
# [INFO] Backup size: 45.2 MB
# [INFO] Backup completed successfully
```

#### C. Verify Backup File
```bash
# Check backup was created
ls -lh backups/

# Should see something like:
# -rw-r--r-- 1 user user 45M Jan 13 07:30 backup_2025-01-13_07-30-00.sql

# Test backup validity (optional but recommended)
# Create a test database and restore
createdb beritakarya_test_backup
pg_restore -U beritakarya -d beritakarya_test_backup backups/backup_2025-01-13_07-30-00.sql

# If no errors, backup is valid
dropdb beritakarya_test_backup
```

#### D. Check Cron Job (Optional)
```bash
# View cron jobs for current user
crontab -l

# Should show something like:
# 0 2 * * * /opt/beritakarya/beritakarya/infra/scripts/backup-database.sh >/dev/null 2>&1

# If not present, add it:
crontab -e
# Add: 0 2 * * * cd /opt/beritakarya/beritakarya && ./infra/scripts/backup-database.sh >/dev/null 2>&1
```

### Pass Criteria
- [ ] Script is executable (`chmod +x`)
- [ ] Backup runs without errors
- [ ] Backup file created with timestamp
- [ ] Backup file size > 0 (not empty)
- [ ] (Optional) Cron job configured for daily automated backups

---

## Sign-off

Once both items verified, sign below and proceed to staging deployment.

### Verification Sign-off

| Item | Status | Verified By | Date | Notes |
|------|--------|-------------|------|-------|
| .env.production | ⬜ | ___________ | _____ | ________________ |
| Backup script | ⬜ | ___________ | _____ | ________________ |

### Deployment Authorization

**Staging Deployment**: Can proceed after both items signed off ✅

**Production Deployment**: Requires additional:
- [ ] Staging tests all passed (Postman collection)
- [ ] No errors in staging logs (24h monitoring)
- [ ] Team sign-off on staging results

---

## Quick Commands Summary

```bash
# 1. Verify .env.production
ssh user@staging-beritakarya.co "cat /opt/beritakarya/.env.production | grep -E 'POSTGRES|JWT|API_URL'"

# 2. Test backup script
ssh user@staging-beritakarya.co "
  cd ~/beritakarya && \
  chmod +x infra/scripts/backup-database.sh && \
  ./infra/scripts/backup-database.sh && \
  ls -lh backups/
"

# 3. Deploy to staging (after verification)
ssh user@staging-beritakarya.co "
  cd ~/beritakarya && \
  git pull origin feature/multi-tenant-categories && \
  docker compose -f infra/docker/docker-compose.backend.yml up -d --build && \
  docker exec beritakarya_api pnpm prisma migrate deploy
"
```

---

## Troubleshooting

### Issue: .env.production missing
**Solution**: Copy from example and fill in real values:
```bash
cp .env.production.example .env.production
# Edit .env.production dengan real credentials
```

### Issue: Backup script fails
**Common causes**:
- Postgres credentials wrong in script
- Backup directory not writable
- Disk full

**Fix**: Edit script and adjust:
```bash
#!/bin/bash
BACKUP_DIR="/opt/beritakarya/backups"  # Ensure this exists and is writable
PGUSER="beritakarya"
PGDATABASE="beritakarya"
```

---

**Next Step**: After completing this checklist, follow `STAGING_DEPLOYMENT_GUIDE.md` for full deployment procedure.

---

**Prepared by**: Cline  
**Last Updated**: 2025-01-13  
**Status**: Ready for execution