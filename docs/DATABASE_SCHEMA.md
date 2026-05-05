# Skema Database (Prisma) 🗄️

Struktur data BeritaKarya dirancang untuk mendukung multi-tenancy, skalabilitas media, dan transparansi aksi (auditing).

## 📊 Entitas Utama

### 1. `Site` (Multi-tenant Foundation)
Menyimpan konfigurasi untuk setiap portal berita (Pusat, Bandung, Surabaya, dll).
- `id`: Unique identifier (misal: "pusat", "bandung").
- `domain`: Domain utama produksi.
- `trendingTopics`: JSON array untuk topik hangat di navigasi.

### 2. `User` & `Auth`
Mengelola identitas dan hak akses (RBAC).
- `role`: `superadmin` | `pimred` | `journalist` | `reader`.
- `siteId`: Relasi ke `Site` (null untuk superadmin).

### 3. `Article` (Core Content)
Menyimpan konten berita utama.
- `blocks`: JSON array berisi struktur artikel (Editor.js compatible).
- `status`: Enum untuk workflow (draft, review, published, dll).
- `viewCount`: Counter pembaca real-time.
- `isBreaking` / `isExclusive`: Flag untuk UI hierarchy.

### 4. `ArticleVersion` (History)
Menyimpan snapshot konten artikel untuk audit dan pemulihan.
- `articleId`: Relasi ke artikel induk.
- `blocks`: Snapshot data blok pada waktu tertentu.
- `version`: Penomoran versi sekuensial.

### 5. `Media` (Asset Management)
Metadata untuk gambar dan dokumen.
- `url` / `thumbUrl`: Link ke storage.
- `altText` / `caption` / `credit`: Data SEO dan atribusi.
- `userId`: Pengunggah media.

### 6. `AuditLog` (Accountability)
Mencatat setiap aksi administratif sensitif.
- `action`: Jenis aksi (misal: `article.publish`, `user.update`).
- `oldValue` / `newValue`: Perbandingan data JSON sebelum dan sesudah aksi.
- `ipAddress`: Pelacakan asal request.

## 🔗 Relasi Penting

- **Site ↔ Article**: Relasi 1:N. Semua artikel terikat pada satu site.
- **User ↔ Article**: Relasi 1:N (Author).
- **Article ↔ Category**: Relasi 1:N.
- **Article ↔ ArticleVersion**: Relasi 1:N (Revision History).

## 🛠️ Pemeliharaan

- **Migration**: Gunakan `npx prisma migrate dev` saat pengembangan.
- **Sync**: Gunakan `npx prisma db push` untuk update schema cepat di staging/prod.
- **Seed**: Jalankan script seeding untuk inisialisasi data situs default.
