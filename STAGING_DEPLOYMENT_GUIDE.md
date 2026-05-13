# 🧪 Staging Deployment Guide

**Goal**: Test multi-tenant features di staging VPS sebelum production rollout.

---

## Why Staging First?

1. **Database Migration Risk**: Category.siteId becomes nullable - need to verify existing data integrity
2. **New API Endpoints**: Never tested in production-like environment
3. **Multi-tenant Routing**: Nginx `/{site}` pattern needs verification
4. **Rollback Safety**: If something breaks, production remains untouched
5. **Performance Validation**: Check query performance with real data

---

## Pre-Deployment Checklist

### Code Readiness ✅
- [x] All backend services implemented (Category, Site)
- [x] Frontend pages created (admin, categories, users)
- [x] Routes registered in main.ts
- [x] Postman collection ready for testing
- [x] Migration SQL prepared

### Database ✅
- [x] Schema updated (siteId nullable, isGlobal)
- [x] Migration SQL created with proper indexes
- [x] Backfill logic included (existing categories become site-specific)
- [x] Prisma client generated

---

## Staging Deployment Steps

### 1. Prepare Staging VPS

```bash
# SSH into staging VPS
ssh user@staging-beritakarya.co

# Navigate to project directory
cd ~/beritakarya

# Pull latest code from feature branch
git fetch origin
git checkout feature/multi-tenant-categories
git pull origin feature/multi-tenant-categories
```

### 2. Rebuild Docker Containers

```bash
# Build all services with latest code
docker compose -f infra/docker/docker-compose.backend.yml up -d --build

# Wait for containers to be healthy
docker ps --filter "status=healthy"

# Check logs for any startup errors
docker logs beritakarya_api --tail 50
docker logs beritakarya_web --tail 50
```

### 3. Run Database Migration

```bash
# Execute migration inside API container
docker exec -it beritakarya_api pnpm prisma migrate deploy

# Expected output:
# ✅ Migration 20250113000000_add_category_inheritance applied
# ✅ All migrations completed

# Verify migration applied correctly
docker exec -it beritakarya_api pnpm prisma migrate status
```

### 4. Verify Database Schema

```sql
-- Connect to PostgreSQL
docker exec -it beritakarya_db psql -U beritakarya -d beritakarya

-- Check Category table structure
\d "Category"

-- Should show:
-- siteId: character varying (nullable) ✅
-- isGlobal: boolean (default false) ✅

-- Count categories before/after
SELECT COUNT(*) FROM "Category";
SELECT COUNT(*) FROM "Category" WHERE "siteId" IS NULL AND "isGlobal" = true;
```

### 5. Health Check

```bash
# Test API health endpoint
curl https://staging-api.beritakarya.co/health

# Expected response:
# {
#   "status": "healthy",
#   "timestamp": "2025-01-13T...",
#   "services": {
#     "database": "healthy"
#   }
# }
```

### 6. Test API Endpoints with Postman

**Setup Postman**:
1. Import `POSTMAN_COLLECTION.json`
2. Set environment:
   - `base_url` = `https://staging-api.beritakarya.co`
   - `access_token` = (get from login)

**Test Sequence**:

#### A. Authentication
- ✅ Login as superadmin → get access_token
- ✅ Login as wapimred → get access_token

#### B. Categories API
```
GET /api/v1/categories                        [200] - Site-specific + global
GET /api/v1/categories?view=all               [200] - Superadmin only
GET /api/v1/categories?view=global            [200] - Superadmin only
GET /api/v1/categories                        [403] - Wapimred tries ?view=all (should fail)
POST /api/v1/categories (site-specific)       [201] - Create site category
POST /api/v1/categories (global)              [201] - Superadmin creates global
POST /api/v1/categories (siteId mismatch)     [403] - Wapimred tries global (should fail)
DELETE /api/v1/categories/:id (site-specific) [200] - Delete site category
DELETE /api/v1/categories/:id (global)        [403] - Try delete global (should fail)
```

#### C. Sites API (Superadmin Only)
```
GET /api/v1/sites?includeStats=true          [200] - List all sites with stats
POST /api/v1/sites                            [201] - Create new site
PUT /api/v1/sites/:id                         [200] - Update site domain
DELETE /api/v1/sites/:id (has articles)      [400] - Should prevent deletion
POST /api/v1/sites/:id/wapimred               [200] - Assign wapimred
```

#### D. Users API
```
GET /api/v1/users                             [200] - Site-scoped users
GET /api/v1/users?site=all                    [200] - Superadmin sees all
GET /api/v1/users?site=all                    [403] - Wapimred denied
```

### 7. Frontend Testing

```bash
# Access staging web
https://staging-web.beritakarya.co/pusat/dashboard

# Login as:
# - Superadmin: Verify admin page visible, global categories toggle works
# - Wapimred: Verify no admin page, categories toggle hidden
```

**Test Cases**:
1. ✅ Admin page loads (/dashboard/admin) - superadmin only
2. ✅ Categories page shows global toggle for superadmin
3. ✅ Categories page creates site-specific category (wapimred)
4. ✅ Categories page creates global category (superadmin only)
5. ✅ Global category cannot be deleted (button disabled)
6. ✅ Users page shows "Show All Sites" toggle for superadmin
7. ✅ Wapimred assignment dropdown works in admin page

### 8. Check Logs for Errors

```bash
# Monitor API logs in real-time
docker logs -f beritakarya_api

# Look for:
# ❌ Errors in category service
# ❌ Database constraint violations
# ❌ Authorization failures (unexpected)
# ❌ Missing siteId in requests
```

### 9. Performance Testing

```bash
# Simple load test with curl
for i in {1..50}; do
  curl -s -o /dev/null -w "%{http_code}\n" https://staging-api.beritakarya.co/api/v1/categories
done

# Check response times
# Should be < 200ms for cached queries
# Should be < 500ms for uncached queries

# Monitor Docker stats
docker stats
```

### 10. Rollback Test (Important!)

```bash
# If something breaks, rollback:
git checkout previous-working-branch
docker compose -f infra/docker/docker-compose.backend.yml up -d --build

# Migration rollback (if needed):
docker exec -it beritakarya_api pnpm prisma migrate resolve --rolled-back 20250113000000_add_category_inheritance
```

---

## Staging Success Criteria

Before considering production deployment, verify:

- [ ] All Postman tests pass (200/201 responses)
- [ ] No errors in API logs during test period
- [ ] Category inheritance works:
  - Site-specific categories visible only to that site
  - Global categories visible to all sites
  - Superadmin can view all categories with `?view=all`
- [ ] Site CRUD operations work (create, edit, delete)
- [ ] Wapimred assignment works correctly
- [ ] Frontend pages load without errors
- [ ] Mobile responsive design works
- [ ] Role-based access control properly enforced
- [ ] Database migration completed without data loss
- [ ] No slow queries (> 500ms) in pg_stat_statements

---

## If Staging Fails

### Common Issues & Solutions

**Issue 1**: Migration fails with "column already exists"
```bash
# Solution: Manually check if migration partially applied
docker exec -it beritakarya_db psql -U beritakarya -d beritakarya -c "\d Category"
# If columns exist but migration not marked as applied, resolve:
docker exec -it beritakarya_api pnpm prisma migrate resolve --rolled-back 20250113000000_add_category_inheritance
# Re-run migration
docker exec -it beritakarya_api pnpm prisma migrate deploy
```

**Issue 2**: Global categories not visible to site users
- Check query: CategoryService.getSiteCategories() uses OR condition
- Verify database: `SELECT * FROM "Category" WHERE "siteId" IS NULL OR "isGlobal" = true;`

**Issue 3**: Authorization bypass
- Verify middleware: `requireSiteAccess` correctly sets `req.site`
- Check session user role in frontend
- Test with different user roles

**Issue 4**: Slow queries
```sql
-- Add indexes if missing
CREATE INDEX idx_category_siteid ON "Category"("siteId");
CREATE INDEX idx_category_isglobal ON "Category"("isGlobal");
CREATE INDEX idx_category_slug ON "Category"(slug);
```

---

## Production Deployment (After Staging Success)

### 1. Production Deployment Day

```bash
# SSH into production VPS
ssh user@beritakarya.co

# Backup database first!
pg_dump -U beritakarya beritakarya > backup_$(date +%Y%m%d_%H%M%S).sql

# Pull code
git pull origin feature/multi-tenant-categories

# Rebuild containers (maintenance mode if needed)
docker compose -f infra/docker/docker-compose.backend.yml up -d --build

# Run migration
docker exec -it beritakarya_api pnpm prisma migrate deploy

# Verify
curl https://api.beritakarya.co/health
docker logs beritakarya_api --tail 50
```

### 2. Post-Deployment Monitoring (First 24 Hours)

- [ ] Check API error rates (should be < 0.1%)
- [ ] Monitor database query performance
- [ ] Verify no unauthorized access attempts
- [ ] Confirm site-specific category isolation
- [ ] Check Redis cache hit rates

### 3. Rollback Plan

If critical issues arise:

```bash
# Immediate rollback
git revert <commit-hash>
docker compose up -d --build
# Database rollback if needed:
docker exec -it beritakarya_api pnpm prisma migrate resolve --rolled-back 20250113000000_add_category_inheritance
```

---

## Success Metrics

**Staging**:
- ✅ 0 errors in Postman tests
- ✅ < 200ms average response time
- ✅ All role-based access controls working
- ✅ Category inheritance functioning correctly

**Production**:
- ✅ Zero downtime deployment
- ✅ No data loss or corruption
- ✅ All sites can access their categories
- ✅ Global categories visible to all sites (superadmin manage)
- ✅ No increase in error rates

---

## Contact & Support

If staging tests reveal issues, document them in:
- `STAGING_ISSUES.md` (create if needed)
- GitHub Issues: feature/multi-tenant-categories

---

**Bottom Line**: Staging diprioritaskan karena:
1. Migration risk untuk existing production data
2. Multi-tenant routing perlu diverifikasi
3. Rollback mudah di staging vs production

**Estimated Time**: 1-2 days untuk staging test + fix  
**Production Deployment**: Setelah staging signed-off

---

**Prepared by**: Cline  
**Recommendation**: Deploy to staging first ✅