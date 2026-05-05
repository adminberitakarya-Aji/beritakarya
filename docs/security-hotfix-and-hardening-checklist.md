# Security Hotfix + Hardening Checklist

## Scope
- Critical security hotfix (24 jam)
- High-priority hardening (public route, media URL, deploy reliability)
- Verifikasi pasca-fix (test + smoke deploy)
- Deployment: **Supabase (DB) + Vercel/Platform hosting (web & API)** — tanpa Docker

## A. Critical Hotfix (0-24 jam)
- [x] Pastikan file sensitif `.env` tidak ada lagi di repository.
- [ ] Rotate credential yang pernah terekspos:
  - [ ] Rotate password Supabase DB (`DATABASE_URL`) via Supabase Dashboard.
  - [x] Generate `JWT_SECRET` baru (minimal 64 karakter random, ganti placeholder saat ini).
  - [ ] Verifikasi `OPENAI_API_KEY` — rotate jika pernah terekspos.
- [x] Pastikan endpoint public register tidak dapat membuat role `editor`.
- [x] Verifikasi endpoint admin/create user tetap berjalan untuk provisioning `editor`. (Verified in `user.controller.ts`)

## B. High Hardening (1-3 hari)
- [x] Verifikasi endpoint publik artikel slug dapat diakses tanpa token. (Verified in `article.controller.ts`)
- [x] Verifikasi endpoint publik artikel hanya mengembalikan artikel berstatus `published`. (Verified in `article.service.ts`)
- [ ] Verifikasi URL upload media yang dikembalikan API valid dan file bisa diakses.
- [ ] Pastikan `API_URL` di environment production mengarah ke URL hosting API yang benar.
- [ ] Pastikan `NEXT_PUBLIC_API_URL` di environment web mengarah ke URL API production yang benar.

## C. Test Verification (CI/Local)
- [x] Jalankan `pnpm --filter @beritakarya/web test`.
- [ ] Jalankan `pnpm --filter @beritakarya/api test` — pastikan semua suite PASS (perbaiki crash exit `3221225477`).
- [ ] Jalankan `pnpm turbo run type-check` — pastikan PASS tanpa error.
- [x] Jalankan `pnpm turbo run lint`.
- [ ] Pastikan tidak ada test regression di auth/article/media path.

## D. Supabase & Deployment Verification
- [ ] Verifikasi koneksi `DATABASE_URL` ke Supabase production berhasil (`prisma migrate deploy`).
- [ ] Verifikasi Supabase Row Level Security (RLS) sudah aktif di tabel sensitif (jika digunakan).
- [ ] Verifikasi Supabase connection pooling (gunakan port `6543` untuk pooled connection di production).
- [ ] Deploy web (Next.js) ke Vercel / platform hosting — pastikan build sukses.
- [ ] Deploy API (Express) ke Railway / Render / platform hosting — pastikan berjalan.
- [ ] Pastikan environment variables production sudah di-set di platform hosting (bukan hardcode).
- [ ] Cek endpoint publik artikel:
  - [ ] `GET /api/v1/articles/slug/{slug}?site={site}` → `200` untuk `published`
  - [ ] `GET /api/v1/articles/slug/{slug}?site={site}` → `404` untuk non-published/tidak ada
- [ ] Cek upload media:
  - [ ] Upload image via endpoint media
  - [ ] Buka `url` dan `thumbUrl` hasil response, pastikan keduanya `200`

## E. Post-Deploy Monitoring (24 jam pertama)
- [ ] Pantau error rate API (`4xx`, `5xx`) per endpoint auth/article/media.
- [ ] Pantau latensi endpoint publik artikel.
- [ ] Review log security untuk percobaan register role escalation.
- [ ] Pastikan Supabase dashboard menunjukkan connection pool stabil (tidak saturated).

## F. Execution Notes (hasil run saat ini)
- `pnpm --filter @beritakarya/web test` berhasil (12/12 pass).
- `pnpm --filter @beritakarya/api test` dijalankan tetapi masih gagal (sebagian suite existing issue, termasuk AI env/dependency dan media test assertion; run terakhir crash di Windows dengan exit `3221225477`).
- `pnpm turbo run type-check` dijalankan tetapi gagal karena existing syntax error di `apps/web/components/editor/ai/ValidateTab.tsx`.
- `pnpm turbo run lint` sudah berhasil dijalankan setelah penambahan konfigurasi ESLint root + Next.js (tanpa error, masih ada beberapa warning existing).
- Warning prioritas web sudah dikurangi (perbaikan `react-hooks/exhaustive-deps` di editor dan `jsx-a11y/alt-text` di gallery thumbnail); warning tersisa dominan `@next/next/no-img-element`.
- Migrasi bertahap `<img>` -> `next/image` sudah diterapkan di halaman artikel publik dan komponen galeri/editor utama, sehingga lint `@beritakarya/web` sekarang bersih tanpa warning/error.
- Pembersihan warning `@beritakarya/api` selesai (unused imports/vars + penyesuaian rule arg `_`), verifikasi `pnpm --filter @beritakarya/api lint` dan `pnpm --filter @beritakarya/web lint` keduanya clean tanpa warning/error.
- Strategi deployment: **Supabase (DB PostgreSQL) + Vercel/platform hosting** — Docker dihilangkan dari scope.
