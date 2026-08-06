# Plan Perbaikan UKS Digital — SDN 05 Parambahan

**Tanggal:** 4 Agustus 2026
**Dasar:** `ANALISIS_PROJECT.md` + `ANALISIS_MENDALAM.md` (109 temuan, 14 solusi)
**Status verifikasi:** Seluruh temuan kritis sudah dicek ulang langsung ke kode setelah `git pull` — **semuanya masih ada.**

---

## ✅ STATUS PENGERJAAN — diperbarui 4 Agustus 2026

| Tahap | Status | Bukti |
|---|---|---|
| Hapus menu Laporan & Analitik | ✅ **Selesai** | 3 file dihapus, 7 referensi dibersihkan, build lolos |
| **Tahap 0** — Hentikan kehilangan data | ✅ **Selesai** | Server berhenti saat DB mati; `DataContext` dirombak; toast error di semua form |
| **Tahap 1** — Keamanan | ✅ **Selesai** | 4/4 uji `curl` balas 401; password `$2b$10$` 60 karakter |
| **Tahap 3** — Integritas data & database | ✅ **Selesai** | 11/11 uji CRUD lulus; 6/6 uji FOREIGN KEY lulus |
| **Tahap 4** — Kelengkapan fitur | ✅ **Selesai** | 10/10 uji lulus; tombol Selesai & modal Edit berfungsi |
| **Tahap 5** — Ekspor CSV & PDF | ✅ **Selesai** | CSV: escape kutip + BOM + `;`; PDF: `display:none`, batas 500 baris |
| **Tahap 5** — Produksi satu port | ✅ **Selesai** | `npm run build && npm start` → aplikasi penuh di port 3000 |
| **Tahap 6** — Perapian | ✅ **Selesai** | Bug UTC diperbaiki, focus trap, kode mati dihapus, README diperbarui |
| **Tahap 2** — Tema & tampilan | ⏸️ Belum diminta | Sebagian gugur karena menu Laporan dihapus |

### Hasil uji akhir

```
Keamanan:   /api/siswa 401 · /api/kunjungan 401 · /api/pengaturan 401
            DELETE + header X-User-Id palsu → 401 · token palsu → 401
CRUD:       11/11 lulus (UPDATE & DELETE terbukti mengubah database —
            dulu keduanya gagal diam-diam)
Integritas: 6/6 lulus (hapus siswa → riwayat kunjungan TETAP ADA)
Tahap 4:    10/10 lulus (tombol Selesai mengisi waktu_keluar, modal Edit
            menyimpan perubahan, status ngawur ditolak)
Produksi:   npm run build && npm start → satu port, rute SPA tidak 404
Backup:     npm run backup → 10 baris tersimpan, nama & hash utuh
Build:      lolos · Lint: 6 sisa, semuanya sudah ada sebelum pekerjaan ini
DB mati:    server menolak menyala
```

### Bug yang ditemukan oleh uji otomatis

Tombol "Selesai" dan modal Edit **gagal total** pada percobaan pertama (3/10 lulus).
Penyebabnya: mysql2 mengembalikan kolom `DATETIME` sebagai objek `Date`, dan saat
klien mengirimnya kembali nilainya sudah berbentuk ISO ber-`Z` — MySQL menolak
format itu dengan `ER_TRUNCATED_WRONG_VALUE`. Diperbaiki dengan helper
`keDatetimeMySQL()` di `controllers/kunjunganController.js`, plus skema zod yang
kini menerima `string` maupun `Date`. Setelah perbaikan: 10/10 lulus.

Tanpa uji end-to-end, kegagalan ini baru ketahuan saat petugas memakainya.

### Koreksi terhadap analisis awal

Tiga hal yang ternyata berbeda dari dugaan dokumen, ditemukan saat verifikasi langsung:

1. **`db/uks_digital.db` MASIH ADA dan masih terlacak Git.** Dugaan awal saya di plan ini salah. Isinya terbukti: 1 akun dengan password plaintext `admin` dan skema lama berkolom `email`; nol data siswa/kunjungan. Sudah dikeluarkan dari indeks Git (`git rm --cached`), file tetap di disk.
2. **Zod v4 tidak mengenal `required_error` / `errorMap`.** Sintaks itu membuat pesan validasi tetap berbahasa Inggris (`Invalid option: expected one of...`). Diganti ke opsi `error` milik Zod v4 — semua pesan kini bahasa Indonesia.
3. **Regresi yang saya perkenalkan sendiri lalu perbaiki:** setelah `requireAuth` aktif, `DataProvider` yang memuat data saat mount jadi selalu gagal 401 di halaman login dan tidak pernah mencoba lagi setelah login. Kini pemuatan terikat ke status login (`isAuthenticated`) — sekaligus menutup temuan K-07.

---

## Context — Mengapa perbaikan ini perlu

UKS Digital adalah aplikasi pencatatan kunjungan siswa sakit di ruang UKS. Aplikasi ini **sudah jadi secara tampilan, tapi belum jadi secara sistem.**

Ada tiga pola masalah yang punya gejala sama dan berbahaya: **aplikasi terlihat bekerja sempurna sampai seseorang memeriksa databasenya.**

| Pola masalah | Apa yang pengguna lihat | Apa yang sebenarnya terjadi |
|---|---|---|
| Error ditelan | Notifikasi hijau "Berhasil disimpan!" | Data tidak masuk database, hilang saat refresh |
| Auth hanya di tampilan | Halaman login yang rapi | Siapa pun bisa ambil semua data lewat `curl` tanpa login |
| Laporan pakai data palsu | Halaman Laporan "belum ada data" | Selamanya kosong, berapa pun data yang dicatat |

Karena ini menyimpan **data kesehatan anak di bawah umur**, Tahap 0–1 wajib selesai sebelum aplikasi dipakai mencatat data siswa sungguhan.

**Kabar baiknya:** semua ini bisa diperbaiki **tanpa membongkar struktur folder** (sesuai aturan project). Sebagian besar masalah adalah "pekerjaan yang berhenti di tengah jalan", bukan kesalahan konsep — `bcrypt`, `jsonwebtoken`, dan `zod` sudah terpasang di `package.json` tapi belum pernah dipakai sama sekali.

---

## Hasil verifikasi ulang setelah pull

Saya baca langsung 10 file inti. Ringkasan kondisi nyata:

| Temuan | Lokasi terverifikasi | Status |
|---|---|---|
| Password teks biasa | `controllers/authController.js:45` (bandingkan), `:104` (simpan) | ❌ Masih ada |
| Nol middleware auth | `app.js:17-20` — hanya `cors`, `morgan`, `express.json` | ❌ Masih ada |
| Identitas dari header palsu | `controllers/pengaturanController.js:7,35` (`x-user-id`) | ❌ Masih ada |
| Fallback `LIMIT 1` bocorkan petugas | `controllers/pengaturanController.js:20-23` | ❌ Masih ada |
| Laporan pakai mock kosong | `pages/LaporanAnalitik.jsx:31` → `mockData.js:63` (`[]`) | ❌ Masih ada |
| Filter bulan/tahun tak memfilter | `LaporanAnalitik.jsx:38-39` state ada, tak dipakai menyaring | ❌ Masih ada |
| ID dibuat di klien | `DataContext.jsx:82,128` (`Date.now()`) | ❌ Masih ada |
| `affectedRows` tak pernah dicek | `siswaController.js:47,65` · `kunjunganController.js:61` | ❌ Masih ada |
| Pesan error SQL mentah ke klien | 11 titik `err.message` di 4 controller | ❌ Masih ada |
| `PUT /api/kunjungan/:id` tidak ada | `utils/api.js:60-64` hanya `getAll`/`create`/`delete` | ❌ Masih ada |
| Laporan tak difilter periode | `laporanController.js:9` — `SELECT *` tanpa `WHERE` | ❌ Masih ada |
| Server nyala walau DB gagal | `server.js:11-20` — hanya `console.warn` | ❌ Masih ada |
| `.gitignore` buang semua dokumentasi | `.gitignore:17-18` (`*.md`, `!README.md`) | ❌ Masih ada |

### Tiga koreksi terhadap dokumen analisis

Dokumen ditulis sebelum pull terakhir. Tiga hal sudah berubah — plan ini memakai kondisi nyata:

1. **`catch` di `DataContext` tidak lagi kosong** — sekarang sudah ada `console.error` (baris 91, 107, 119, 137, 151). Tapi **dampaknya tetap sama**: error hanya masuk console browser, tidak pernah sampai ke pengguna, dan optimistic update tetap tidak di-rollback. Perbaikannya tidak berubah.
2. **File `db/uks_digital.db` sudah tidak ada** di working tree. Yang tertinggal hanya `db/uks_digital.db-shm` dan `db/uks_digital.db-wal` (terlihat sebagai untracked di `git status`). Langkah "keluarkan `.db` dari Git" jadi lebih ringan.
3. **`express-rate-limit` belum terpasang** di `package.json`. Rate limit login butuh install dulu — bukan sekadar dipakai.

---

## Prinsip pengerjaan

1. **Cegah kerugian permanen dulu.** Data yang hilang atau bocor tidak bisa ditarik kembali.
2. **Kerjakan yang menghalangi pekerjaan lain lebih awal.** Memasang auth setelah semua fitur jadi berarti menyentuh ulang setiap file.
3. **Sisipkan perbaikan yang hasilnya cepat terlihat** untuk menjaga momentum.
4. **Jangan ubah struktur folder** — semua file baru masuk folder yang sudah ada.

---

## TAHAP 0 — Hentikan kehilangan data (1–2 jam)

**Kerjakan ini sebelum aplikasi menyentuh data siswa sungguhan.**

Alasannya sederhana: selama error masih ditelan, **setiap menit pemakaian berisiko kehilangan data tanpa jejak.** Ini satu-satunya kelompok yang harus didahulukan bahkan sebelum keamanan.

### 0.1 Backup database dulu (10 menit)
Kalau sudah ada data asli di MySQL, ekspor dulu lewat phpMyAdmin atau `mysqldump`. Semua langkah berikutnya menyentuh data.

### 0.2 Hentikan server kalau database gagal (5 menit)
**File:** `server.js:11-20`

Sekarang server tetap menyala walau MySQL mati — petugas bisa mencatat sepanjang pagi dan semuanya gagal. Ubah agar `process.exit(1)` saat koneksi gagal, dan pindahkan `app.listen()` ke dalam blok sukses.

### 0.3 Rombak `DataContext.jsx` — jangan telan error (45 menit)
**File:** `frontend/src/context/DataContext.jsx` (rewrite, ~176 → ~90 baris)

Empat perubahan kunci:

| Perubahan | Alasan |
|---|---|
| Hapus semua `try/catch` di fungsi mutasi | Error harus **mengalir** ke halaman pemanggil supaya bisa ditampilkan |
| `await refresh()` setelah setiap mutasi | Data selalu memakai id asli dari MySQL — sekaligus menyelesaikan masalah `Date.now()` |
| Hapus semua `localStorage` | Ia ditulis di 4 tempat tapi **tidak pernah dibaca** saat mount, jadi hanya menyimpan data kesehatan ke disk tanpa manfaat |
| Tambah `loading` & `error` | Halaman bisa membedakan "belum ada data" dan "server mati" |

Sekaligus tambahkan `updateKunjungan` (belum ada sama sekali) sebagai persiapan Tahap 4.

Kode lengkapnya sudah tersedia di `ANALISIS_MENDALAM.md` baris 3029–3110.

### 0.4 Tampilkan error ke pengguna (30 menit)
**File:** `pages/PendaftaranKunjungan.jsx` · `DataSiswa.jsx` · `RiwayatKunjungan.jsx`

Bungkus setiap pemanggilan mutasi dengan `try/catch`, dan tampilkan `toast.error()` saat gagal. Toast sukses **hanya** dipanggil kalau server benar-benar mengonfirmasi. Komponen `Toast.jsx` sudah ada dan siap dipakai.

### 0.5 Cegah klik ganda (10 menit)
**File:** `pages/PendaftaranKunjungan.jsx`

Tambah state `saving`, `if (saving) return` di awal handler, dan `disabled={saving}` di tombol simpan. Tanpa ini, klik dua kali menghasilkan dua rekam medis duplikat.

**Cara verifikasi Tahap 0:**
```
Matikan MySQL, lalu coba simpan kunjungan dari aplikasi.
✅ BENAR : muncul notifikasi MERAH "Gagal menyimpan..."
❌ SALAH : muncul notifikasi hijau "berhasil disimpan"
```

---

## TAHAP 1 — Keamanan (4–6 jam)

Setelah tahap ini, aplikasi **layak dipakai dengan data siswa asli.**

### 1.1 Buat `middleware.js` di root (45 menit)
**File baru:** `middleware.js` (sejajar `app.js`, tidak menambah folder)

Isinya tiga fungsi:
- `requireAuth` — verifikasi JWT dari header `Authorization: Bearer`, isi `req.user`
- `requireRole` — pembatasan berdasarkan peran (dipakai nanti)
- `errorHandler` — penangkap error terpusat, kirim pesan generik ke klien

### 1.2 Ganti password teks biasa dengan bcrypt (30 menit)
**File:** `controllers/authController.js:45,104` · `db/initDB.js:64`

- Register: `await bcrypt.hash(password, 10)` sebelum `INSERT`
- Login: `await bcrypt.compare(password, user.password)`
- Seed admin di `initDB.js` juga harus di-hash

Kolom `password VARCHAR(255)` sudah cukup panjang untuk hash bcrypt — **tidak perlu ubah skema.**

### 1.3 Terbitkan & kirim JWT (60 menit)
**File:** `controllers/authController.js` · `frontend/src/context/AuthContext.jsx` · `frontend/src/utils/api.js`

- Login sukses → `jwt.sign({ id, role }, JWT_SECRET, { expiresIn: '8h' })`, kirim token di response
- `AuthContext` simpan token di `sessionStorage`
- `utils/api.js:18-22` — ganti header `X-User-Id` menjadi `Authorization: Bearer <token>`

`JWT_SECRET` sudah ada di `.env`, tinggal dipakai.

### 1.4 Pasang `requireAuth` di semua route (30 menit)
**File:** `routes/siswaRoutes.js` · `kunjunganRoutes.js` · `laporanRoutes.js` · `pengaturanRoutes.js`

Semua route **kecuali** `/api/auth/login` dan `/api/health`. Ini menutup lubang terbesar: 13 endpoint yang sekarang terbuka sepenuhnya.

### 1.5 Ambil identitas dari token, bukan header (30 menit)
**File:** `controllers/pengaturanController.js:7,35`

Ganti `req.headers['x-user-id']` → `req.user.id`, dan **hapus fallback `LIMIT 1`** di baris 20-23. Fallback itu membocorkan nama & NIP petugas utama ke siapa pun yang memanggil `/api/pengaturan` tanpa header apa pun.

### 1.6 Migrasi password yang sudah tersimpan (10 menit)
**File baru:** `db/rehashPasswords.js`

Script sekali jalan: baca semua user, deteksi password yang belum di-hash (tidak diawali `$2b$`), hash, simpan. Tanpa ini semua akun lama tidak bisa login setelah 1.2.

### 1.7 Batasi CORS + rate limit login (20 menit)
**File:** `app.js:18` · `routes/authRoutes.js` · `package.json`

- `cors({ origin: process.env.FRONTEND_URL })` — sekarang `cors()` mengizinkan semua origin
- Install `express-rate-limit` (**belum terpasang**), batasi login ke 5 percobaan / 15 menit

Password seed default `'admin'` membuat brute force sangat murah tanpa ini.

### 1.8 Bersihkan sesi saat logout (10 menit)
**File:** `frontend/src/context/AuthContext.jsx`

`logout()` harus menghapus token **dan** sisa data siswa/kunjungan. Di komputer bersama, data kesehatan sekarang tetap terbaca lewat DevTools setelah logout.

### 1.9 Pasang `errorHandler` (15 menit)
**File:** `app.js` (baris paling akhir, setelah 404 handler)

Sekaligus ganti 11 titik `res.status(500).json({ message: err.message })` di 4 controller menjadi pesan generik. Sekarang nama tabel & kolom MySQL bocor ke klien.

**Cara verifikasi Tahap 1:**
```bash
curl http://localhost:3000/api/siswa
# ✅ BENAR : {"success":false,"message":"Anda harus login terlebih dahulu."}
# ❌ SALAH : daftar data siswa

curl http://localhost:3000/api/pengaturan
# ✅ BENAR : 401
# ❌ SALAH : nama & NIP petugas utama

curl -X DELETE http://localhost:3000/api/siswa/1 -H "X-User-Id: 1"
# ✅ BENAR : 401 (header palsu tidak lagi berlaku)
```
Lalu cek phpMyAdmin: kolom `password` harus diawali `$2b$10$`, **bukan** `admin`.

---

## TAHAP 2 — Hidupkan fitur yang rusak (3–4 jam)

Tahap yang hasilnya **langsung terlihat.**

### 2.1 Perbaiki halaman Laporan (5 menit) ⭐
**File:** `frontend/src/pages/LaporanAnalitik.jsx:31`

```js
// SEBELUM — mengambil array kosong permanen
import { kunjunganList, dataSekolah, petugasUks } from '../data/mockData'

// SESUDAH
import { useData } from '../context/DataContext'
// lalu di dalam komponen:
const { kunjunganList } = useData()
```

**Ini perbaikan dengan hasil terbesar per menit di seluruh plan.** Lima menit kerja menghidupkan 4 StatCard, 2 grafik, ringkasan naratif, rincian status, dan PDF resmi yang selama ini tercetak kosong.

### 2.2 Buat `utils/statistik.js` (60 menit)
**File baru:** `frontend/src/utils/statistik.js` (folder sudah ada)

Satukan perhitungan yang sekarang tersebar dan **hasilnya berbeda**: Dashboard memakai `split` untuk memecah keluhan, Laporan tidak. Angka "Keluhan Terbanyak" di dua halaman bisa berbeda untuk data yang sama.

### 2.3 Sambungkan filter bulan/tahun (30 menit)
**File:** `LaporanAnalitik.jsx:38-39,93`

State `selectedBulan`/`selectedTahun` sudah ada tapi tidak menyaring apa pun. Akibatnya dokumen resmi bertuliskan "Periode: Maret 2026" berisi data seluruh tahun.

### 2.4 Perbaiki tema yang berhenti di tengah (30 menit)
**File:** `frontend/src/index.css` · `components/layout/PageHeader.jsx` · `components/common/StatCard.jsx`

- Tambah blok `@theme` — beberapa warna (`bg-coral-500`) dipakai tapi tidak terdefinisi
- `PageHeader` → tema terang, agar judul 5 halaman terlihat (sekarang putih di atas putih)
- Tambah varian `success` di `StatCard` yang dipakai tapi belum ada

Ini juga membuat **toast error jadi terbaca** — pesan yang paling penting dilihat pengguna.

### 2.5 Perbaikan kecil (15 menit)
- Typo nama sekolah "Prambahan" → "Parambahan" di `Login.jsx`
- Tambah tautan ke halaman Register (sekarang tidak ada jalan ke sana)
- Tambah sapaan di Dashboard — `getGreeting()` sudah ditulis lengkap di `formatters.js` tapi belum dipanggil

**Cara verifikasi Tahap 2:**
- Catat 3 kunjungan → buka Laporan → **angka & grafik muncul** (sebelumnya selalu 0)
- Ubah filter bulan → **angkanya ikut berubah**
- Judul halaman Pendaftaran/Riwayat/Siswa/Laporan/Pengaturan **terlihat**
- Bandingkan "Keluhan Terbanyak" Dashboard vs Laporan → **angkanya sama**

---

## TAHAP 3 — Integritas data (3–4 jam)

### 3.1 Cek `affectedRows` di semua controller (30 menit)
**File:** `siswaController.js:47,65` · `kunjunganController.js:61` · `pengaturanController.js:68`

Sekarang `DELETE FROM siswa WHERE id = 999` mengembalikan `success: true` walau tidak ada baris terhapus. Kembalikan **404** saat `affectedRows === 0`.

### 3.2 Buat `controllers/validators.js` (60 menit)
**File baru:** `controllers/validators.js` (folder sudah ada)

Pakai `zod` yang sudah terpasang. Sekarang `createSiswa` menerima body apa adanya — NIS kosong, kelas di luar 1–6, jenis kelamin sembarang semua diteruskan ke MySQL dan baru gagal di level constraint dengan pesan SQL mentah.

Sekaligus satukan `validateUsername` yang **diduplikasi di 3 tempat dengan aturan berbeda** (`authController.js:9`, `AuthContext.jsx`, `Pengaturan.jsx`).

### 3.3 Tutup jalur "terkunci dari akun" (20 menit)
**File:** `controllers/pengaturanController.js:42`

`updatePetugas` tidak memvalidasi format username sama sekali. Simpan username `ab` → tidak memenuhi aturan login → **terkunci dari akun selamanya.** Pakai validator dari 3.2 dan cek duplikat.

### 3.4 Bereskan tiga sumber skema (30 menit)
**File:** `db/sqliteDB.js` · `.gitignore` · `package.json`

Ada **3 definisi skema yang saling berbeda**. `db/sqliteDB.js` adalah kode mati yang tidak di-import siapa pun, tapi masih memakai kolom `email` sementara MySQL sudah pindah ke `username` — dan ia memanggil `initSQLiteDB()` saat modul dimuat, jadi akan membuat file DB begitu di-import seseorang.

Langkah aman: netralkan dengan `throw` penanda dulu, hapus sisa file `db/uks_digital.db-shm` & `-wal`, tambah `*.db*` ke `.gitignore`, lalu cabut `better-sqlite3`.

### 3.5 Tambah FOREIGN KEY yang aman (30 menit)
**File:** `db/initDB.js` · `db/uks_digital.sql`

`kunjungan.siswa_id` sekarang bisa menunjuk siswa yang tidak ada — nol jaminan integritas. Pakai `ON DELETE SET NULL` supaya riwayat kunjungan **tetap ada** saat siswa dihapus (sesuai keputusan denormalisasi yang sudah benar).

### 3.6 Perbaiki `initDB.js` (15 menit)
Variabel `host` sudah dihitung lalu diabaikan (baris 23 memakai `'127.0.0.1'` mati), dan blok migrasi menelan error tanpa `console.warn`.

**Cara verifikasi Tahap 3:**
```bash
curl -X POST http://localhost:3000/api/siswa -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" -d '{"nis":"","nama":"A"}'
# ✅ BENAR : "NIS wajib diisi. Nama terlalu pendek (minimal 3 karakter)."
# ❌ SALAH : error SQL mentah
```
Hapus siswa yang punya riwayat → riwayatnya **harus tetap ada** di Riwayat Kunjungan.
Simpan username `ab` di Pengaturan → **harus ditolak** dengan pesan jelas.

---

## TAHAP 4 — Lengkapi fitur (4–5 jam)

Setelah tahap ini aplikasi **sesuai spesifikasi** di `Preview, Prompt, and rules.md`.

### 4.1 Tambah `PUT /api/kunjungan/:id` (45 menit)
**File:** `controllers/kunjunganController.js` · `routes/kunjunganRoutes.js` · `frontend/src/utils/api.js:60-64`

Kolom `waktu_keluar` ada di skema tapi **tidak pernah bisa diisi** karena tidak ada endpoint update. Akibatnya siswa berstatus "Istirahat di UKS" tidak pernah bisa ditandai selesai, dan salah input hanya bisa diperbaiki dengan hapus + input ulang.

### 4.2 Tombol "Selesai" di Riwayat (30 menit)
Nilai praktis tertinggi: satu klik mengisi `waktu_keluar` dan mengubah status ke "Kembali ke Kelas".

### 4.3 Modal Edit kunjungan (60 menit)
Spesifikasi baris 29 secara eksplisit meminta kolom **"Aksi (Detail/Edit)"**. Sekarang hanya ada Detail.

### 4.4 Lengkapi `laporanController` (45 menit)
**File:** `controllers/laporanController.js:9`

Tambah `WHERE` periode (sekarang `SELECT *` tanpa filter — angka salah dengan label periode meyakinkan) dan ganti ke agregasi `COUNT(*)` di SQL, bukan tarik seluruh tabel ke memori hanya untuk menghitung dua angka.

### 4.5 Filter tanggal di Riwayat + label periode dinamis (60 menit)
`periodeLabel="Tahun 2026"` sekarang di-hardcode di laporan cetak.

### 4.6 Kop surat dari database (30 menit)
**File:** `components/common/PrintReportTemplate.jsx:103-107`

Nama sekolah, NPSN, dan NIP kepala sekolah di-hardcode, mengabaikan tabel `pengaturan_sekolah` yang sudah ada. Ubah nama kepala sekolah di Pengaturan → laporan cetak harus ikut berubah.

---

## TAHAP 5 — Ekspor & produksi (3–4 jam)

### 5.1 Perbaiki ekspor CSV (45 menit)
**File:** `pages/RiwayatKunjungan.jsx:83-93`

Tiga bug sekaligus: kutip di dalam data tidak di-escape, tanpa BOM UTF-8 (`°C` jadi `Â°C` di Excel), dan `encodeURI` tidak meng-encode `#` sehingga file terpotong. Ganti ke `Blob` + pemisah `;` untuk Excel Indonesia.

### 5.2 Amankan cetak PDF (45 menit)
**File:** `components/common/PrintReportTemplate.jsx:230,169`

`visibility:hidden` pada `body *` berisiko menghasilkan halaman kosong — ganti ke `display:none` + `page-break`. Tambah batas 500 baris; tanpa batas, browser membeku pada data ribuan.

### 5.3 Jalur produksi satu port (45 menit)
**File:** `app.js:24` · `package.json` · `frontend/vite.config.js:30`

Sekarang aplikasi hanya jalan di mode dev dua-server: `app.js` me-redirect ke `localhost:5173` yang di-hardcode, Express tidak pernah menyajikan `frontend/dist`, dan aturan cache PWA mencocokkan `http://localhost:3000/api/*` padahal `api.js` memakai path relatif — pola itu **tidak akan pernah cocok**.

Sajikan `frontend/dist` dari Express, tambah script `build` & `start`, pindahkan URL ke `.env`.

### 5.4 Backup otomatis (30 menit)
**File baru:** `db/backup.js` — sangat disarankan untuk data kesehatan.

**Cara verifikasi Tahap 5:**
```bash
npm run build && npm start
# Buka http://localhost:3000 → aplikasi jalan LENGKAP tanpa port 5173
```
Ekspor CSV → buka di Excel → kolom rapi, `°C` tampil benar.
Cetak PDF → tidak ada halaman kosong, header tabel berulang di setiap halaman.

---

## TAHAP 6 — Perapian (3–5 jam, bisa dicicil)

Tidak mendesak, kerjakan saat ada waktu:

- Pagination `DataTable` + `LIMIT` di sisi server (sekarang `SELECT *` tanpa batas)
- Timeout & pemeriksaan content-type di `api.js` (`res.json()` dipanggil tanpa syarat → `SyntaxError` untuk respons HTML)
- Perbaiki susunan Provider — `BrowserRouter` harus di luar agar context bisa `useNavigate`
- Perbaiki `useEffect` di `Pengaturan.jsx:66` — dependency `[]` padahal memakai `user` & `updateUser` (stale closure), dan `updateUser` dipanggil saat memuat sehingga bisa menimpa sesi
- Tren mingguan Dashboard salah karena `toISOString()` (UTC vs WIB)
- Aksesibilitas: Escape untuk menutup modal, focus trap, ARIA
- Cabut `multer` & `uuid`; hapus `App.css` dan `hooks/useApi.js` (kode mati)
- Perbaiki `.gitignore` — pola `*.md` membuat semua dokumentasi termasuk file analisis ini tidak terlacak Git
- Perbarui `README.md` — masih menyebut validasi email `@sdn05parambahan.id` padahal auth sudah berbasis username, dan mengklaim "Connection Pool with Failover" yang tidak ada
- Halaman 404 yang ramah

---

## Ringkasan waktu & hasil

| Tahap | Fokus | Waktu | Kondisi setelahnya |
|---|---|---|---|
| **0** | Hentikan kehilangan data | 1–2 j | Data tidak lagi hilang diam-diam |
| **1** | Keamanan | 4–6 j | ✅ **Layak dipakai dengan data asli** |
| **2** | Fitur rusak | 3–4 j | ✅ **Semua halaman berfungsi & terlihat** |
| **3** | Integritas data | 3–4 j | Data tidak bisa rusak/ngawur |
| **4** | Kelengkapan fitur | 4–5 j | ✅ **Sesuai spesifikasi** |
| **5** | Ekspor & produksi | 3–4 j | ✅ **Siap dipasang di sekolah** |
| **6** | Perapian | 3–5 j | Rapi & mudah dirawat |
| | **TOTAL** | **21–30 jam** | |

### Kalau waktu terbatas

**Punya 1 jam?** Tahap 0 saja. Mencegah kehilangan data — hal yang tidak bisa diperbaiki setelah terjadi.

**Punya 1 hari (8 jam)?** Tahap 0 + Tahap 1 + langkah 2.1. Aplikasi aman dipakai dan halaman Laporan hidup.

**Punya 1 minggu?** Tahap 0 sampai 4. Sesuai spesifikasi dan siap dinilai.

### Lima perbaikan terpenting (~3 jam total)

| Prioritas | Perbaikan | Waktu | Alasan |
|---|---|---|---|
| 1 | Error mengalir ke pengguna di `DataContext` | 30 mnt | Mencegah kehilangan data permanen |
| 2 | `requireAuth` di semua route | 90 mnt | Mencegah kebocoran data kesehatan anak |
| 3 | `bcrypt` untuk password | 30 mnt | Melindungi akun bahkan jika DB bocor |
| 4 | `useData()` di `LaporanAnalitik` | **5 mnt** | Menghidupkan seluruh halaman Laporan |
| 5 | Blok `@theme` + `PageHeader` terang | 25 mnt | Judul 5 halaman terlihat, toast error terbaca |

---

## File yang akan disentuh

**File baru (5, semuanya di folder yang sudah ada):**
- `middleware.js` — auth, role, error handler
- `controllers/validators.js` — skema zod
- `db/rehashPasswords.js` — migrasi password sekali jalan
- `frontend/src/utils/statistik.js` — agregasi terpusat
- `db/backup.js` — Tahap 5

**File yang paling banyak berubah:**
- `frontend/src/context/DataContext.jsx` — rewrite (Tahap 0)
- `controllers/authController.js` — bcrypt + JWT
- `controllers/pengaturanController.js` — identitas dari token, validasi
- `app.js` — CORS, error handler, serve dist
- `frontend/src/pages/LaporanAnalitik.jsx` — sumber data + filter
- Semua `routes/*.js` — pasang `requireAuth`

**Yang sengaja tidak diubah:** struktur folder, keputusan denormalisasi tabel `kunjungan`, envelope response `{ success, message, data }`, dan parameterized query (sudah benar di seluruh kode — nol titik SQL injection).

---

## Yang sudah baik dan harus dipertahankan

Supaya perbaikan tidak merusak yang sudah benar:

1. **Semua query sudah parameterized** — nol titik SQL injection di seluruh kode
2. **Envelope response seragam** `{ success, message, data }` di semua endpoint
3. **Denormalisasi `kunjungan` tepat secara domain** — riwayat kesehatan mempertahankan data siswa saat kejadian
4. **Password tidak pernah dikirim balik ke klien** (`authController.js:52`)
5. **Inisialisasi skema idempoten** — `CREATE TABLE IF NOT EXISTS` + guard `COUNT(*) === 0`
6. **Empty state ditangani serius** di semua halaman, lengkap dengan ikon dan petunjuk aksi
7. **Komponen reusable matang** — `CustomSelect`, `DatePicker`, `DataTable`, `Modal`, `Toast`
8. **PWA & cetak PDF A4 sudah lengkap** dengan kop surat dan lembar pengesahan
9. **Migrasi skema in-place** di `initDB.js:44-57` — mendeteksi kolom `email` lama dan memigrasikannya

---

> ⚠️ **Catatan Git:** `.gitignore:17-18` memuat pola `*.md` dengan pengecualian hanya `README.md`, sehingga file ini **tidak akan terlacak Git**. Bila ingin menyimpannya di repo, jalankan `git add -f PLAN_PERBAIKAN.md` atau perbaiki aturan `.gitignore` (lihat Tahap 6).
