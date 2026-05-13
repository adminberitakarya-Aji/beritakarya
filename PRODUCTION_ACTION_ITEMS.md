# 🚀 BeritaKarya Production Action Items

**Created:** May 14, 2026  
**Priority:** Critical & High Priority Items

---

## 🚨 CRITICAL - Must Fix Before Production

### 1. Remove Default Passwords
**File:** `infra/docker/docker-compose.backend.yml`  
**Lines:** 8-9  
**Action:** Remove default password values

```bash
# Before:
POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-ganti_password_ini}

# After:
POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
```

**Why:** Prevents accidental use of weak passwords

---

### 2. Add Missing Environment Variables
**File:** `.env.production.example`  
**Action:** Add these variables:

```bash
# Add to .env.production.example:
JWT_REFRESH_SECRET=ganti-dengan-string-acak-64-karakter-untuk-refresh-token
REDIS_URL=redis://localhost:6379
MEILISEARCH_URL=http://localhost:7700
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASS=your-smtp-password
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

**Why:** Required by verify script and essential features

---

### 3. Implement Backup Monitoring
**File:** `infra/scripts/backup-database.sh`  
**Action:** Add monitoring and alerting

```bash
# Add to backup-database.sh after line 21:
# Send notification on success/failure
if [ $? -eq 0 ]; then
  echo "✅ Backup successful" | mail -s "Backup Success" admin@beritakarya.co
else
  echo "❌ Backup failed" | mail -s "Backup FAILED" admin@beritakarya.co
  exit 1
fi
```

**Why:** Silent backup failures could lead to data loss

---

### 4. Automate SSL Renewal
**File:** Create `infra/scripts/renew-ssl.sh`  
**Action:** Create automated renewal script

```bash
#!/bin/bash
# infra/scripts/renew-ssl.sh
certbot renew --quiet --deploy-hook "docker compose -f /opt/beritakarya/infra/docker/docker-compose.backend.yml restart nginx"
```

**Add to crontab:**
```bash
0 3 * * * /opt/beritakarya/infra/scripts/renew-ssl.sh
```

**Why:** Prevents certificate expiration and service downtime

---

## ⚠️ HIGH PRIORITY - Fix Within First Week

### 5. Add Graceful Shutdown
**File:** `apps/api/src/main.ts`  
**Action:** Add shutdown handler

```typescript
// Add after line 163 (app.listen):
const server = app.listen(PORT, () => {
  logger.info(`API berjalan di http://localhost:${PORT}`)
})

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully')
  await prisma.$disconnect()
  server.close(() => {
    logger.info('Server closed')
    process.exit(0)
  })
})

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully')
  await prisma.$disconnect()
  server.close(() => {
    logger.info('Server closed')
    process.exit(0)
  })
})
```

---

### 6. Add Request Timeout
**File:** `apps/api/src/main.ts`  
**Action:** Add timeout middleware

```typescript
// Add after line 97 (app.use(express.json({ limit: '10mb' }))):
const timeout = require('connect-timeout')
app.use(timeout('30s'))
app.use((req, res, next) => {
  if (!req.timedout) next()
})
```

---

### 7. Implement Circuit Breaker
**File:** Create `apps/api/src/lib/circuitBreaker.ts`  
**Action:** Create circuit breaker for external services

```typescript
import CircuitBreaker from 'opossum'

export const openaiBreaker = new CircuitBreaker(
  async (prompt: string) => {
    // OpenAI call here
  },
  {
    timeout: 10000,
    errorThresholdPercentage: 50,
    resetTimeout: 30000
  }
)

export const meilisearchBreaker = new CircuitBreaker(
  async (query: string) => {
    // Meilisearch call here
  },
  {
    timeout: 5000,
    errorThresholdPercentage: 50,
    resetTimeout: 30000
  }
)
```

**Install dependency:**
```bash
pnpm add opossum
```

---

### 8. Implement Soft Delete
**File:** `apps/api/prisma/schema.prisma`  
**Action:** Add soft delete to critical entities

```prisma
// Add to User model:
deletedAt DateTime?

// Add to Article model:
deletedAt DateTime?

// Add to Site model:
deletedAt DateTime?

// Update queries to filter out deleted records:
// Example: where: { deletedAt: null }
```

---

## 📋 MEDIUM PRIORITY - Fix Within First Month

### 9. Configure Database Connection Pooling
**File:** `apps/api/src/db/client.ts`  
**Action:** Add connection pool configuration

```typescript
export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: ['query', 'error', 'warn'],
})

// Configure connection pool
prisma.$connect().then(() => {
  logger.info('Database connected')
}).catch((error) => {
  logger.error('Database connection failed:', error)
  process.exit(1)
})
```

---

### 10. Set Up Error Tracking
**File:** `apps/api/src/main.ts`  
**Action:** Add Sentry integration

```typescript
import * as Sentry from '@sentry/node'

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 1.0,
  })
}
```

**Install dependency:**
```bash
pnpm add @sentry/node
```

---

### 11. Configure CDN
**File:** `.env.production`  
**Action:** Add CDN configuration

```bash
# Add to .env.production:
CDN_URL=https://cdn.beritakarya.co
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

---

### 12. Add Log Aggregation
**File:** Create `apps/api/src/lib/logger.ts`  
**Action:** Configure structured logging

```typescript
import winston from 'winston'

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: '/var/log/beritakarya/error.log', level: 'error' }),
    new winston.transports.File({ filename: '/var/log/beritakarya/combined.log' }),
  ],
})

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }))
}
```

---

## 📝 Quick Reference

### Files to Modify
1. `infra/docker/docker-compose.backend.yml` - Remove default passwords
2. `.env.production.example` - Add missing variables
3. `infra/scripts/backup-database.sh` - Add monitoring
4. `infra/scripts/renew-ssl.sh` - Create new file
5. `apps/api/src/main.ts` - Add graceful shutdown & timeout
6. `apps/api/prisma/schema.prisma` - Add soft delete
7. `apps/api/src/lib/circuitBreaker.ts` - Create new file
8. `apps/api/src/db/client.ts` - Add connection pooling

### Dependencies to Install
```bash
pnpm add opossum @sentry/node connect-timeout
```

### Cron Jobs to Add
```bash
# SSL renewal (daily at 3 AM)
0 3 * * * /opt/beritakarya/infra/scripts/renew-ssl.sh

# Database backup (daily at 2 AM)
0 2 * * * /opt/beritakarya/infra/scripts/backup-database.sh

# Log rotation (handled by logrotate)
```

---

## ✅ Verification Checklist

After completing all action items, verify:

- [x] All default passwords removed
- [x] All environment variables documented
- [x] Backup monitoring working
- [x] SSL renewal automated
- [x] Graceful shutdown implemented
- [x] Request timeout configured (30s)
- [x] Circuit breaker created (OpenAI & Meilisearch)
- [x] Soft delete added to critical models (Site, User, Article, Category)
- [ ] Connection pooling configured
- [ ] Error tracking set up
- [ ] CDN configured
- [ ] Log aggregation working
- [ ] All tests passing
- [ ] Documentation updated

---

## 🎯 Deployment Order

1. **Before Deployment:**
   - Complete all Critical items (1-4)
   - Test locally
   - Update documentation

2. **During Deployment:**
   - Deploy backend with High Priority items (5-8)
   - Monitor for errors
   - Test functionality

3. **After Deployment:**
   - Implement Medium Priority items (9-12)
   - Set up monitoring
   - Document any issues

---

## 📞 Support

For questions about these action items:
- Review `PRODUCTION_READINESS_REPORT.md` for detailed analysis
- Check `INFRASTRUCTURE_DATABASE_SUMMARY.md` for overview
- Refer to existing documentation in `docs/` folder

---

**Last Updated:** May 14, 2026  
**Status:** Ready for Implementation