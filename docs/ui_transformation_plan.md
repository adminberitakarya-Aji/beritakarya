# 📋 Implementation Plan: UI Transformation (BeritaKarya Style)

Target: Mengganti UI `apps/web` yang lama dengan estetika premium dari contoh `berita_karya`.

## 🛠 PHASE 1: Design Foundation & Typography
Membangun fondasi visual baru agar konsisten di seluruh halaman.
- [ ] **Next.js Fonts Setup**: Mengintegrasikan `Playfair Display` (Google Font) untuk Headline dan `Outfit` untuk Body text di `layout.tsx`.
- [ ] **Color Palette Migration**: Update `globals.css` dengan variabel warna baru:
  - `--brand-red`: `#B91C1C` (Deep Red)
  - `--brand-black`: `#0F172A` (Deep Navy/Black)
  - `--surface-soft`: `#F8FAFC`
- [ ] **Tailwind Config**: Menyesuaikan `tailwind.config.ts` untuk mendukung font family dan utility baru dari contoh.

## 🧱 PHASE 2: Core Components Porting (The "Face")
Membuat ulang komponen-komponen utama dengan gaya `berita_karya`.
- [ ] **Navbar 2.0**: Navigasi sticky dengan pencarian terintegrasi dan desain kategori yang lebih bersih.
- [ ] **NewsCard System**: Membuat satu komponen `NewsCard` yang fleksibel dengan 3 varian:
  - `Hero` (Besar, dengan overlay gradien)
  - `Medium` (Standard grid)
  - `Minimal` (Untuk sidebar)
- [ ] **Breaking News Ticker**: Implementasi ticker berjalan di bawah navbar.
- [ ] **AI Summary Component**: Membuat komponen ini (disimpan kodenya tapi disembunyikan/disabled dulu).

## 📄 PHASE 3: Page Refactoring & Data Wiring
Menyusun ulang halaman utama `[site]/page.tsx` agar menggunakan layout baru.
- [ ] **Featured Section**: Layout satu berita utama besar di kiri dengan 2-3 berita terbaru di kanan.
- [ ] **Main News Grid**: Grid sistem 2 atau 3 kolom untuk berita reguler.
- [ ] **Sidebar Widgets**: 
  - Widget "Paling Populer" dengan penomoran besar.
  - Widget "Topik Hangat" (Tag cloud).
  - Widget "Ikuti Kami" (Social media).
- [ ] **Multi-Tenant Sync**: Memastikan semua data yang muncul tetap berdasarkan `siteId` dari URL (misal: gresik.beritakarya.co).

## 🧪 PHASE 4: Polish & UX
- [x] **Premium Skeletons**: Membuat loading state yang terlihat seperti kartu berita asli.
- [ ] **Mobile Optimization**: Memastikan desain "News Grid" terlihat rapi di HP.
- [ ] **Dark Mode Sync**: Memastikan transisi warna saat dark mode tetap elegan.

## 🛠 PHASE 5: Admin Panel (Redaksi) Beautification
Meningkatkan UX/UI Dashboard Admin agar terasa seperti "Newsroom" profesional.
- [ ] **Modern Sidebar**: Desain ulang sidebar dashboard dengan gaya minimalis dan elegan.
- [ ] **Professional Article List**: Tabel daftar artikel dengan status badge (Draft, Published, Review) yang lebih visual.
- [ ] **Enhanced Editor UI**: Memoles tampilan editor artikel agar lebih fokus dan bersih (Distraction-free).
- [ ] **Newsroom Stats**: Menambahkan widget statistik (grafik sederhana/kartu angka) di dashboard utama.

---
> [!IMPORTANT]
> Seluruh proses ini HANYA menyentuh frontend (`apps/web`). Logic Authentication (Zustand/API) tetap menggunakan sistem kita yang sudah solid.
