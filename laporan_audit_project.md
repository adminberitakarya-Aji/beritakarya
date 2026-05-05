# 📰 LAPORAN ANALISIS PROFESIONAL — PROJECT BERITAKARYA
> **Analis:** Antigravity — Senior Website Portal Berita Development  
> **Tanggal:** 5 Mei 2026  
> **Scope:** Full-stack analysis — Arsitektur, Teknologi, Database, Infrastruktur, Perbandingan dengan Referensi  
> **Status Keseluruhan:** 🟡 **ARSITEKTUR MATANG — BEBERAPA AREA PERLU PERHATIAN**

---

## 🗂️ RINGKASAN EKSEKUTIF

**BeritaKarya** adalah platform publikasi berita **multi-tenant** enterprise-grade yang dibangun di atas monorepo **pnpm + Turborepo**. Ini adalah proyek yang jauh lebih kompleks dan lebih siap produksi dibanding folder referensi `contoh/berita_karya`. Project ini dirancang untuk mengelola **jaringan portal berita regional** (pusat, bandung, surabaya) dari satu instalasi tunggal, lengkap dengan backend custom JWT, CMS terintegrasi, dan infrastruktur Docker/Nginx.

---

## 📊 SCORECARD RINGKAS

| Area | Skor | Status |
|---|---|---|
| Arsitektur Monorepo | 90/100 | ✅ Sangat Baik |
| Desain Database (Prisma) | 88/100 | ✅ Sangat Baik |
| Backend API (Express) | 85/100 | ✅ Baik |
| Frontend (Next.js) | 78/100 | 🟡 Baik |
| Keamanan | 80/100 | 🟡 Baik |
| Infrastruktur (Docker/Nginx) | 85/100 | ✅ Baik |
| State Management | 82/100 | ✅ Baik |
| **TOTAL** | **84/100** | 🟢 **Baik** |

---

## 🏗️ BAGIAN 1: ARSITEKTUR PROJECT BERITAKARYA

### 1.1 Struktur Monorepo Turborepo

```
beritakarya/                  ← Root Monorepo (pnpm + Turborepo)
├── apps/
│   ├── api/                  ← Backend: Express.js + Prisma + PostgreSQL
│   └── web/                  ← Frontend: Next.js 14 (App Router)
├── packages/
│   ├── config/               ← SITE_MAP, AI_CONFIG (shared)
│   ├── types/                ← Shared TypeScript interfaces
│   └── utils/                ← Shared utility functions
├── infra/
│   ├── docker/               ← Dockerfile API & Web, Docker Compose
│   └── nginx/                ← nginx.conf (dev, staging, prod)
└── docs/                     ← Dokumentasi fase pengembangan
```

**Kekuatan:**
- Monorepo dengan Turborepo memastikan build paralel & cache yang efisien
- Shared packages `@beritakarya/config`, `@beritakarya/types`, `@beritakarya/utils` mencegah duplikasi kode antara `api` dan `web`
- Pemisahan concerns yang jelas: API hanya bertugas sebagai REST backend, Web hanya sebagai UI layer

### 1.2 Multi-Tenant Architecture

Ini adalah fitur paling kritis dan paling canggih dari project ini:

```typescript
// packages/config/src/site.ts
export const SITE_MAP = {
  pusat:    { id: 'pusat',    domain: 'beritakarya.co',          devDomain: 'localhost:3000' },
  bandung:  { id: 'bandung',  domain: 'bandung.beritakarya.com', devDomain: 'bandung.localhost:3000' },
  surabaya: { id: 'surabaya', domain: 'surabaya.beritakarya.com',devDomain: 'surabaya.localhost:3000' },
}
```

**Cara kerja resolusi tenant:**
1. **Next.js Middleware** membaca subdomain dari `host` header
2. Jika subdomain valid → set cookie `siteId` + header `x-site-id`
3. URL `/` atau `/dashboard` di-rewrite internal ke `/[siteId]/`
4. **App Router `[site]`** menjadi dynamic segment yang menentukan konten

**Konsekuensi di Database:**
- Setiap model (`Article`, `Category`, `Advertisement`, `User`) memiliki kolom `siteId`
- Row-Level data isolation: satu query selalu difilter berdasarkan `siteId`

---

## 🗄️ BAGIAN 2: ARSITEKTUR DATABASE (PRISMA + POSTGRESQL)

### 2.1 Skema Database

| Model | Kolom Kunci | Relasi |
|---|---|---|
| **Site** | `id`, `name`, `domain` | → Users, Articles, Categories, Ads |
| **User** | `email`, `passwordHash`, `role`, `siteId?` | → Site, Articles, RefreshTokens |
| **Article** | `siteId`, `authorId`, `categoryId`, `blocks(JSON)`, `status`, `slug` | → Site, User, Category |
| **Category** | `name`, `slug`, `siteId` | → Site, Articles |
| **Advertisement** | `siteId`, `slot`, `code`, `imageUrl`, `linkUrl` | → Site |
| **RefreshToken** | `token`, `userId`, `expiresAt` | → User |
| **AIUsage** | `userId`, `siteId`, `action`, `latencyMs`, `success` | Audit AI calls |
| **Media** | `url`, `thumbUrl`, `width`, `height`, `siteId?` | Media library |

### 2.2 Poin Teknis Penting
- **Block-based content**: `Article.blocks` disimpan sebagai `Json[]` — editor berbasis blok (bukan WYSIWYG klasik)
- **Slug unik per site**: `@@unique([siteId, slug])` — slug `/berita-x` bisa ada di `pusat` DAN `bandung` secara bersamaan
- **JWT Mandiri**: Menggunakan `RefreshToken` table sendiri, tidak bergantung pada Auth provider eksternal
- **AIUsage audit table**: Setiap panggilan AI dicatat (latency, success rate) untuk monitoring biaya & performa

---

## ⚙️ BAGIAN 3: BACKEND API (EXPRESS.JS)

### 3.1 Endpoint yang Tersedia

```
POST   /api/v1/auth/*         ← Login, Register, Refresh Token (rate-limited 10rpm)
GET    /api/v1/articles/public ← Public article listing (per site)
*      /api/v1/articles/*     ← CRUD artikel (auth required)
*      /api/v1/categories/*   ← Kelola kategori
*      /api/v1/media/*        ← Upload & manage media (WebP conversion)
*      /api/v1/ai/*           ← AI assistant (rewrite, expand, SEO, dll)
*      /api/v1/ads/*          ← Kelola iklan & banner
*      /api/v1/users/*        ← Manajemen tim redaksi
GET    /health                ← Health check
GET    /metrics               ← System metrics (uptime, memory)
```

### 3.2 Layer Middleware (Security Stack)

```
Request → Helmet → CORS → JSON Parser → Sanitize → RequestID → 
         HTTP Logger → Rate Limiter → Router → Error Handler
```

| Middleware | Fungsi |
|---|---|
| `helmet` | Security headers (XSS, CSRF, nosniff) |
| `cors` | Whitelist domain `*.beritakarya.com` dan localhost |
| `sanitizeMiddleware` | DOMPurify — cegah XSS di body request |
| `requestIdMiddleware` | UUID per request untuk tracing |
| `httpLogger` | Winston structured logging |
| `authLimiter` | 10 req/menit untuk endpoint auth |
| `apiLimiter` | Rate limit global untuk `/api/v1` |
| `errorMiddleware` | Centralized error handling |

### 3.3 Pola Arsitektur per Modul

Setiap modul mengikuti pola **Controller → Service → Repository**:

```
article/
├── article.controller.ts    ← Handle HTTP req/res, validasi
├── article.service.ts       ← Business logic
├── article.repository.ts    ← Database queries (Prisma)
├── article.validator.ts     ← Zod schemas
├── article.service.test.ts  ← Unit tests
└── article.integration.test.ts ← Integration tests
```

**AI Actions yang didukung:**
`rewrite` | `expand` | `headline` | `seo` | `grammar` | `readability` | `layout` | `caption`

---

## 🌐 BAGIAN 4: FRONTEND (NEXT.JS 14 APP ROUTER)

### 4.1 Struktur Routing

```
app/
├── layout.tsx                ← Root layout
├── page.tsx                  ← Redirect ke /[site]
├── login/                    ← Login page
├── register/                 ← Register page
├── [site]/
│   ├── page.tsx              ← Homepage per tenant (SSR)
│   ├── loading.tsx           ← Loading UI (Suspense)
│   ├── artikel/
│   │   └── [slug]/page.tsx   ← Detail artikel
│   └── dashboard/
│       ├── layout.tsx        ← Dashboard sidebar layout (RBAC)
│       ├── page.tsx          ← Dashboard overview
│       ├── articles/         ← Manajemen artikel
│       ├── categories/       ← Manajemen kategori
│       ├── ads/              ← Manajemen iklan
│       └── users/            ← Manajemen tim (superadmin only)
└── api/                      ← Next.js API routes (proxy)
```

### 4.2 State Management (Zustand)

| Store | Isi |
|---|---|
| `authStore.ts` | `user`, `accessToken`, `login()`, `logout()` |
| `editorStore.ts` | State block editor artikel |
| `layoutStore.ts` | Dark mode, sidebar state |
| `siteStore.ts` | `siteId` aktif saat ini |

### 4.3 Komponen UI Utama

| Komponen | Fungsi |
|---|---|
| `NewsCard` | Card artikel (variant: large, medium, minimal) |
| `LoadMoreArticles` | Infinite scroll / pagination |
| `AISummary` | Widget ringkasan AI artikel |
| `AdSpace` | Slot iklan (leaderboard, in-feed, rectangle) |
| `BreakingNewsTicker` | Breaking news ticker animasi |
| `VideoWidget` | Widget video dengan thumbnail |
| `Skeleton` | Loading skeleton (hero, card, minimal, trending) |
| `DateTimeWeather` | Widget tanggal/waktu/cuaca |
| `ShareSidebar` | Share artikel ke sosmed |
| `ReadingProgress` | Progress bar membaca artikel |

### 4.4 Dashboard RBAC

```typescript
const navigation = [
  { name: 'Ringkasan',    roles: ['superadmin', 'pimred', 'journalist'] },
  { name: 'Artikel',      roles: ['superadmin', 'pimred', 'journalist'] },
  { name: 'Kategori',     roles: ['superadmin', 'pimred'] },
  { name: 'Iklan & Banner', roles: ['superadmin', 'pimred'] },
  { name: 'Tim Redaksi',  roles: ['superadmin'] },  // Only superadmin
]
```

---

## 🔒 BAGIAN 5: SISTEM AUTENTIKASI & KEAMANAN

### 5.1 Alur JWT Custom

```
Login → Verify bcrypt → Issue AccessToken (15 min) + RefreshToken (7 hari)
     → Frontend: Zustand store + localStorage
     → Auto refresh saat token expired
     → Logout: clear store + hapus refreshToken dari DB
```

### 5.2 RBAC Hierarki

| Role | Cakupan | Kemampuan |
|---|---|---|
| `superadmin` | Global (lintas site) | Full access semua site |
| `pimred` | Site-scoped | Kelola artikel, kategori, iklan, journalist di sitenya |
| `journalist` | Site-scoped | Buat & edit artikel milik sendiri (draft only) |
| `reader` | Public | Baca artikel, bookmark |

---

## 🚢 BAGIAN 6: INFRASTRUKTUR PRODUKSI

### 6.1 Docker Stack

```yaml
# docker-compose.prod.yml
services:
  db:      PostgreSQL 16
  redis:   Redis 7 (session/rate-limit cache)
  api:     @beritakarya/api (PORT 4000)
  web:     @beritakarya/web (PORT 3000)
  nginx:   Reverse proxy (PORT 80/443)
```

### 6.2 Nginx Production Config

- **HTTP → HTTPS redirect** otomatis
- **SSL/TLS 1.2 + 1.3** dengan HSTS
- **Rate limiting**: API 100rpm, Auth 10rpm
- **Gzip compression** untuk semua response text
- **Wildcard domain**: `*.beritakarya.com` handle semua subdomain tenant
- **X-Site-ID header** diekstrak dari subdomain dan dikirim ke backend
- **Upload caching**: `/uploads/` cached 7 hari di browser

### 6.3 CI/CD

- GitHub Actions (`.github/`) — otomatis build & deploy
- Procfile tersedia untuk Heroku/Railway deployment

---

## 📦 BAGIAN 7: PERBANDINGAN DENGAN FOLDER `contoh/berita_karya`

### 7.1 Overview Kontras

| Aspek | `contoh/berita_karya` (Referensi) | `beritakarya/` (Production) |
|---|---|---|
| **Tech Stack** | React 19 + Vite 6 + Supabase | Next.js 14 + Express + Prisma + PostgreSQL |
| **Arsitektur** | Single-tenant SPA | Multi-tenant monorepo |
| **Auth** | Google OAuth via Supabase | Custom JWT (bcrypt + refresh token) |
| **Database** | Supabase (BaaS) | Self-hosted PostgreSQL + Prisma ORM |
| **AI Provider** | Gemini + OpenAI + Claude (multi) | OpenAI GPT-4o |
| **State** | useState/useEffect hooks | Zustand (authStore, editorStore, layoutStore) |
| **Routing** | SPA (React Router tidak eksplisit) | Next.js App Router + Multi-tenant middleware |
| **Deployment** | Vercel (serverless) | Docker Compose + Nginx (self-hosted) |
| **Kompleksitas** | Portal berita regional (1 site) | Jaringan portal (N sites) |
| **Testing** | Tidak ada | Vitest (unit + integration per modul) |

### 7.2 Fitur yang Ada di `contoh` tapi BELUM OPTIMAL di project utama

| Fitur | Contoh | BeritaKarya Utama |
|---|---|---|
| Dark mode toggle | ✅ Navbar | 🟡 `layoutStore.ts` ada, UI toggle belum terkoneksi sempurna |
| Breaking news ticker | ✅ Komponen `BreakingNewsTicker` | ✅ Ada |
| Bookmark artikel | ✅ Hook `useBookmarks` + Supabase sync | ❓ Belum terlihat di web |
| Social media share | ✅ Footer social links dinamis | 🟡 `ShareSidebar.tsx` ada, integrasi belum dikonfirmasi |
| AI Summary widget | ✅ Multi-provider (Gemini/GPT/Claude) | 🟡 `AISummary.tsx` ada, terhubung ke API |
| Artikel deep-link URL | ✅ `/artikel/<id>` dengan prerender | 🟡 Routing `/[site]/artikel/[slug]` ada |
| Skeleton loading | ✅ Full variants | ✅ Ada (hero, card, minimal, trending) |

### 7.3 Fitur yang ADA di project utama tapi TIDAK ADA di `contoh`

| Fitur | BeritaKarya Utama |
|---|---|
| Multi-tenant (jaringan portal) | ✅ Via SITE_MAP + Middleware |
| Dashboard Admin lengkap | ✅ (Artikel, Kategori, Iklan, Users) |
| Block-based article editor | ✅ `editorStore.ts` |
| Media management + WebP conversion | ✅ `mediaRouter` + `sharp` |
| Rate limiting per endpoint | ✅ (Auth: 10rpm, API: 100rpm) |
| Full test suite | ✅ Vitest unit + integration |
| Docker Compose stack | ✅ Dev + Prod |
| Nginx multi-domain config | ✅ Wildcard subdomain |
| CI/CD via GitHub Actions | ✅ |
| AIUsage audit logging | ✅ DB table + `/api/v1/ai` |
| Sistem metrics & monitoring | ✅ `/metrics` endpoint |

### 7.4 Masalah yang Diperbaiki dari Versi `contoh`

Berdasarkan audit report yang ada di `contoh/audit_report.md` (score 66/100), semua masalah kritis TELAH diperbaiki di project utama:

| Masalah Lama (Contoh) | Solusi di BeritaKarya Utama |
|---|---|
| Admin role hardcoded email | ✅ Custom JWT + role di database |
| Gambar Base64 di Firestore | ✅ Dedicated media upload endpoint + WebP |
| XSS via GA ID injection | ✅ Sanitize middleware (DOMPurify) |
| Model AI salah nama | ✅ Config terpusat di `packages/config/src/ai.ts` |
| God component `App.tsx` (585 baris) | ✅ Dipecah ke store (Zustand) + components |
| `CMS.tsx` monolitik (1308 baris) | ✅ Dipecah ke routes dashboard terpisah |
| Tidak ada testing | ✅ Vitest unit + integration per modul |
| Tidak ada rate limiting | ✅ `authLimiter` + `apiLimiter` |

---

## ⚠️ BAGIAN 8: TEMUAN & AREA YANG PERLU PERHATIAN

### 🔴 P1 — KRITIS

#### [K1] README.md Corrupt
File `README.md` mengandung byte sampah (UTF-16 null characters) di bagian bawah:
```
#\u0000 \u0000b\u0000e\u0000r\u0000i\u0000t\u0000a\u0000...
```
Ini terjadi karena ada merge conflict atau copy-paste dari file dengan encoding berbeda. Harus dibersihkan.

#### [K2] `ioredis` Ada di Dependencies API tapi Tidak Terlihat Digunakan
Redis client (`ioredis`) terdaftar sebagai dependency di `apps/api/package.json`, namun implementasi aktual di kode belum dikonfirmasi. Jika Redis digunakan untuk caching token atau session, harus diverifikasi bahwa `REDIS_URL` sudah dikonfigurasi di `.env`.

### 🟡 P2 — PENTING

#### [M1] `.env.local` Web Sangat Minimal (3 Baris)
File `apps/web/.env.local` hanya berisi 2 variabel:
```
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_URL=http://localhost:3000
```
Variabel untuk fitur lain (AI key, dll) mungkin belum lengkap. Perlu validasi apakah semua fitur sudah terkonfigurasi dengan benar.

#### [M2] Middleware Tenant-ID di Localhost Masih Menggunakan `searchParams`
```typescript
// middleware.ts
let siteId = isLocalhost
  ? req.nextUrl.searchParams.get('site') || subdomain
  : subdomain
```
Di localhost, pengembang harus menggunakan `?site=bandung` untuk test tenant lain. Ini tidak intuitif. Lebih baik menggunakan custom host di `/etc/hosts` atau membuat dev helper yang lebih jelas.

#### [M3] `KNOWN_SITE_IDS` Hanya 3 Tenant
Saat ini hanya ada `pusat`, `bandung`, `surabaya`. Jika ada penambahan tenant baru, developer harus:
1. Update `packages/config/src/site.ts`
2. Rebuild package `config`
3. Redeploy

Tidak ada mekanisme dynamic tenant registration dari database.

#### [M4] Tags Artikel Masih Hardcoded di Homepage
```typescript
// apps/web/app/[site]/page.tsx
const tags = ['Galian C', 'Reformasi Hukum', 'Ketahanan Keluarga', 'IKN', 'Gresik Hari Ini', 'Pilpres 2029']
```
Tags "Topik Hangat" di sidebar tidak diambil dari database/API, masih hardcoded. Seharusnya dapat dikonfigurasi per site dari dashboard.

### 🟢 P3 — NICE TO HAVE

#### [N1] Tidak Ada Sitemap Dinamis
Dengan sistem multi-tenant, sitemap idealnya ter-generate dinamis per site: `sitemap-pusat.xml`, `sitemap-bandung.xml`, dll.

#### [N2] SEO per Artikel Belum Dikonfirmasi
Field `metaTitle` dan `metaDescription` sudah ada di Prisma schema, namun perlu diverifikasi apakah sudah digunakan di `generateMetadata()` Next.js di halaman detail artikel.

#### [N3] Tidak Ada Newsletter Integration
Widget newsletter di sidebar sudah ada (form email), tapi belum ada backend handler untuk menyimpan subscriber.

---

## 📋 BAGIAN 9: REKOMENDASI PRIORITAS

### Sprint 1 (Segera)
| ID | Task | Estimasi |
|---|---|---|
| K1 | Bersihkan `README.md` dari byte corrupt | 5 menit |
| K2 | Verifikasi implementasi Redis atau hapus dependency | 30 menit |
| M3 | Pindahkan "Topik Hangat" ke API/database | 2-3 jam |

### Sprint 2 (Bulan Ini)
| ID | Task | Estimasi |
|---|---|---|
| M2 | Buat helper dev untuk multi-tenant localhost (contoh: `hosts` file docs) | 1 jam |
| N2 | Verifikasi & implementasi `generateMetadata()` per artikel | 2 jam |
| N3 | Implementasi newsletter subscriber endpoint di API | 3-4 jam |

### Backlog
| ID | Task |
|---|---|
| N1 | Generate sitemap dinamis per tenant |
| — | Tambah tenant baru (misal: jakarta, surabaya2) via dashboard |
| — | Implementasi bookmark untuk reader di web |

---

## ✅ KESIMPULAN

Project **BeritaKarya** merupakan implementasi yang **jauh lebih matang dan enterprise-grade** dibandingkan referensi di folder `contoh/berita_karya`. 

**Keunggulan utama:**
1. **Arsitektur multi-tenant** yang solid — satu platform untuk banyak portal regional
2. **Security stack lengkap** — JWT custom, RBAC, rate limiting, DOMPurify, helmet
3. **Infrastruktur produksi siap pakai** — Docker Compose, Nginx wildcard SSL, monitoring
4. **Testing coverage** — Unit + integration test per modul API
5. **Shared packages** — Tidak ada duplikasi kode antara frontend dan backend

**Area yang perlu diselesaikan:**
- Beberapa fitur UX masih hardcoded (topik hangat, tags)
- Perlu konfirmasi Redis dan beberapa env variables
- SEO per artikel perlu diverifikasi end-to-end

Secara keseluruhan, project ini memiliki **fondasi arsitektur yang sangat kuat** dan siap untuk dikembangkan lebih lanjut menuju produksi. Skor estimasi: **84/100**.

---

*Laporan ini dihasilkan melalui analisis statis kode pada 5 Mei 2026.*
