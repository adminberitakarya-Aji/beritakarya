# 📜 Changelog
Seluruh perubahan signifikan pada project **BeritaKarya** akan dicatat di file ini.

Format ini didasarkan pada [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [1.1.0] - 2026-05-12
### ✨ UI Refinement & KYC Planning

#### Added
- Membuat `implementasi_plan_KYC.md` sebagai panduan verifikasi identitas (KTP/KK) bagi kontributor.

#### Changed
- Mengubah teks tombol dashboard dari "+ Tulis Artikel" menjadi **"+ Post Berita"** untuk terminologi yang lebih umum.
- Sinkronisasi dashboard ads dan manajemen artikel.

---

## [1.0.0] - 2026-05-12
### 🚀 Infrastructure Stabilization (Milestone: Healthy)

#### Added
- Membuat `FULL_PROJECT_DOCUMENTATION.md` sebagai sumber kebenaran teknis tunggal.
- Membuat `VPS_MASTER_SETUP.md` untuk panduan instalasi ulang dari nol.
- Menambahkan `npm rebuild sharp` di Dockerfile untuk menjamin kualitas pemrosesan gambar di Linux Alpine.

#### Fixed
- **Module System**: Migrasi seluruh monorepo dari ESM ke **CommonJS** untuk menghapus error `ERR_MODULE_NOT_FOUND` di lingkungan Docker.
- **CORS**: Memperbaiki masalah "Double Header" pada Nginx Host-level yang memblokir login dan dashboard.
- **Media Paths**: Standarisasi path upload menggunakan `process.cwd()` dan sinkronisasi via **Bind Mount** ke `/opt/beritakarya/uploads`.
- **Docker Entrypoint**: Menyesuaikan path eksekusi `main.js` ke folder nested `dist/apps/api/src/main.js` sesuai struktur Turborepo.

#### Changed
- Mengoptimalkan Nginx untuk melayani file statis (gambar) secara langsung via `alias`, tanpa melalui kontainer Node.js.
- Membersihkan `docker-compose.backend.yml` dari atribut versi yang usang.

#### Security
- **Next.js Patch**: Upgrade `@beritakarya/web` ke Next.js **v16.2.6** untuk menutup celah keamanan *Middleware/Proxy bypass*.

---

## [0.1.0] - 2026-05-07
### Initial Infrastructure
- Inisialisasi arsitektur monorepo dengan Turborepo.
- Setup awal Docker Compose untuk API dan PostgreSQL.
- Konfigurasi awal Nginx dengan SSL Certbot.
