# Alur Kerja Editorial (Editorial Workflow) 📝

Dokumen ini menjelaskan proses produksi konten dari penulisan hingga publikasi di platform BeritaKarya.

## 🔄 Status Siklus Hidup Artikel

Setiap artikel melewati tahapan status berikut:

1.  **Draft**: Status awal saat jurnalis menulis. Hanya dapat dilihat oleh penulis.
2.  **Submitted (Menunggu Review)**: Jurnalis telah menyelesaikan tulisan dan mengirimkannya ke "meja redaksi". Artikel muncul di **Antrian Review** milik Pimpinan Redaksi.
3.  **Review (Sedang Direview)**: Editor/Pimpinan Redaksi sedang memeriksa konten. Pada tahap ini, konten dikunci agar tidak ada perubahan simultan.
4.  **Revision Needed**: Editor mengembalikan artikel ke jurnalis dengan catatan revisi.
5.  **Approved (Disetujui)**: Artikel telah lolos sensor dan siap diterbitkan.
6.  **Scheduled (Terjadwal)**: Artikel diatur untuk terbit otomatis pada waktu tertentu.
7.  **Published (Terbit)**: Artikel dapat diakses oleh publik.
8.  **Archived**: Artikel ditarik dari publikasi tapi tetap tersimpan di database.

## 👥 Peran dalam Workflow

### 1. Jurnalis (Journalist)
- Membuat draf artikel baru.
- Menggunakan AI Assistant untuk optimasi teks.
- Mengunggah media melalui Media Manager.
- Mengirim artikel ke antrian review.
- Memperbaiki artikel berdasarkan catatan editor.

### 2. Pimpinan Redaksi (Pimred) / Editor
- Memantau **Antrian Review**.
- Memberikan catatan revisi atau menyetujui artikel.
- Menentukan waktu publikasi (Instant atau Scheduled).
- Mengelola kategori dan topik tren di portal daerah.

### 3. Superadmin
- Memiliki kendali penuh di semua portal.
- Melakukan audit aksi melalui **Audit Log Viewer**.
- Mengelola akses pengguna di seluruh jaringan.

## 🕒 Article Versioning (Snapshot)

Sistem secara otomatis menyimpan versi konten pada setiap perubahan signifikan:
- Saat artikel dikirim ke review.
- Saat artikel disetujui.
- Setiap kali tombol "Save Snapshot" ditekan secara manual.

Pimpinan Redaksi dapat membandingkan versi dan melakukan **Restore** ke versi sebelumnya jika terjadi kesalahan informasi atau teknis.

## 🔔 Notifikasi Real-time

Platform menggunakan Server-Sent Events (SSE) untuk mengirimkan peringatan instan:
- **Ke Pimred**: Notifikasi saat ada draft masuk untuk direview.
- **Ke Jurnalis**: Notifikasi saat artikel mereka disetujui atau butuh revisi.
- **System-wide**: Notifikasi berita mendadak (*Breaking News*).
