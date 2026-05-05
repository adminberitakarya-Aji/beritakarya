# BeritaKarya 📰

Platform publikasi berita multi-site modern dengan asisten AI terintegrasi.

## Fitur Utama
- **Multi-site Architecture**: Satu instalasi untuk mengelola banyak sub-situs (misal: bandung.beritakarya.com, surabaya.beritakarya.com).
- **Block-based Editor**: Editor artikel fleksibel berbasis blok (teks, gambar, grid, embed).
- **AI Assistive**: Asisten AI untuk menulis ulang, memperluas konten, ekstraksi meta tag, dan optimasi layout.
- **Sistem Media Cerdas**: Konversi otomatis ke WebP dan pembuatan thumbnail untuk performa maksimal.
- **Security Hardened**: Perlindungan XSS (DOMPurify), rate limiting, dan header keamanan produksi.
- **Production Ready**: Konfigurasi Docker Compose, Nginx, dan CI/CD pipeline (GitHub Actions).

## Struktur Project
```text
beritakarya/
├── apps/
│   ├── api/          # Express.js Backend
│   └── web/          # Next.js Frontend (Admin & Public)
├── packages/
│   ├── types/        # Shared TypeScript interfaces
│   ├── config/       # Shared configurations
│   └── utils/        # Shared utility functions
├── infra/            # Docker, Nginx, & Setup scripts
└── docs/             # Dokumentasi fase pengembangan
```

## Cara Menjalankan (Lokal)
1. Install dependencies: `pnpm install`
2. Setup database: `cd apps/api && pnpm db:migrate`
3. Jalankan development server: `pnpm dev`

## Role-Based Access Control (RBAC)
Sistem ini menggunakan 4 tingkatan peran (role) untuk mengelola portal pusat dan daerah:

1. **Superadmin (Pusat)**
   - Akses global (lintas kota/cabang).
   - Bisa membuat/mengedit/menghapus/mem-publish SEMUA artikel di semua cabang.
   - Bisa mengundang/membuat akun Pimpinan Redaksi (Pimred) dan Jurnalis.
2. **Pimpinan Redaksi (Daerah)**
   - Terkunci pada satu daerah tertentu (`siteId`).
   - Bisa membuat/mengedit/menghapus/mem-publish artikel di cabangnya saja.
   - Bisa membuat akun Jurnalis untuk cabangnya.
3. **Journalist (Jurnalis)**
   - Terkunci pada satu daerah tertentu (`siteId`).
   - Hanya bisa membuat artikel, dan mengedit/menghapus artikel miliknya sendiri.
   - Tidak bisa mem-publish artikel (harus di-review Pimred/Superadmin).
4. **Reader (Pembaca Publik)**
   - Role default saat registrasi publik via web.
   - Membaca artikel, berkomentar, dan bookmark.

## Sistem Login (Authentication)
Aplikasi ini menggunakan **Custom JWT Authentication** mandiri (tidak menggunakan Auth bawaan Supabase), dengan alur:
1. **Login:** User memasukkan email & password. Password diverifikasi dengan algoritma `Bcrypt` di backend.
2. **Token:** Backend menerbitkan 2 token:
   - *Access Token (15 menit)*: Digunakan di Header untuk memvalidasi request API.
   - *Refresh Token (7 hari)*: Disimpan di DB untuk memperpanjang sesi tanpa login ulang.
3. **Frontend:** Menyimpan status login di state management `Zustand` dan menolak akses UI jika role tidak sesuai (misal tombol Publish disembunyikan untuk Jurnalis).

## Deployment
Lihat panduan manual setup Supabase di `apps/api/prisma/supabase-setup.sql` dan deploy web/api ke Vercel/Railway.

---
© 2026 BeritaKarya Project
