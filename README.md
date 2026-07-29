# UKS Digital - SDN 05 Parambahan

Sistem Manajemen Buku Kunjungan & Laporan Rekapitulasi Kesehatan UKS Berbasis Web & Desktop (PWA) untuk **SD Negeri 05 Parambahan, Kabupaten Solok, Sumatera Barat**.

![UKS Digital Banner](frontend/public/icon-512.png)

---

## 🌟 Fitur Utama

- 🎨 **Ultra-Premium Dark Glassmorphism UI**: Antarmuka modern dengan palette warna Navy `#0B132B`, Emerald `#10B981`, Sky `#0EA5E9`, dan font *Plus Jakarta Sans* + *DM Sans*.
- 💻 **Dapat Diinstal ke Desktop (PWA)**: Aplikasi berbasis web yang dapat diinstal langsung ke PC Desktop / Laptop Windows & Mac melalui Google Chrome / Microsoft Edge.
- 🔐 **Autentikasi & Hak Akses (Login & Register)**:
  - Form Pendaftaran khusus Pegawai UKS (NIP) dan Dokter Kecil (NIS).
  - Validasi domain email resmi sekolah (`@sdn05parambahan.id`).
- 📅 **Input Waktu Masuk dengan Fitur Kalender Interaktif**:
  - Komponen `DatePicker` khusus dengan navigasi bulan, pemilih jam & menit, serta tombol pintas *"Sekarang"*.
- 🔍 **Pencarian Autocomplete Data Siswa & Tingkat Kelas (1 - 6)**:
  - Pencarian instant berbasis NIS/Nama siswa tanpa section A/B.
- 📋 **Pendaftaran & Rekam Kunjungan Sakit**:
  - Pilihan keluhan utama, catatan tambahan, status penanganan, dan penandaan khusus **Kasus Darurat**.
- 📊 **Laporan & Analitik Rekapitulasi Kesehatan**:
  - Grafik distribusi kunjungan per kelas dan peringkat keluhan terbanyak.
  - Ringkasan naratif otomatis dan penanganan data kosong (*empty states*).
- 🖨️ **Ekspor & Cetak PDF Resmi (A4 Layout)**:
  - Dilengkapi Kop Surat Resmi Sekolah, garis ganda instansi, ringkasan rekapitulasi, serta **Lembar Pengesahan / Tanda Tangan** (Kepala Sekolah & Petugas UKS Utama).
  - Tombol langsung unduh file `.pdf` via `html2pdf.js` & cetak A4 layout (`@media print`).

---

## 🛠️ Teknologi & Stack (MVC Architecture)

### Frontend Stack:
- **React 19** + **Vite 8**
- **Tailwind CSS v4**
- **Lucide React** (Modern Icons)
- **Recharts** (Data Visualization)
- **Vite PWA Plugin** (`vite-plugin-pwa`)
- **html2pdf.js** (Direct PDF Generation)

### Backend & Database Stack:
- **Node.js** + **Express 5**
- **MySQL2** (Connection Pool with Failover)
- **dotenv** & **CORS**

---

## 🚀 Cara Menjalankan Aplikasi

### 1. Prasyarat:
- **Node.js** (v18 ke atas) & **npm**
- (Opsional) Database **MySQL / MariaDB**

### 2. Instalasi & Running Frontend:
```bash
cd frontend
npm install
npm run dev
```
Aplikasi frontend akan berjalan di: `http://localhost:5173`

### 3. Running Backend API:
```bash
# Di direktori utama (root)
npm install
node server.js
```
API server backend akan berjalan di: `http://localhost:3000`

---

## 🔑 Akun Demo Petugas UKS

| Role | NIP / NIS | Email | Password |
|---|---|---|---|
| **Petugas UKS Utama** | `198507152010012003` | `siti.rahmawati@sdn05parambahan.id` | `admin` |

---

## 📁 Struktur Direktori Project

```
ukssdkkn/
├── controllers/              # REST API Controllers (Siswa, Kunjungan, Laporan)
├── db/                       # Konfigurasi Database MySQL & Init Scripts
├── routes/                   # Endpoint Routing Express.js
├── frontend/
│   ├── public/               # Icon PWA (192px/512px) & Manifest
│   ├── src/
│   │   ├── components/       # UI Components (CustomSelect, DatePicker, DataTable, Modal, Toast)
│   │   ├── context/          # Auth Context & State Management
│   │   ├── data/             # Initial Data & References
│   │   ├── pages/            # Page Views (Dashboard, Pendaftaran, Riwayat, Siswa, Laporan, Login, Register)
│   │   └── utils/            # Date & String Formatters
│   └── vite.config.js        # Konfigurasi Vite & PWA
├── app.js                    # Express App Setup
├── server.js                 # HTTP Server Entry Point
└── README.md
```

---

© 2026 **SD Negeri 05 Parambahan**, Kabupaten Solok, Sumatera Barat.
