# Multi-Tenant Architecture Evaluation
**Project**: BeritaKarya News Portal  
**Date**: May 13, 2026  
**Reviewer**: Senior News System Development  
**Status**: Technical Assessment

---

## 📋 Executive Summary

BeritaKarya adopting **Shared Database, Shared Schema** multi-tenant architecture with site-scoping. This evaluation assesses the 4 key points outlined by the stakeholder for correctness, gaps, and implementation recommendations.

---

## 🔍 Point-by-Point Analysis

### **Point 1: Shared Database, Independent Websites**

**Verdict**: ✅ **CORRECT & PRODUCTION-READY**

**Current Implementation**:
- Single PostgreSQL database shared across all sites (pusat + cabang)
- `Site` table acts as tenant container
- All data tables include `siteId` foreign key (except superadmin users)
- Isolation achieved through middleware filtering

**Advantages Validated**:
- ✅ **Cost efficiency**: One DB instance for unlimited sites
- ✅ **Operational simplicity**: Single backup/restore/monitoring
- ✅ **Cross-site analytics**: Easy to aggregate traffic across all portals
- ✅ **Centralized management**: Superadmin dashboard manages all tenants

**Production Considerations**:
- ⚠️ **Backup strategy**: Implement logical backup with site-specific WHERE clauses
- ⚠️ **Indexing strategy**: Composite index on `(siteId, createdAt)` for all tenant tables
- ⚠️ **Data growth**: Monitor table bloat; consider partitioning after 10M+ rows

**Scalability Path**:
- **0-100 sites**: Shared DB is optimal
- **100-500 sites**: Add database connection pooling (PgBouncer)
- **500+ sites**: Consider schema-based separation or database sharding

**Conclusion**: Proceed with shared database. No changes needed.

---

### **Point 2: Category Inheritance (4 Fixed + 2-3 Custom)**

**Verdict**: ⚠️ **NEEDS DATA MODEL CLARIFICATION**

**Current State**:
- `Category` table exists but schema incomplete in current codebase
- No `isGlobal` or `siteId` handling visible in reviewed code

**Required Implementation**:

**Option A: Nullable siteId + isGlobal Flag (Recommended)**
```sql
CREATE TABLE "Category" (
  "id" TEXT PRIMARY KEY,
  "siteId" TEXT NULL REFERENCES "Site"(id) ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "isGlobal" BOOLEAN DEFAULT FALSE,
  "description" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

-- Constraints
CREATE UNIQUE INDEX "Category_slug_site_unique" 
  ON "Category"(slug) WHERE siteId IS NOT NULL;
CREATE UNIQUE INDEX "Category_slug_global_unique" 
  ON "Category"(slug) WHERE siteId IS NULL AND isGlobal = true;

-- Query for site-browse: 
-- WHERE "siteId" = $site OR "isGlobal" = true
```

**Business Rules**:
1. **Pusat creates global categories**: `siteId=NULL, isGlobal=true`
2. **Cabang inherits automatically**: Query includes `isGlobal=true`
3. **Cabang cannot delete/modify global categories**: UI should disable edit/delete for `isGlobal=true`
4. **Custom categories**: `siteId='surabaya', isGlobal=false`
5. **Unique slugs**: Global slugs must be distinct from each other; can overlap with site-specific slugs

**Alternative Option B: Template Assignment**
```sql
CREATE TABLE "SiteCategory" (
  "siteId" TEXT REFERENCES "Site"(id) ON DELETE CASCADE,
  "categoryId" TEXT REFERENCES "Category"(id) ON DELETE CASCADE,
  "isInherited" BOOLEAN DEFAULT FALSE,
  "isVisible" BOOLEAN DEFAULT TRUE,
  PRIMARY KEY (siteId, categoryId)
);
```
More complex, allows cabang to hide certain global categories.

**Recommendation**: **Option A** is simpler and matches your requirement "4 fixed categories from pusat".

**Migration Required**:
```sql
-- Add columns to existing Category table
ALTER TABLE "Category" ADD COLUMN "siteId" TEXT NULL;
ALTER TABLE "Category" ADD COLUMN "isGlobal" BOOLEAN DEFAULT FALSE;
-- Update existing categories (backfill)
UPDATE "Category" SET "isGlobal" = true WHERE "siteId" IS NULL;
```

---

### **Point 3: User Role & Site Separation**

**Verdict**: ⚠️ **PARTIAL IMPLEMENTATION - MODELING DECISION NEEDED**

**Current User Model** (`packages/types/src/user.ts`):
```typescript
interface User {
  id: string
  email: string
  name: string
  role: UserRole
  siteId: string | null  // null = superadmin (akses semua site)
}
```

**Your Statement**: 
> "jurnalis yang ada di pusat atau di biro/cabang harus ada pembeda atau id"

**Interpretation Options**:

**Scenario A: Separate Personnel (Most Common for News Org)**
- Jurnalis pusat ≠ Jurnalis cabang (different people)
- Each journalist belongs to ONE site
- `siteId` is MANDATORY for journalist/wapimred (non-null)
- Current model **WORKS** if you enforce: `user.siteId !== null` for non-superadmin

**Scenario B: Freelance Across Sites (Advanced)**
- Same journalist works for multiple portal cabang
- Needs junction table `UserSite`:
```sql
CREATE TABLE "UserSite" (
  "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "siteId" TEXT NOT NULL REFERENCES "Site"(id) ON DELETE CASCADE,
  "role" UserRole NOT NULL,  -- role may differ per site
  "isPrimary" BOOLEAN DEFAULT false,
  PRIMARY KEY (userId, siteId)
);
```
- Middleware checks `UserSite` instead of `User.siteId`
- Allows: User A is journalist for site-pusat AND wapimred for site-surabaya

**Gap Analysis**:
| Role | Current siteId | Multi-site Support |
|------|---------------|-------------------|
| superadmin | null (allowed) | ✅ Already works (all sites) |
| wapimred | required (single) | ❌ Needs UserSite table |
| journalist | required (single) | ❌ Needs UserSite table |
| reader | nullable (optional) | Could be multi-site |

**Middleware Validation** (`site-scope.middleware.ts`):
```typescript
// Current: checks req.user.siteId directly
if (req.user.role === 'wapimred') {
  if (req.user.siteId !== targetSiteId) { ... } // Single-site only
}
```

**Multi-site middleware example**:
```typescript
// If using UserSite junction table
const userSite = await prisma.userSite.findFirst({
  where: { userId: req.user.id, siteId: targetSiteId }
});
if (!userSite && req.user.role !== 'superadmin') {
  return res.status(403).json({ error: 'No access to this site' });
}
```

**Recommendation**:

**Decision Tree**:
1. **Are journalists dedicated to one portal?** → Keep current model, add validation: `siteId` required for journalist/wapimred
2. **Can journalists contribute to multiple portals?** → Implement `UserSite` junction table

**Implementation Priority**: 
- If unsure, **start with single-site model** (current). 
- Add `UserSite` later if requirement emerges (migration is straightforward).

---

### **Point 4: Superadmin Dashboard for Site Settings**

**Verdict**: ✅ **REQUIRED FEATURE - PARTIAL IMPLEMENTATION EXISTS**

**Current Infrastructure**:
- ✅ `Site` CRUD API exists: `apps/api/src/modules/site/site.controller.ts`
- ✅ Database schema supports: `Site.id`, `Site.domain`, `Site.trendingTopics`
- ✅ Middleware: `requireSiteAccess` exists for route protection
- ⚠️ Frontend dashboard pages incomplete: Need `/dashboard/sites`, `/dashboard/categories?global`, `/dashboard/users?site=all`

**Missing Superadmin Capabilities**:

**A. Site Management** (`/admin/sites` or `/dashboard/sites`):
```
GET /api/v1/sites                      // List all sites (superadmin only)
POST /api/v1/sites                     // Create new portal
PUT /api/v1/sites/:id                  // Update domain, config
DELETE /api/v1/sites/:id               // Deactivate (soft delete)
GET /api/v1/sites/:id/stats           // Traffic, articles count, users count
```

**Required Fields for Site Creation**:
- `id`: Unique slug (e.g., "surabaya")
- `domain`: Full domain (e.g., "surabaya.beritakarya.co")
- `name`: Display name ("BeritaKarya Surabaya")
- `logoUrl`: Brand logo
- `contactEmail`: Admin contact
- `defaultCategories`: Auto-assign 4 global categories

**B. Category Template Management**:
```
GET /api/v1/categories?view=global     // See all global categories
POST /api/v1/categories               // Create with isGlobal=true
PUT /api/v1/categories/:id/global     // Toggle isGlobal flag
```

**UI Implementation**:
- Superadmin sees **ALL categories** (global + site-specific)
- Filter dropdown: "Show: All / Global Only / [Site Name] Only"
- Bulk assignment: "Add these 4 global categories to NEW site automatically"

**C. User Assignment & Cross-Site View**:
```
GET /api/v1/users?site=all            // Superadmin sees all users with site context
GET /api/v1/users?role=wapimred       // List all wapimred across sites
POST /api/v1/users                     // Create user + assign to site(s)
PUT /api/v1/users/:id/sites           // Add/remove site access
```

**D. Cross-Site Analytics Dashboard**:
- Traffic comparison chart (Recharts): visitors per site (last 30 days)
- Article production per site
- Active journalists per site
- Top-performing articles across all sites

**E. Nginx/DNS Automation (Advanced)**:
- API to generate Nginx config snippet for new domain
- API to check DNS propagation status
- Auto-request SSL certificate via Certbot API

**Security Considerations**:
- ⚠️ **Route protection**: All `/dashboard/sites`, `/dashboard/categories?global` must have `requireSiteAccess` middleware
- ⚠️ **Superadmin-only routes**: Add dedicated middleware `requireSuperadmin`
- ⚠️ **Audit logging**: Every site creation/modification must log to `AuditLog` table

**Existing Code References**:
- `apps/web/app/[site]/dashboard/categories/page.tsx` exists but site-scoped only
- Must extend to show global categories for superadmin

---

## 🎯 Consolidated Recommendations

### **Immediate Actions (Week 1)**

**1. Category Schema Migration**
```sql
-- Run this migration
ALTER TABLE "Category" 
  ADD COLUMN "siteId" TEXT NULL REFERENCES "Site"(id) ON DELETE CASCADE,
  ADD COLUMN "isGlobal" BOOLEAN DEFAULT FALSE;

-- Backfill: existing categories become global
UPDATE "Category" SET "isGlobal" = true WHERE "siteId" IS NULL;

-- Create indexes
CREATE INDEX "Category_siteId_idx" ON "Category"("siteId");
CREATE UNIQUE INDEX "Category_slug_site_unique" ON "Category"(slug, siteId);
```

**2. Update Category Queries**
```typescript
// In CategoryService
where: {
  OR: [
    { siteId },  // Site-specific
    { isGlobal: true }  // Global categories
  ]
}
```

**3. Frontend Category Page Modal**
- Edit: `apps/web/app/[site]/dashboard/categories/page.tsx`
- Add toggle "Global Category" (visible only to superadmin)
- Show badge: [GLOBAL] or [SURABAYA] on each category

---

### **Short-term Actions (Week 2-3)**

**4. Superadmin Dashboard - Sites Page**
- Create: `apps/web/app/[site]/dashboard/admin/sites/page.tsx`
- API: `GET /api/v1/sites` (superadmin only)
- UI: Table with columns: Site ID | Domain | Wapimred | Categories | Actions

**5. User Management Enhancement**
- Add `siteId` validation on user creation (required for journalist/wapimred)
- Display site context on user list: "Ahmad (Site: Surabaya)"
- Bulk assign user to site

---

### **Long-term (Month 2+)**

**6. Decide on User Multi-Site Support**
- Evaluate if freelance scenario needed
- If yes: create `UserSite` migration and update all auth middleware
- If no: document clearly "One user, one site (except superadmin)"

**7. Cross-Site Analytics**
- Dashboard widget: Compare traffic across all active sites
- Export to CSV functionality

---

## ❓ Critical Questions for Stakeholder

**Q1 (Categories)**:
> "Apakah 4 kategori pusat harus **visible di semua cabang secara otomatis** tanpa perlu subscribtion?"
> 
> **If YES**: Implement `isGlobal` flag as recommended.
> **If NO**: Need `SiteCategory` junction table for opt-in.

**Q2 (Users)**:
> "Apakah seorang jurnalis bisa **bekerja di pusat DAN satu cabang bersamaan** (freelancer) atau **commit to satu site** saja?"
> 
> **If Multi-site**: Build `UserSite` table.
> **If Single-site**: Current model OK, just enforce `siteId !== null` validation.

**Q3 (Superadmin UI)**:
> "Apakah superadmin dashboard harus terpisah (`/admin/sites`) atau integrated di dashboard biasa dengan filter?"
> 
> **Separate**: Create dedicated admin routes with stricter middleware.
> **Integrated**: Extend existing dashboard with "Manage All Sites" toggle.

---

## 📊 Architecture Decision Record (ADR)

**Title**: Multi-Tenant Category Inheritance  
**Status**: Proposed  
**Context**: Need 4 fixed global categories + custom per site  
**Decision**: Use `isGlobal` flag with nullable `siteId`  
**Consequences**: 
- ✅ Simple queries, no joins
- ✅ Easy onboarding: new site automatically sees all global categories
- ✅ Clear UI distinction (badges)
- ⚠️ Cannot enforce "must have exactly 4 global" at DB level (app logic only)

---

## 🚨 Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Global category accidentally deleted | High (breaks all sites) | Disable delete for `isGlobal=true`; add confirmation modal |
| Journalist assigned to wrong site | Medium (data leak) | Wapimred can only assign users to THEIR site; superadmin gets audit log |
| Site ID collision | High (data breach) | Enforce unique constraint on `Site.id`; use UUID or slug validation |
| Performance degrade at 100+ sites | Medium | Add composite index `(siteId, createdAt)` on all tenant tables |

---

**Next Step**: Await answers to 3 Critical Questions to finalize implementation plan.