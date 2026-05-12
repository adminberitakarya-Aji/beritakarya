# 📝 KYC (Know Your Contributor) Implementation Plan — BeritaKarya

> **Status**: Draft | **Version**: 1.0  
> **Tujuan**: Memastikan integritas, akuntabilitas, dan perlindungan hukum bagi institusi BeritaKarya dengan memverifikasi identitas asli setiap kontributor (Jurnalis & Wapimred).

---

## 1. Perubahan Skema Database (Prisma Schema)

Kita perlu menambahkan field baru pada model `User` untuk menyimpan informasi identitas dan status verifikasi.

| Field | Tipe | Deskripsi |
| :--- | :--- | :--- |
| `bio` | `Text` | Profil singkat/biografi jurnalis. |
| `idCardPath` | `String` | Path file foto KTP yang diupload. |
| `familyCardPath`| `String` | Path file foto KK yang diupload. |
| `isVerified` | `Boolean` | Status apakah KYC sudah disetujui Admin (Default: `false`). |
| `kycSubmittedAt`| `DateTime`| Tanggal pengajuan verifikasi. |
| `kycNotes` | `String` | Catatan dari admin (misal: "Foto KTP buram"). |

---

## 2. Alur Pengguna (User Journey)

### A. Tahap Registrasi & Upgrade
1. User mendaftar sebagai akun biasa.
2. User mengajukan permohonan menjadi Jurnalis/Wapimred atau ditunjuk oleh Superadmin.
3. Sistem mendeteksi role baru dan memunculkan blokade: **"Akun Anda memerlukan verifikasi identitas sebelum dapat menerbitkan berita."**

### B. Tahap Pengisian Data (KYC Form)
User wajib mengisi:
- **Biodata Lengkap**: Nama sesuai KTP, Alamat, No. HP, Sosmed.
- **Upload KTP**: Foto jelas identitas resmi.
- **Upload KK**: (Opsional/Wajib sesuai kebijakan redaksi).
- **Pernyataan Integritas**: Checklist persetujuan kode etik jurnalistik.

### C. Tahap Review (Admin)
1. Superadmin menerima notifikasi pengajuan baru.
2. Superadmin mengecek kesesuaian foto dengan data profil.
3. Status berubah: **Approved** (Role aktif sepenuhnya) atau **Rejected** (Alasan penolakan dikirim ke user).

---

## 3. Implementasi Teknis (Backend)

### A. File Storage Strategy
*   **Keamanan**: Foto KTP/KK **TIDAK BOLEH** disimpan di folder `public`.
*   **Lokasi**: Simpan di folder `/uploads/kyc/` yang dilindungi oleh Middleware. Hanya user pemilik dan Superadmin yang bisa mengakses file ini via API terenkripsi.

### B. API Endpoints
- `POST /api/user/kyc/submit`: Upload file dan update bio.
- `GET /api/admin/kyc/pending`: List user yang menunggu verifikasi.
- `PATCH /api/admin/kyc/:userId/verify`: Menyetujui atau menolak KYC.

---

## 4. Desain UI Dashboard (Frontend)

### 🔔 Verifikasi Banner
Jika `isVerified == false`, tampilkan banner di dashboard:
> "⚠️ **Identitas Belum Terverifikasi.** Selesaikan profil Anda untuk mulai mengirimkan berita."

### 📑 KYC Form Component
- Input Biografi dengan Rich Text Editor sederhana.
- Dropzone Area untuk upload KTP/KK dengan preview gambar.
- Progress bar saat upload.

---

## 5. Protokol Keamanan Data (UU PDP)

Mengingat data yang disimpan sangat sensitif, wajib menerapkan:
1.  **Watermarking**: Otomatis tambahkan watermark *"ONLY FOR BERITAKARYA VERIFICATION"* pada setiap gambar yang diupload.
2.  **File Naming**: Enkripsi nama file (misal: `ktp_u92834_HASH.jpg`) agar tidak bisa ditebak.
3.  **Audit Log**: Catat siapa (admin mana) yang mengakses atau melihat data KTP tersebut.

---

## 6. Checklist Langkah Berikutnya

- [ ] Update `schema.prisma` dan jalankan `npx prisma migrate dev`.
- [ ] Buat folder `/uploads/kyc` di VPS dan atur permission.
- [ ] Implementasi endpoint upload di `apps/api`.
- [ ] Buat halaman "Verification Center" di `apps/web/dashboard`.
- [ ] Testing alur dari pendaftaran hingga persetujuan admin.
