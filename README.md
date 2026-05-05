# BeritaKarya 📰

Platform publikasi berita multi-tenant modern kelas dunia dengan asisten AI terintegrasi, alur kerja editorial profesional, dan sistem analitik real-time.

## 🚀 Fitur Unggulan

### 🏛️ Arsitektur Multi-Tenant
Satu core engine untuk mengelola jaringan portal berita (Pusat & Daerah). Konfigurasi domain dinamis dan isolasi data antar portal yang ketat.

### ✍️ Editorial Workflow Profesional
- **Block-based Editor**: Editor artikel fleksibel (teks, gambar, quote, grid).
- **Review Queue**: Alur kerja formal: `Draft` → `Submitted` → `Review` → `Scheduled` → `Published`.
- **Article Versioning**: Simpan snapshot konten dan pulihkan versi lama kapan saja.
- **Kalender Editorial**: Visualisasi jadwal terbit dalam tampilan kalender bulanan.

### 📊 Analytics & Monitoring
- **Real-time Traffic**: Visualisasi data pembaca menggunakan Recharts.
- **Monitor Tim**: Pantau produktivitas wartawan (output harian, views, status online).
- **Audit Log**: Transparansi penuh aksi administratif (siapa mengubah apa, kapan, dan IP address).

### 🤖 Smart Assistant (AI)
- **AI Content Helper**: Menulis ulang, memperluas paragraf, dan optimasi headline.
- **Automated Metadata**: Ekstraksi meta tags dan saran SEO otomatis.
- **Usage Tracking**: Audit penggunaan token AI per user/site.

### 🖼️ Manajemen Media & SEO
- **Media Manager**: Optimasi otomatis ke WebP, resize, watermarking, dan manajemen metadata IPTC.
- **SEO Panel**: Preview OpenGraph (FB) & Twitter Cards secara real-time sebelum publikasi.
- **Reader Tools**: Font size adjuster, Print-friendly view, dan sistem komentar premium.

## 📁 Struktur Monorepo

```text
beritakarya/
├── apps/
│   ├── api/          # Express.js Backend (Prisma, Multer, Sharp, SSE)
│   └── web/          # Next.js Frontend (Tailwind, Recharts, Framer Motion)
├── packages/
│   ├── types/        # Shared TypeScript interfaces
│   ├── config/       # Shared configurations (Site map, AI configs)
│   └── utils/        # Shared utility functions
├── infra/            # Docker, Nginx, & CI/CD configurations
└── docs/             # Dokumentasi teknis & workflow editorial
```

## 🛠️ Instalasi & Pengembangan

1. **Install Dependencies**:
   ```bash
   pnpm install
   ```

2. **Setup Environment**:
   Salin `.env.example` di `apps/api` dan `apps/web`. Untuk produksi, gunakan referensi di `.env.production.example`.

3. **Database Sync**:
   ```bash
   cd apps/api
   npx prisma db push
   npx prisma generate
   ```

4. **Run Development**:
   ```bash
   pnpm dev
   ```

## 🔐 Keamanan & Akses (RBAC)

1. **Superadmin**: Akses global lintas portal, manajemen situs, dan audit log pusat.
2. **Pimpinan Redaksi**: Manajemen redaksi daerah, approval artikel, dan statistik tim.
3. **Journalist**: Penulisan artikel dan pengiriman draft ke antrian review.
4. **Reader**: Akses publik, komentar, dan personalisasi bacaan.

## 📄 Dokumentasi Tambahan

Lihat folder `docs/` untuk detail lebih mendalam:
- [Workflow Editorial](./docs/EDITORIAL_WORKFLOW.md)
- [Skema Database](./docs/DATABASE_SCHEMA.md)
- [Panduan Produksi](./docs/PRODUCTION_SETUP.md)

---
© 2026 BeritaKarya Global Media. *Jernih Melihat Nusantara.*
