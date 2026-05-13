# Migration: add_category_inheritance

## Summary

This migration adds support for category inheritance in the multi-tenant BeritaKarya system:

- Adds `siteId` (nullable) to `Category` table
- Adds `isGlobal` (boolean) flag to mark categories available to all sites
- Implements backfill: existing categories become global (isGlobal=true)
- Creates indexes for performance: `Category_siteId_idx`, `Category_isGlobal_idx`
- Creates partial unique index for site-specific categories: `Category_slug_site_unique`
- Adds foreign key constraint from `Category.siteId` to `Site.id`
- Updates `updatedAt` trigger

## Why This Change?

The multi-tenant architecture requires:
1. **Global categories**: 4 fixed categories from pusat (central) that automatically appear on all branch sites
2. **Site-specific categories**: Each branch can add 2-3 custom categories visible only to that site

This is implemented via:
- `siteId = NULL` → global category (visible to all sites)
- `siteId = 'surabaya'` → site-specific category (only visible to Surabaya site)
- `isGlobal = true` → flag for clarity (automatically set when siteId IS NULL)

## Query Pattern

```sql
-- Fetch categories for a site (includes global)
SELECT * FROM "Category" 
WHERE "siteId" = $siteId OR "isGlobal" = true
ORDER BY createdAt;
```

## Rollback

If needed, rollback by:

```sql
-- Drop indexes
DROP INDEX IF EXISTS "Category_slug_site_unique";
DROP INDEX IF EXISTS "Category_isGlobal_idx";
DROP INDEX IF EXISTS "Category_siteId_idx";

-- Remove columns
ALTER TABLE "Category" DROP COLUMN IF EXISTS "siteId";
ALTER TABLE "Category" DROP COLUMN IF EXISTS "isGlobal";

-- Remove foreign key
ALTER TABLE "Category" DROP CONSTRAINT IF EXISTS "Category_siteId_fkey";
```

## Test Scenarios

After migration, verify:

1. [ ] Global categories (siteId=NULL) appear when querying any site
2. [ ] Site-specific categories (siteId='X') appear only for their site
3. [ ] Unique constraint: (slug, siteId) prevents duplicate slugs per site
4. [ ] Global category slugs can overlap with site-specific slugs
5. [ ] Existing categories are properly backfilled with isGlobal=true