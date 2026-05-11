# 📑 BeritaKarya — Comprehensive Project Documentation
> **Date**: 12 May 2026 | **Status**: Production Ready & Optimized

Dokumen ini merangkum seluruh perubahan arsitektur, perbaikan infrastruktur, dan standarisasi kode yang telah dilakukan untuk memastikan BeritaKarya stabil di lingkungan produksi.

---

## 🏗️ 1. Arsitektur Monorepo
Project ini menggunakan **Turborepo** dengan struktur monorepo untuk efisiensi berbagi kode antar aplikasi.

*   **Standar Modul**: Seluruh paket (`apps/api`, `packages/*`) telah dikonversi ke **CommonJS**.
    *   *Alasan*: Menghindari error `ERR_MODULE_NOT_FOUND` yang sering muncul pada mode ESM di lingkungan Docker/Node.js yang kompleks.
*   **TypeScript Optimization**: Pengaturan `rootDir` telah dihapus dari `apps/api/tsconfig.json`.
    *   *Manfaat*: Mencegah TypeScript "mengotori" drive lokal (Windows) dengan folder bayangan dan memastikan output build di Docker konsisten.

---

## 🛠️ 2. Backend & API (Express.js)
Terletak di `apps/api`.

*   **Image Processing (Sharp)**: 
    *   Menggunakan library **Sharp** untuk konversi otomatis ke format `.webp` guna optimasi SEO dan kecepatan load.
    *   *Fix*: Menambahkan perintah `npm rebuild sharp` di Dockerfile agar binary sesuai dengan arsitektur Linux Alpine di VPS.
*   **Media & Upload System**:
    *   Menggunakan **Multer** untuk handling upload.
    *   Path upload diset menggunakan `process.cwd()` untuk fleksibilitas antara lokal dan Docker.
    *   *Fix*: Path permanen di VPS menggunakan **Bind Mount** ke `/opt/beritakarya/uploads`.
*   **CORS Configuration**:
    *   Sudah mendukung *Dynamic Origin* untuk domain utama (`beritakarya.co`), domain `.com`, serta testing via Vercel.

---

## 🎨 3. Frontend (Next.js)
Terletak di `apps/web`.

*   **Next.js 16 Security Patch**:
    *   Versi ditingkatkan ke **16.2.6** untuk menutup celah keamanan *Middleware/Proxy bypass*.
*   **Proxy System (Replacement of Middleware)**:
    *   Mengikuti standar Next.js 16, logika routing multi-tenant dipindahkan ke `proxy.ts` (menggantikan `middleware.ts`).
*   **State Management (Zustand)**:
    *   Implementasi pola reaktif pada store. Menghindari `getState()` di dalam komponen agar UI selalu sinkron dengan state terbaru.
*   **API Normalization**:
    *   `NEXT_PUBLIC_API_URL` sekarang menggunakan base URL saja (`https://api.beritakarya.co`), sementara suffix `/api/v1` ditangani secara otomatis oleh helper `lib/api.ts`.

---

## 🌐 4. Infrastruktur & DevOps
Sistem dideploy menggunakan Docker di VPS Ubuntu.

### Docker Configuration
*   **Optimized Dockerfile**: Menggunakan *Multi-stage build* untuk memperkecil ukuran image.
*   **Volume Sync**: Menggunakan *Bind Mount* langsung ke sistem host VPS untuk folder `/uploads`. Ini memungkinkan Nginx melayani gambar secara langsung tanpa membebani server Node.js.
*   **Clean Logs**: Menghapus atribut `version` yang usang pada `docker-compose.yml` untuk log yang lebih bersih.

### Nginx (Host-Level Proxy)
Nginx dikonfigurasi di level sistem operasi (bukan di dalam Docker) untuk performa maksimal.
*   **SSL**: Terintegrasi dengan Certbot (Let's Encrypt).
*   **Rate Limiting**: 
    *   `api_auth`: 10 request/menit (Keamanan login).
    *   `api_general`: 100 request/menit (Performa umum).
*   **CORS Double-Header Fix**: Nginx hanya menangani metode `OPTIONS` (Preflight), sementara request lainnya diserahkan ke Express untuk menghindari konflik header ganda.

---

## 🚀 5. Panduan Maintenance
*   **Update Kode**: `git pull` -> `docker compose ... up -d --build`.
*   **Cek Kesehatan**: `curl https://api.beritakarya.co/health`.
*   **Lokasi Gambar**: `/opt/beritakarya/uploads` di VPS.
*   **File Master Setup**: Tersedia di `VPS_MASTER_SETUP.md` sebagai panduan instalasi ulang dari nol.

---

## 🛰️ 6. Alur Flow Project (Request Lifecycle)
Memahami alur ini sangat penting agar tidak "bertabrakan" lagi antara Nginx dan Docker.

### A. Alur API Request
1.  **User/Browser** mengirim request ke `https://api.beritakarya.co`.
2.  **Nginx (Host)** menerima pertama kali:
    *   Mengecek SSL.
    *   Mengecek **Rate Limit** (Jika melampaui, Nginx langsung menolak, tidak sampai ke Docker).
    *   Mengecek **Method OPTIONS** (Preflight CORS). Nginx menjawab langsung di sini.
3.  **Reverse Proxy**: Jika request valid (GET/POST), Nginx meneruskan ke `http://127.0.0.1:3001` (Port Docker API).
4.  **Docker API (Express)**:
    *   Menerima request.
    *   Mengolah logika bisnis (Login, Article, AI).
    *   Mengirim balik response + Header CORS milik Express.
5.  **Nginx** meneruskan kembali ke Browser tanpa menambah header CORS lagi (untuk menghindari "Double Header").

### B. Alur Image Serving (Static Files)
Ini adalah alur yang kita optimasi agar sangat cepat:
1.  **Request** ke `https://api.beritakarya.co/api/v1/media/uploads/gambar.webp`.
2.  **Nginx** melihat alias `/api/v1/media/uploads/`.
3.  **Nginx** langsung mengambil file dari folder fisik `/opt/beritakarya/uploads/` di VPS.
4.  **Selesai**. Request gambar **TIDAK PERNAH** masuk ke Docker. Ini menghemat memori server secara signifikan.

---

## ⚠️ 7. Troubleshooting & "Ganjalan" Utama
Berdasarkan pengalaman perbaikan kemarin, berikut adalah hal-hal yang wajib diperhatikan:

### 1. Masalah Path Build (Docker vs Lokal)
*   **Masalah**: Di lokal build-nya *flat* (`dist/main.js`), tapi di Docker build-nya *nested* (`dist/apps/api/src/main.js`).
*   **Solusi**: Selalu gunakan perintah `docker run --rm -it <image> ls -R` untuk mengecek lokasi asli file sebelum mengubah perintah `CMD` di Dockerfile.

### 2. Masalah Modul (ESM vs CommonJS)
*   **Masalah**: Error `ERR_MODULE_NOT_FOUND` saat menggunakan mode ESM di dalam Docker.
*   **Solusi**: Tetap gunakan **CommonJS** (`"module": "CommonJS"` di tsconfig) untuk backend monorepo. Ini jauh lebih stabil untuk sinkronisasi antar paket (`packages/types`, dsb).

### 3. Masalah Izin Akses (Permissions)
*   **Masalah**: API tidak bisa menulis gambar (EACCES).
*   **Solusi**: Gunakan user ID `1001:1001` di Dockerfile dan pastikan folder di VPS (`/opt/beritakarya/uploads`) dimiliki oleh user yang sama (`chown 1001:1001`).

### 4. Masalah CORS Double Header
*   **Masalah**: Error "multiple values for Access-Control-Allow-Origin".
*   **Solusi**: Nginx hanya boleh memberikan header CORS pada blok `if ($request_method = 'OPTIONS')`. Untuk request biasa, biarkan Express yang memberikan header tersebut.

---

**Kesimpulan Akhir**:
Project BeritaKarya sekarang memiliki pondasi **Enterprise** yang siap menangani banyak portal (multi-site) dengan performa tinggi dan keamanan yang terjaga melalui sinkronisasi yang presisi antara Nginx, Docker, dan arsitektur Monorepo.
