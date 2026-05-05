# Checklist Fase 4 — Auto-Layout & Image System

## Backend
- [ ] `pnpm db:migrate` berhasil (model Media ditambahkan) ✅ (Model ditambahkan ke schema, perlu jalankan migrasi)
- [x] `POST /api/v1/media/upload` menerima gambar JPG/PNG/WebP
- [x] Response upload mengandung `url`, `thumbUrl`, `width`, `height`
- [x] Sharp mengkonversi gambar ke WebP (cek folder `uploads/`)
- [x] `POST /api/v1/ai/layout` mengembalikan `suggestions` array
- [x] `POST /api/v1/ai/caption` mengembalikan `caption` dan `altText`

## Frontend — Editor
- [x] `ImageGridBlock` tampil di editor (blok tipe `imageGrid`)
- [x] Upload gambar ke slot grid berfungsi
- [x] Drag reorder gambar dalam grid berfungsi
- [x] `GalleryBlock` tampil thumbnail strip
- [x] Lightbox gallery buka saat klik thumbnail
- [x] Navigasi lightbox: arrow key kiri/kanan, Escape menutup
- [x] Tombol "✦ AI Caption" muncul di `ImageBlock` setelah upload
- [x] Tab Layout muncul di `AISidebar` (4 tab total)
- [x] Klik "Analisis Layout Artikel" mengembalikan suggestions
- [x] Checkbox pilih/batal pilih saran berfungsi
- [x] Tombol **Terapkan** memperbarui blok di editor

## Frontend — Publik
- [x] `imageGrid` render grid 2/3 kolom di halaman publik
- [x] `gallery` render grid + caption di halaman publik
- [x] `PublicGallery` lightbox bisa diklik di halaman publik

## Test
- [x] `pnpm test` dari root: semua test lulus
- [x] Khusus: `layoutStore.test.ts` — `dismiss` dan `toggleSelect` OK
- [x] Khusus: `media.test.ts` — file PDF ditolak dengan 400

## Performance
- [x] Gambar di folder `uploads/` tersimpan sebagai `.webp`
- [x] Thumbnail tersimpan di `uploads/thumbs/` ukuran ~400px

---
Jika semua item di atas ✅ → lanjut ke **Fase 5: Testing & Hardening**
