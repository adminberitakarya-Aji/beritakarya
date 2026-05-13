# Rencana Implementasi Perbaikan BeritaKarya

Dokumen ini berisi langkah-langkah rinci untuk menyelesaikan 6 kendala yang sebelumnya telah dilaporkan. Jika rencana ini disetujui, pengerjaan akan dilakukan secara berurutan sesuai dengan urutan di bawah ini.

## 1. Perbaikan Tema (Dark/Light Mode) di Halaman Login
**Masalah:** Halaman `/login` selalu berstatus mode terang saat di-refresh karena skrip pengecekan tema berada di `Navbar.tsx` yang tidak di-render di halaman login.
**Langkah Pengerjaan:**
- **File Target:** `apps/web/app/layout.tsx` (atau membuat komponen `ThemeProvider` baru).
- **Tindakan:** 
  1. Memindahkan logika sinkronisasi tema (`localStorage.getItem('theme')` dan manipulasi class `dark` di `documentElement`) dari `Navbar.tsx` ke dalam root `layout.tsx` atau sebuah komponen `ThemeProvider` (client component) yang membalut seluruh aplikasi.
  2. Ini akan memastikan bahwa pengaturan tema diaplikasikan pada saat proses *bootstrapping* aplikasi untuk **seluruh** halaman, termasuk halaman `/login`.

## 2. Perbaikan Data "Engagement Rate" yang Dummy
**Masalah:** Angka Engagement Rate di dashboard tertulis *hardcoded* 68.4%.
**Langkah Pengerjaan:**
- **File Target:** `apps/web/app/[site]/dashboard/page.tsx`
- **Tindakan:**
  1. Menghapus teks "68.4%" yang *hardcoded*.
  2. Jika metrik *engagement* tersedia pada API `trafficData` atau analitik lainnya, saya akan mengkalkulasinya secara dinamis.
  3. Jika data *engagement rate* yang spesifik belum direkam oleh backend saat ini, sementara akan diubah menjadi "N/A" atau dikalkulasi berdasarkan metrik logis sederhana (misalnya persentase artikel yang aktif dibaca) agar tidak memberikan data palsu/menyesatkan kepada pengguna.

## 3. Perbaikan Error 400 (Bad Request) pada Filter Status Artikel
**Masalah:** API tidak mengenali status seperti `submitted`, `revision`, `approved`, dsb saat frontend memfilternya.
**Langkah Pengerjaan:**
- **File Target:** `apps/api/src/modules/article/article.validator.ts`
- **Tindakan:** 
  1. Memodifikasi `articleQuerySchema` pada objek `status`.
  2. Menambahkan status tambahan yang didefinisikan dalam `schema.prisma` ke dalam array `z.enum()`, yaitu: `['draft', 'submitted', 'review', 'revision', 'approved', 'scheduled', 'published', 'archived']`.

## 4. Penghapusan Pembuatan "Draft Sampah" Otomatis
**Masalah:** Mengklik "Tulis Artikel" otomatis mengirim API POST untuk membuat draft di database sebelum pengguna menulis apa pun.
**Langkah Pengerjaan:**
- **File Target:** `apps/web/app/[site]/dashboard/articles/page.tsx`
- **Tindakan:**
  1. Memodifikasi fungsi `handleNew()`. Alih-alih melakukan `api.post('/articles', ...)` dan me-redirect ke ID artikel baru, fungsi ini hanya akan melakukan `router.push('/[site]/dashboard/articles/new')`.
  2. Hal ini akan memicu *EditorStore* untuk mengatur mode artikel baru (`articleId: 'new'`). 
  3. Menyimpan artikel (*auto-save* atau *manual save*) baru akan memanggil `POST /articles` HANYA setelah penulis memasukkan judul atau blok konten pertama.

## 5. Perbaikan Error Gambar Pecah (Next.js 400 Bad Request)
**Masalah:** Gambar berhasil diunggah tetapi diblokir oleh Next.js Image Optimization dengan error 400 saat ditampilkan di Editor.
**Langkah Pengerjaan:**
- **File Target:** `apps/web/next.config.mjs`
- **Tindakan:**
  1. Menyesuaikan `remotePatterns` untuk fitur gambar Next.js.
  2. Memastikan konfigurasi memperbolehkan domain dinamis tanpa terikat protokol absolut, port atau nama host tertentu yang mungkin berbeda saat *development* dan *production*. (Misalnya, menambahkan pola wildcard atau memastikan URL lokal `127.0.0.1` dan `localhost` di semua *port* terdaftar).
  3. Jika backend me-return URL yang bermasalah pada *slash* (misalnya terdapat dobel slash `//api/v1/...`), saya juga akan memastikan format *baseUrl* di `media.controller.ts` digabungkan secara aman.

## 6. Penambahan Preview Embed Twitter & Instagram
**Masalah:** Embed Twitter dan Instagram hanya memunculkan URL berupa teks, tidak seperti YouTube yang memunculkan iframe.
**Langkah Pengerjaan:**
- **File Target:** `apps/web/components/editor/blocks/EmbedBlock.tsx`
- **Tindakan:**
  1. Memodifikasi komponen `EmbedBlock` untuk memuat tampilan khusus (`embedType === 'twitter'` dan `embedType === 'instagram'`).
  2. Untuk Twitter: Menggunakan package `react-tweet` (jika tersedia/diizinkan) atau menggunakan komponen struktur HTML standar dari Twitter blockquote (`<blockquote class="twitter-tweet">`).
  3. Untuk Instagram: Menyematkan blok iframe atau skrip standar embed Instagram.
  4. Jika diperlukan instalasi package eksternal, saya akan mengkonfirmasi terlebih dahulu, atau menggunakan implementasi native iframe untuk menghindari penambahan dependensi jika memungkinkan.
