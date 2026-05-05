-- ============================================================
-- 🗄️ BERITAKARYA — Supabase First-Time Setup
-- ============================================================
-- ⚡ FRESH DATABASE — Jalankan 1x di Supabase SQL Editor
--
-- Langkah:
--   1. Buat project baru di supabase.com
--   2. Buka SQL Editor
--   3. Copy-paste SELURUH file ini
--   4. Klik "Run"
--   5. Copy connection string dari Settings → Database
--   6. Paste ke .env sebagai DATABASE_URL
-- ============================================================


-- ────────────────────────────────────────────────────────────
-- 1. TABLES
-- ────────────────────────────────────────────────────────────

CREATE TABLE "Site" (
    "id"        TEXT NOT NULL,
    "name"      TEXT NOT NULL,
    "domain"    TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Site_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "User" (
    "id"           TEXT NOT NULL,
    "email"        TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name"         TEXT NOT NULL,
    "role"         TEXT NOT NULL DEFAULT 'reader',
    "siteId"       TEXT,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Category" (
    "id"        TEXT NOT NULL,
    "name"      TEXT NOT NULL,
    "slug"      TEXT NOT NULL,
    "siteId"    TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Advertisement" (
    "id"        TEXT NOT NULL,
    "siteId"    TEXT NOT NULL,
    "slot"      TEXT NOT NULL,
    "code"      TEXT,
    "imageUrl"  TEXT,
    "linkUrl"   TEXT,
    "isActive"  BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Advertisement_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Article" (
    "id"              TEXT NOT NULL,
    "title"           TEXT NOT NULL,
    "slug"            TEXT NOT NULL,
    "siteId"          TEXT NOT NULL,
    "categoryId"      TEXT,
    "authorId"        TEXT NOT NULL,
    "blocks"          JSONB NOT NULL DEFAULT '[]',
    "tags"            JSONB NOT NULL DEFAULT '[]',
    "status"          TEXT NOT NULL DEFAULT 'draft',
    "metaTitle"       TEXT,
    "metaDescription" TEXT,
    "publishedAt"     TIMESTAMP(3),
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RefreshToken" (
    "id"        TEXT NOT NULL,
    "token"     TEXT NOT NULL,
    "userId"    TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AIUsage" (
    "id"           TEXT NOT NULL,
    "userId"       TEXT NOT NULL,
    "siteId"       TEXT NOT NULL,
    "action"       TEXT NOT NULL,
    "inputLength"  INTEGER NOT NULL,
    "outputLength" INTEGER NOT NULL,
    "latencyMs"    INTEGER NOT NULL,
    "success"      BOOLEAN NOT NULL,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIUsage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Media" (
    "id"             TEXT NOT NULL,
    "url"            TEXT NOT NULL,
    "thumbUrl"       TEXT NOT NULL,
    "width"          INTEGER NOT NULL,
    "height"         INTEGER NOT NULL,
    "originalFormat" TEXT NOT NULL,
    "size"           INTEGER NOT NULL,
    "userId"         TEXT NOT NULL,
    "siteId"         TEXT,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);


-- ────────────────────────────────────────────────────────────
-- 2. INDEXES
-- ────────────────────────────────────────────────────────────

-- Site
CREATE UNIQUE INDEX "Site_domain_key" ON "Site"("domain");

-- User
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_siteId_idx" ON "User"("siteId");
CREATE INDEX "User_email_idx" ON "User"("email");

-- Category
CREATE UNIQUE INDEX "Category_siteId_slug_key" ON "Category"("siteId", "slug");

-- Advertisement
CREATE UNIQUE INDEX "Advertisement_siteId_slot_key" ON "Advertisement"("siteId", "slot");

-- Article
CREATE UNIQUE INDEX "Article_siteId_slug_key" ON "Article"("siteId", "slug");
CREATE INDEX "Article_siteId_status_idx" ON "Article"("siteId", "status");
CREATE INDEX "Article_authorId_idx" ON "Article"("authorId");
CREATE INDEX "Article_categoryId_idx" ON "Article"("categoryId");

-- RefreshToken
CREATE UNIQUE INDEX "RefreshToken_token_key" ON "RefreshToken"("token");
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- AIUsage
CREATE INDEX "AIUsage_userId_action_idx" ON "AIUsage"("userId", "action");
CREATE INDEX "AIUsage_siteId_idx" ON "AIUsage"("siteId");

-- Media
CREATE INDEX "Media_userId_idx" ON "Media"("userId");
CREATE INDEX "Media_siteId_idx" ON "Media"("siteId");


-- ────────────────────────────────────────────────────────────
-- 3. FOREIGN KEYS
-- ────────────────────────────────────────────────────────────

ALTER TABLE "User"
  ADD CONSTRAINT "User_siteId_fkey"
  FOREIGN KEY ("siteId") REFERENCES "Site"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Category"
  ADD CONSTRAINT "Category_siteId_fkey"
  FOREIGN KEY ("siteId") REFERENCES "Site"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Advertisement"
  ADD CONSTRAINT "Advertisement_siteId_fkey"
  FOREIGN KEY ("siteId") REFERENCES "Site"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Article"
  ADD CONSTRAINT "Article_siteId_fkey"
  FOREIGN KEY ("siteId") REFERENCES "Site"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Article"
  ADD CONSTRAINT "Article_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "Category"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Article"
  ADD CONSTRAINT "Article_authorId_fkey"
  FOREIGN KEY ("authorId") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "RefreshToken"
  ADD CONSTRAINT "RefreshToken_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;


-- ────────────────────────────────────────────────────────────
-- 4. PRISMA MIGRATION TRACKING
-- ────────────────────────────────────────────────────────────
-- Supaya `npx prisma migrate deploy` tahu bahwa init migration
-- sudah dijalankan dan tidak akan duplikat.

CREATE TABLE "_prisma_migrations" (
    "id"                  VARCHAR(36)  NOT NULL,
    "checksum"            VARCHAR(64)  NOT NULL,
    "finished_at"         TIMESTAMPTZ,
    "migration_name"      VARCHAR(255) NOT NULL,
    "logs"                TEXT,
    "rolled_back_at"      TIMESTAMPTZ,
    "started_at"          TIMESTAMPTZ  NOT NULL DEFAULT now(),
    "applied_steps_count" INTEGER      NOT NULL DEFAULT 0,

    CONSTRAINT "_prisma_migrations_pkey" PRIMARY KEY ("id")
);

INSERT INTO "_prisma_migrations" ("id", "checksum", "migration_name", "finished_at", "applied_steps_count")
VALUES (
    gen_random_uuid()::varchar,
    'manual_supabase_setup_20260504',
    '20260504071906_init',
    now(),
    1
);


-- ────────────────────────────────────────────────────────────
-- 5. SEED DATA
-- ────────────────────────────────────────────────────────────
-- 📝 SESUAIKAN data di bawah sebelum run:
--    • Site: ganti nama & domain sesuai kebutuhan
--    • User: ganti email, nama, dan password hash
--
-- Password hash di bawah = "Admin123!" (bcrypt 10 rounds)
-- Generate hash baru:
--   Option A: https://bcrypt-generator.com
--   Option B: node -e "console.log(require('bcryptjs').hashSync('PASSWORD_ANDA', 10))"
-- ────────────────────────────────────────────────────────────

-- Site utama (Pusat)
INSERT INTO "Site" ("id", "name", "domain", "createdAt", "updatedAt")
VALUES (
    'site-beritakarya-pusat',
    'BeritaKarya Pusat',
    'beritakarya.co',
    now(), now()
);

-- User Superadmin (Satu-satunya akun pertama untuk setup)
INSERT INTO "User" ("id", "email", "passwordHash", "name", "role", "siteId", "createdAt", "updatedAt")
VALUES (
    gen_random_uuid()::text,
    'superadmin@beritakarya.co',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    'Superadmin Pusat',
    'superadmin',
    NULL,
    now(), now()
);


-- ────────────────────────────────────────────────────────────
-- ✅ SETUP SELESAI!
-- ────────────────────────────────────────────────────────────
-- Langkah selanjutnya:
--
--   1. Buka Supabase → Settings → Database → Connection string (URI)
--   2. Copy connection string, paste ke file .env:
--      DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres"
--      ⚠️ Gunakan port 6543 (pooler) untuk production
--      ⚠️ Gunakan port 5432 (direct) untuk migration
--
--   3. Di terminal project:
--      cd apps/api
--      npx prisma generate
--      npx prisma db pull    (verifikasi schema cocok)
--
--   4. Login test:
--      Email: superadmin@beritakarya.co (Superadmin)
--      Password: Admin123!   (← SEGERA GANTI setelah login pertama!)
-- ────────────────────────────────────────────────────────────
