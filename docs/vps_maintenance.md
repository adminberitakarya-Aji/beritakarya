# Panduan Perintah Pemeliharaan VPS BeritaKarya

Dokumen ini berisi daftar perintah penting untuk mengelola, memperbarui, dan memelihara backend BeritaKarya yang berjalan di VPS menggunakan Docker.

## 1. Memperbarui Kode (Update)
Gunakan urutan ini saat Anda telah melakukan perubahan kode di lokal dan ingin menerapkannya di VPS.

```bash
# Masuk ke direktori project
cd ~/beritakarya

# Ambil kode terbaru dari GitHub
git pull origin main

# Rebuild container backend (API) untuk menerapkan perubahan kode & dependensi
docker compose -f infra/docker/docker-compose.backend.yml up -d --build api
```

## 2. Sinkronisasi Database (Prisma)
Gunakan perintah ini jika ada perubahan pada file `schema.prisma` (seperti tambah kolom atau tabel baru) agar database di VPS ikut berubah.

```bash
# Menyelaraskan struktur database tanpa menghapus data
docker exec -it beritakarya_api npx prisma db push

# Menjalankan migrasi formal (jika menggunakan file migration)
docker exec -it beritakarya_api npx prisma migrate deploy
```

## 3. Monitoring & Troubleshooting
Gunakan perintah ini untuk memantau kesehatan sistem atau mencari penyebab error.

```bash
# Melihat log aktivitas API secara real-time
docker logs -f beritakarya_api

# Melihat 50 baris terakhir dari log API
docker logs beritakarya_api --tail 50

# Melihat status container yang berjalan
docker ps
```

## 4. Pembersihan Sistem (Opsional)
Gunakan ini jika penyimpanan VPS mulai penuh karena penumpukan image lama.

```bash
# Menghapus image, container, dan network yang tidak terpakai
docker system prune -f
```

---
*Terakhir diperbarui: 10 Mei 2026*
