# Skema Database (Prisma) 🗄️

Struktur data BeritaKarya dirancang untuk mendukung multi-tenancy, skalabilitas media, transparansi aksi (auditing), dan fitur interaktif (newsletter/iklan).

## 📊 Entitas Utama

### 1. `Site` (Multi-tenant Foundation)
Menyimpan konfigurasi untuk setiap portal berita.
- `id`: Unique identifier (misal: "pusat", "bandung").
- `domain`: Domain utama produksi (digunakan middleware untuk routing).
- `trendingTopics`: JSON array untuk topik hangat di navigasi.

### 2. `User` & `Auth`
Mengelola identitas dan hak akses (RBAC).
- `role`: `superadmin` | `pimred` | `journalist` | `reader`.
- `siteId`: Relasi ke `Site` (null untuk superadmin).
- `refreshTokens`: Token untuk session management yang aman.

### 3. `Article` (Core Content)
Menyimpan konten berita utama dengan workflow editorial yang ketat.
- `blocks`: JSON array berisi struktur artikel (Editor.js compatible).
- `status`: Enum (`draft`, `submitted`, `review`, `revision`, `approved`, `scheduled`, `published`, `archived`).
- `scheduledAt`: Waktu publikasi otomatis.
- `featuredImage`: Gambar utama untuk thumbnail dan OG Meta.

### 4. `ArticleVersion` (History)
Menyimpan snapshot konten artikel untuk audit dan pemulihan.

### 5. `Media` (Asset Management)
Metadata untuk gambar (WebP/JPEG) dan dokumen.
- `url` / `thumbUrl`: Link ke storage (local atau S3).
- `width` / `height` / `size`: Metadata teknis untuk optimasi frontend.

### 6. `Advertisement` 💰
Manajemen slot iklan per portal.
- `slot`: Lokasi iklan (`leaderboard`, `in_feed`, `sidebar`).
- `code`: Snippet script (AdSense) atau URL image banner.

### 7. `NewsletterSubscriber` 📧
Daftar langganan email per portal.

### 8. `AIUsage` 🤖
Logging penggunaan asisten AI untuk audit biaya dan performa.
- `action`: Fitur yang digunakan (expand, rewrite, headline).
- `latencyMs`: Monitoring performa AI.

### 9. `AuditLog` (Accountability)
Mencatat setiap aksi administratif sensitif.
- `oldValue` / `newValue`: Diff data dalam format JSON.

### 10. `Notification` 🔔
Sistem notifikasi internal untuk workflow redaksi.

## 🔗 Relasi Penting

- **Site ↔ Everything**: Hampir semua entitas (`User`, `Article`, `Category`, `Ad`, `Subscriber`, `AuditLog`) terikat pada `Site`.
- **Article ↔ ArticleVersion**: Relasi 1:N (Revision History).
- **Article ↔ Category**: Relasi 1:N.

## 🛠️ Pemeliharaan

- **Migration**: Gunakan `npx prisma migrate dev` saat pengembangan.
- **Sync**: Gunakan `pnpm db:push` untuk sinkronisasi schema cepat di staging/prod.
- **Client Generation**: Jalankan `npx prisma generate` untuk memperbarui types di node_modules.
