# 🔍 Audit & Roadmap Project BeritaKarya

---

## FASE 1 — Audit & Fix Koneksi Web ↔ API ✅ SELESAI

### Ringkasan Eksekutif
Project BeritaKarya adalah **monorepo** multi-tenant news platform. Audit Phase 1 menemukan inkonsistensi port yang menyebabkan frontend tidak dapat berkomunikasi dengan backend. Semua perbaikan di bawah telah selesai dieksekusi dan di-push ke GitHub.

### Yang Sudah Diperbaiki

| # | Perbaikan | File | Status |
|---|-----------|------|--------|
| 1 | Standarisasi `PORT=3001` & `API_URL` | `apps/api/.env` | ✅ Done |
| 2 | Tambah `NEXT_PUBLIC_API_URL=http://localhost:3001` | `apps/web/.env` & `.env.local` | ✅ Done |
| 3 | Fix fallback `3000` → `3001` (SSR) | `SiteHomePage.tsx` | ✅ Done |
| 4 | Fix fallback `4000` → `3001` | `lib/api.ts`, `LoadMoreArticles.tsx`, `NotificationBell.tsx`, `NewsletterForm.tsx`, `sitemap.ts`, `artikel/[slug]/page.tsx` | ✅ Done |
| 5 | Pindah `multer`, `sharp`, `openai`, `dompurify`, `jsdom` ke `dependencies` | `apps/api/package.json` | ✅ Done |
| 6 | Hapus plugin ESLint React/Next dari API | `apps/api/package.json` | ✅ Done |
| 7 | Tambah `cross-env` ke web devDependencies | `apps/web/package.json` | ✅ Done |
| 8 | Sederhanakan `tsconfig.json` (hapus `types` & `typeRoots` eksplisit) | `apps/api/tsconfig.json` | ✅ Done |
| 9 | Generate Prisma Client | `prisma generate` | ✅ Done |

> [!NOTE]
> Commit: `fix: resolve api-web connectivity, cleanup dependencies, and fix tsconfig errors`
> Branch: `main` → `origin/main`

---

## FASE 2 — Development Roadmap (Next Steps)

### Step 1 — Validasi Koneksi Database

**Goal**: Memastikan schema Prisma sudah sinkron dengan database Supabase dan data awal tersedia.

#### Tugas
- [x] Jalankan `pnpm db:migrate` di `apps/api` — pastikan semua migration berjalan bersih
- [x] Jalankan `prisma migrate status` — validasi tidak ada drift antara schema dan DB
- [x] Jalankan `pnpm db:seed` — isi data awal: sites (`bandung`, `surabaya`, dll), superadmin user
- [x] Verifikasi dengan `prisma studio` bahwa tabel terisi dengan benar

#### File Terkait
- [`apps/api/prisma/schema.prisma`](file:///d:/beritakarya/apps/api/prisma/schema.prisma)
- [`apps/api/src/db/seed.ts`](file:///d:/beritakarya/apps/api/src/db/seed.ts)

---

### Step 2 — End-to-End Authentication Test

**Goal**: Memastikan seluruh flow auth (login → JWT → refresh → logout) berjalan dan RBAC bekerja.

#### Tugas
- [x] Test POST `/api/v1/auth/login` dengan akun superadmin dari seed
- [x] Verifikasi response berisi `accessToken` (15m) dan `refreshToken` (7d)
- [x] Test token refresh: POST `/api/v1/auth/refresh` dengan refresh token
- [x] Test akses protected route dengan token → harus 200 OK
- [x] Test akses protected route tanpa token → harus 401 Unauthorized
- [x] Test RBAC: akun journalist mencoba akses endpoint superadmin → harus 403 Forbidden
- [x] Validasi `authStore.ts` di frontend menyimpan token dengan benar di localStorage

#### File Terkait
- [`apps/api/src/modules/auth/auth.controller.ts`](file:///d:/beritakarya/apps/api/src/modules/auth/auth.controller.ts)
- [`apps/api/src/middleware/auth.middleware.ts`](file:///d:/beritakarya/apps/api/src/middleware/auth.middleware.ts)
- [`apps/web/store/authStore.ts`](file:///d:/beritakarya/apps/web/store/authStore.ts)

---

### Step 3 — Fix Middleware Deprecation (Next.js 16)

**Goal**: Menghilangkan warning `"middleware" convention is deprecated, use "proxy" instead` dari Next.js 16.

#### Tugas
- [x] Baca warning detail dari Next.js docs untuk versi 16
- [x] Evaluasi `apps/web/middleware.ts` — apakah perlu diubah ke `proxy` convention atau cukup rename
- [x] Update konfigurasi routing agar multi-tenant middleware tetap berjalan
- [x] Pastikan tidak ada regresi: semua site path masih ter-route dengan benar setelah perubahan

#### File Terkait
- [`apps/web/middleware.ts`](file:///d:/beritakarya/apps/web/middleware.ts)
- [`apps/web/next.config.mjs`](file:///d:/beritakarya/apps/web/next.config.mjs) (atau `.ts`)

> [!WARNING]
> Perubahan middleware dapat membreak sistem multi-tenant. Harus di-test menyeluruh setelah perubahan.

---

### Step 4 — Smoke Test Seluruh Modul API

**Goal**: Memastikan setiap modul API merespons dengan benar secara end-to-end.

#### Tugas
| Modul | Endpoint | Method | Test |
|-------|----------|--------|------|
| Auth | `/api/v1/auth/login` | POST | ✅ Login berhasil |
| Articles | `/api/v1/articles/public?site=X` | GET | Artikel muncul |
| Articles | `/api/v1/articles` | POST | Buat artikel baru (dengan token) |
| Categories | `/api/v1/categories?site=X` | GET | Kategori muncul |
| Sites | `/api/v1/sites/settings?site=X` | GET | Config site muncul |
| Media | `/api/v1/media/upload` | POST | Upload berhasil |
| AI | `/api/v1/ai/rewrite` | POST | Respons AI muncul |
| Notifications | `/api/v1/notifications` | GET | List notifikasi |
| Newsletter | `/api/v1/newsletter/subscribe` | POST | Subscribe berhasil |
| Analytics | `/api/v1/analytics/traffic` | GET | Data traffic muncul |

- [x] Jalankan seluruh test di atas menggunakan Postman atau Thunder Client
- [x] Catat endpoint yang gagal dan perbaiki

---

### Step 5 — Validasi Multi-Tenant

**Goal**: Memastikan konten antar site (portal) benar-benar terisolasi dan tidak bocor.

#### Tugas
- [x] Buka `http://localhost:3000/bandung` — pastikan hanya artikel site Bandung yang muncul
- [x] Buka `http://localhost:3000/surabaya` — pastikan hanya artikel site Surabaya yang muncul
- [x] Test direct API: `GET /api/v1/articles/public?site=bandung` — hanya artikel Bandung
- [x] Pastikan header `x-site-id` dikirim dengan benar oleh Axios interceptor di `lib/api.ts`
- [x] Test: user dengan `siteId=bandung` tidak bisa CRUD artikel di site `surabaya` → harus 403

#### File Terkait
- [`apps/api/src/middleware/site.middleware.ts`](file:///d:/beritakarya/apps/api/src/middleware/site.middleware.ts)
- [`apps/web/store/siteStore.ts`](file:///d:/beritakarya/apps/web/store/siteStore.ts)
- [`apps/web/lib/api.ts`](file:///d:/beritakarya/apps/web/lib/api.ts)

---

### Step 6 — Media Upload Test

**Goal**: Memastikan pipeline upload gambar (`multer` → `sharp` → watermark → WebP → DB) berjalan end-to-end.

#### Tugas
- [x] Login ke dashboard → buka halaman upload media
- [x] Upload gambar JPG/PNG → pastikan tidak error
- [x] Verifikasi file `.webp` (full size) tersimpan di `apps/api/uploads/`
- [x] Verifikasi file `_thumb.webp` (400px) tersimpan di `apps/api/uploads/thumbs/`
- [x] Verifikasi watermark "BeritaKarya" tampil di pojok kanan bawah gambar
- [x] Verifikasi URL media tersimpan di database (tabel `Media`)
- [x] Test akses URL media dari browser → harus bisa diakses

#### File Terkait
- [`apps/api/src/modules/media/media.controller.ts`](file:///d:/beritakarya/apps/api/src/modules/media/media.controller.ts)

---

### Step 7 — Production Hardening

**Goal**: Memperkuat keamanan dan keandalan sebelum deploy ke production.

#### Tugas

**Security:**
- [x] Audit semua `console.log()` di `apps/api` → ganti dengan `logger.info/error/warn` (Winston)
- [x] Pastikan tidak ada secret key yang ter-commit ke Git (scan dengan `git-secrets` atau manual)
- [x] Verifikasi `helmet()` aktif di semua route → cek header `X-Content-Type-Options`, `X-Frame-Options`
- [x] Verifikasi `express-rate-limit` aktif dan dikonfigurasi dengan benar (auth: 10 req/15min)
- [x] Verifikasi `sanitizeMiddleware` aktif di semua route yang menerima input user

**Reliability:**
- [x] Tambah error boundary di `apps/web` untuk halaman publik
- [x] Tambah fallback UI jika API tidak tersedia (koneksi gagal)
- [x] Pastikan semua async handler di API menggunakan `asyncHandler()` wrapper (tidak ada unhandled promise rejection)

**Performance:**
- [x] Pastikan gambar menggunakan `next/image` dengan `priority` hanya untuk above-the-fold
- [x] Review `cache` policy pada semua SSR `fetch()` call:
  - Artikel publik: `revalidate: 60`
  - Site settings: `cache: 'no-store'`
  - Sitemap: `cache: 'no-store'`

#### File Terkait
- [`apps/api/src/lib/logger.ts`](file:///d:/beritakarya/apps/api/src/lib/logger.ts)
- [`apps/api/src/main.ts`](file:///d:/beritakarya/apps/api/src/main.ts)
- [`apps/api/src/utils/asyncHandler.ts`](file:///d:/beritakarya/apps/api/src/utils/asyncHandler.ts)

---

## Verification Plan (Phase 2)

### Urutan Eksekusi yang Direkomendasikan
1. **Step 1** (Database) → harus selesai sebelum Step 2
2. **Step 2** (Auth) → harus selesai sebelum Step 4
3. **Step 3** (Middleware) → bisa paralel dengan Step 2
4. **Step 4** (Smoke Test) → setelah Step 1 & 2 selesai
5. **Step 5** (Multi-tenant) → setelah Step 4 selesai
6. **Step 6** (Media) → setelah Step 4 selesai (paralel dengan Step 5)
7. **Step 7** (Hardening) → terakhir, setelah semua test lulus

### Definition of Done
Sebuah step dianggap **selesai** jika:
- Semua checklist `[ ]` sudah menjadi `[x]`
- Tidak ada error di console (browser & terminal)
- Tidak ada warning kritis yang belum tertangani
