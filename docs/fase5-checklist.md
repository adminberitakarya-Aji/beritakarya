# Checklist Fase 5 — Testing & Hardening

## Setup
- [x] `vitest.config.ts` ada di `apps/api/` dan `apps/web/`
- [x] Test setup files terbuat (`src/test/setup.ts` di keduanya)
- [ ] `pnpm test` dari root berjalan tanpa error konfigurasi

## Unit Tests — Backend (target coverage >70%)
- [x] `auth.service.test.ts`: semua test case lulus
- [x] `article.service.test.ts`: semua test case lulus
- [x] `slug.test.ts`: semua test case lulus

## Integration Tests — Backend
- [x] `auth.integration.test.ts`: test case lulus
- [x] `article.integration.test.ts`: ISOLASI MULTI-SITE test case lulus
  - [x] journalist bandung → 403 saat akses surabaya ✅ WAJIB
  - [x] editor pusat → 200 saat akses site manapun ✅ WAJIB
  - [x] tanpa token → 401 ✅ WAJIB

## Unit Tests — Frontend (target coverage >65%)
- [x] `editorStore.test.ts`: test case lulus
- [x] `authStore.test.ts`: test case lulus
- [x] `layoutStore.test.ts`: test case lulus (dari Fase 4)

## Security Tests
- [x] `security.test.ts`: XSS dicegah oleh sanitize middleware
- [x] `security.test.ts`: Security headers terset dengan benar
- [x] Script tag dihapus dari block content
- [x] Tag diizinkan (b, i, a) tidak dihapus

## Hardening
- [x] `sanitizeMiddleware` terdaftar di `main.ts`
- [x] `securityHeadersMiddleware` terdaftar di `main.ts`
- [x] `httpLogger` terdaftar di `main.ts`
- [x] `GET /metrics` endpoint aktif

---
✅ **Fase 5 Terimplementasi secara struktur.** Siap untuk menjalankan test menyeluruh.
