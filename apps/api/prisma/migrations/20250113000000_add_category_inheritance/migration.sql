-- Migration: Add category inheritance (site-scoped + global categories)
-- Date: 2025-01-13
-- Purpose: Implement global categories that automatically appear on all sites

-- 1. Add new columns to Category table
ALTER TABLE "Category" 
  ADD COLUMN IF NOT EXISTS "siteId" TEXT NULL;
ALTER TABLE "Category" 
  ADD COLUMN IF NOT EXISTS "isGlobal" BOOLEAN DEFAULT FALSE;

-- 2. Backfill existing categories: set isGlobal=true for categories without siteId
-- This assumes existing categories are from the central/pusat site
UPDATE "Category" 
  SET "isGlobal" = true 
  WHERE "siteId" IS NULL;

-- 3. Add foreign key constraint (deferred to allow data migration)
-- Note: This assumes Site table exists with id as TEXT
ALTER TABLE "Category" 
  ADD CONSTRAINT "Category_siteId_fkey" 
  FOREIGN KEY ("siteId") 
  REFERENCES "Site"(id) 
  ON DELETE CASCADE 
  ON UPDATE CASCADE;

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS "Category_siteId_idx" ON "Category"("siteId");
CREATE INDEX IF NOT EXISTS "Category_isGlobal_idx" ON "Category"("isGlobal");

-- 5. Composite unique index for site-specific categories
-- This ensures (slug, siteId) is unique WHERE siteId IS NOT NULL
CREATE UNIQUE INDEX IF NOT EXISTS "Category_slug_site_unique" 
  ON "Category"(slug, siteId) 
  WHERE siteId IS NOT NULL;

-- NOTE: The @@unique([slug, siteId]) in Prisma schema handles:
-- - Global categories: (slug, NULL) allowed (one global per slug)
-- - Site-specific: (slug, siteId) unique per site
-- This is enforced at application level + partial unique index above

-- 6. Update updatedAt trigger (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to Category table if not exists
DROP TRIGGER IF EXISTS update_category_updated_at ON "Category";
CREATE TRIGGER update_category_updated_at 
  BEFORE UPDATE ON "Category" 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- 7. Add comment for documentation
COMMENT ON COLUMN "Category"."siteId" IS 'NULL = global category (available to all sites). Non-NULL = site-specific category.';
COMMENT ON COLUMN "Category"."isGlobal" IS 'Flag indicating this category is global (visible to all sites). Automatically true when siteId IS NULL.';

-- Migration complete