# UKS Digital — SDN 05 Parambahan

Sistem Manajemen Buku Kunjungan UKS Berbasis Web & Desktop (PWA) untuk **SD Negeri 05 Parambahan, Kabupaten Solok, Sumatera Barat**.

![UKS Digital Banner](frontend/public/icon-512.png)

---

## 🌟 Fitur Utama

- 💻 **Dapat Diinstal ke Desktop (PWA)** — aplikasi web yang bisa dipasang langsung ke PC/laptop lewat Chrome atau Edge.
- 🔐 **Autentikasi berbasis username** dengan password ter-hash (bcrypt) dan token sesi (JWT) yang ditegakkan di sisi server.
- 📅 **Input waktu masuk dengan kalender interaktif** — komponen `DatePicker` dengan navigasi bulan, pemilih jam & menit, serta tombol pintas *"Sekarang"*.
- 🔍 **Pencarian autocomplete data siswa** berbasis NIS atau nama, dengan tingkat kelas 1–6.
- 📋 **Pendaftaran & rekam kunjungan sakit** — keluhan utama, catatan tambahan, tindakan, status penanganan, dan penandaan **Kasus Darurat**.
- ✅ **Tutup kunjungan sekali klik** — tombol "Selesai" mengisi waktu keluar dan menandai siswa kembali ke kelas.
- ✏️ **Ubah rekam kunjungan** bila ada salah input, tanpa perlu hapus dan catat ulang.
- 🗂️ **Riwayat dengan filter lengkap** — pencarian, kelas, status, rentang tanggal, dan penyaring kasus darurat.
- 📤 **Ekspor CSV siap Excel Indonesia** — pemisah titik koma dan BOM UTF-8 supaya karakter seperti `°C` tampil benar.
- 🖨️ **Cetak PDF resmi (A4)** — kop surat sekolah diambil dari database, ringkasan rekapitulasi, dan lembar pengesahan Kepala Sekolah.

---

## 🛠️ Teknologi

### Frontend
- **React 19** + **Vite 8**
- **Tailwind CSS v4**
- **Lucide React** (ikon)
- **Recharts** (grafik)
- **Vite PWA Plugin** (`vite-plugin-pwa`)
- **jsPDF** + **html2canvas-pro** (unduh PDF)

### Backend & Database
- **Node.js** + **Express 5**
- **MySQL2** (connection pool)
- **bcrypt** (hash password) · **jsonwebtoken** (token sesi) · **zod** (validasi input)
- **express-rate-limit** (pembatas percobaan login)

---

## 🚀 Cara Menjalankan

### 1. Prasyarat
- **Node.js** v18 ke atas & **npm**
- **MySQL / MariaDB** (Laragon, XAMPP, atau instalasi mandiri) — **wajib aktif**, server menolak menyala tanpa database.

### 2. Konfigurasi

```bash
cp .env.example .env
```

Sesuaikan isinya. Yang wajib diperiksa sebelum dipakai di sekolah:

| Variabel | Keterangan |
|---|---|
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | Koneksi MySQL |
| `JWT_SECRET` | **Ganti dengan teks acak panjang.** Token sesi ditandatangani dengan kunci ini. |
| `SEED_ADMIN_PASSWORD` | Password akun awal. Kosongkan untuk memakai `admin` — dan segera ganti setelah login. |
| `FRONTEND_URL` | Alamat frontend, dipakai untuk pembatasan CORS |
| `PORT` | Port server (bawaan 3000) |

### 3. Mode pengembangan (dua server)

```bash
npm install
npm run dev
```

Frontend di `http://localhost:5173`, API di `http://localhost:3000`.

### 4. Mode produksi (satu port)

```bash
npm run build
npm start
```

Seluruh aplikasi berjalan di `http://localhost:3000` — Express menyajikan hasil build frontend, jadi tidak perlu server kedua.

### 5. Menyiapkan database

Skema dibuat **otomatis** saat server pertama kali dijalankan (`db/initDB.js`), termasuk tabel, indeks, FOREIGN KEY, dan akun awal.

Untuk import manual lewat phpMyAdmin, tersedia `db/uks_digital.sql`.
> ⚠️ Berkas itu memuat `DROP TABLE` — menjalankannya pada database berisi data akan menghapus semuanya. Buat cadangan dulu.

---

## 🔧 Perintah Tambahan

| Perintah | Kegunaan |
|---|---|
| `npm run backup` | Cadangkan seluruh isi database ke `backups/` |
| `npm run rehash` | Ubah password lama yang masih teks biasa menjadi hash bcrypt |
| `npm run dev:backend` | Jalankan backend saja |
| `npm run dev:frontend` | Jalankan frontend saja |

---

## 🔑 Akun Awal

| Peran | Username | Password |
|---|---|---|
| Petugas UKS Utama | `siti_rahmawati` | sesuai `SEED_ADMIN_PASSWORD` (bawaan: `admin`) |

> **Ganti password ini setelah login pertama.** Akun awal hanya dibuat saat tabel `users` masih kosong.

### Aturan username
Huruf kecil, angka, dan underscore (`_`). Minimal 4 karakter, maksimal 20, tidak boleh diawali angka.

---

## 🔒 Catatan Keamanan

Aplikasi ini menyimpan **data kesehatan anak di bawah umur**. Yang sudah diterapkan:

- Seluruh endpoint API **wajib login** — tidak ada data yang bisa diambil tanpa token yang sah.
- Password disimpan sebagai hash bcrypt, tidak pernah dalam bentuk teks biasa.
- Identitas diambil dari token yang ditandatangani server, bukan dari header yang bisa dipalsukan klien.
- Percobaan login dibatasi 5 kali per 15 menit.
- CORS dibatasi ke alamat frontend yang dikonfigurasi.
- Pesan error teknis hanya masuk log server; klien menerima pesan umum.

Sebelum dipasang di komputer sekolah:
1. Ganti `JWT_SECRET` dengan teks acak panjang.
2. Ganti password akun awal.
3. Buat pengguna MySQL khusus dengan hak terbatas — jangan pakai `root` tanpa password.
4. Jadwalkan `npm run backup` secara berkala dan simpan hasilnya di penyimpanan terpisah.

---

## 📁 Struktur Direktori

```
ukssdkkn/
├── controllers/              # Controller REST API + validators.js (skema zod)
├── routes/                   # Routing Express, dijaga requireAuth
├── db/                       # Koneksi, inisialisasi skema, backup, migrasi password
├── middleware.js             # requireAuth, requireRole, errorHandler
├── frontend/
│   ├── public/               # Ikon PWA & manifest
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/       # CustomSelect, DatePicker, DataTable, Modal, Toast, dll.
│   │   │   └── layout/       # AppLayout, Sidebar, Topbar, PageHeader
│   │   ├── context/          # AuthContext (sesi) & DataContext (data aplikasi)
│   │   ├── data/             # Daftar referensi (keluhan, tindakan, status, kelas)
│   │   ├── pages/            # Dashboard, Pendaftaran, Riwayat, DataSiswa, Pengaturan, Login, Register
│   │   └── utils/            # api.js (pemanggil API) & formatters.js
│   └── vite.config.js        # Konfigurasi Vite & PWA
├── app.js                    # Perakitan Express
├── server.js                 # Titik masuk server
└── README.md
```

---

© 2026 **SD Negeri 05 Parambahan**, Kabupaten Solok, Sumatera Barat.
