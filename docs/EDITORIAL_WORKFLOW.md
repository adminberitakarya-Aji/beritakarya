# Alur Kerja Editorial (Editorial Workflow) 📝

Dokumen ini menjelaskan proses produksi konten dari penulisan hingga publikasi di platform BeritaKarya.

## 🔄 Status Siklus Hidup Artikel

Setiap artikel melewati tahapan status berikut:

1.  **Draft**: Status awal saat jurnalis menulis. Hanya dapat dilihat oleh penulis.
2.  **Submitted**: Jurnalis telah menyelesaikan tulisan dan mengirimkannya ke "meja redaksi".
3.  **Review**: Editor/Pimpinan Redaksi sedang memeriksa konten.
4.  **Revision**: Editor mengembalikan artikel ke jurnalis dengan catatan revisi (`reviewNotes`).
5.  **Approved**: Artikel telah disetujui dan siap diterbitkan atau dijadwalkan.
6.  **Scheduled**: Artikel diatur untuk terbit otomatis pada waktu yang ditentukan di `scheduledAt`.
7.  **Published**: Artikel aktif dan dapat diakses oleh publik.
8.  **Archived**: Artikel ditarik dari publikasi tapi tetap tersimpan untuk keperluan arsip.

## 👥 Peran dalam Workflow

### 1. Jurnalis (Journalist)
- Membuat draf artikel baru.
- Menggunakan AI Assistant untuk optimasi teks (expand, rewrite, headline).
- Mengunggah media melalui Media Manager.
- Mengirim artikel ke antrian review.
- Memperbaiki artikel berdasarkan catatan `reviewNotes` dari editor.

### 2. Pimpinan Redaksi (Pimred) / Editor
- Memantau antrian artikel masuk.
- Memberikan catatan revisi atau menyetujui artikel.
- Menentukan waktu publikasi (Instant atau Scheduled).
- Mengelola kategori dan slot iklan di portal daerah.

### 3. Superadmin
- Memiliki kendali penuh di semua portal.
- Melakukan audit aksi melalui **Audit Log Viewer**.
- Mengelola konfigurasi situs (nama, domain, trending topics).

## 🕒 Article Versioning (Snapshot)

Sistem secara otomatis menyimpan versi konten pada setiap perubahan signifikan:
- Saat artikel dikirim ke review.
- Saat artikel disetujui.
- Saat artikel dipublikasikan.

Pimpinan Redaksi dapat membandingkan versi dan melakukan **Restore** ke versi sebelumnya jika terjadi kesalahan informasi yang fatal.

## 🔔 Notifikasi Real-time

Platform menggunakan Server-Sent Events (SSE) dan tabel `Notification` untuk mengirimkan peringatan instan:
- **Ke Pimred**: Notifikasi saat ada draft baru masuk (`article_submitted`).
- **Ke Jurnalis**: Notifikasi saat artikel mereka disetujui (`article_reviewed`) atau butuh revisi.
- **System-wide**: Notifikasi berita mendadak (*Breaking News*).
