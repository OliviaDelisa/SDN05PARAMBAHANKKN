# 📖 Penjelasan Lengkap Struktur Project UKS SD5 Parambahan

## 🎯 Apa Ini?

Project ini adalah sebuah **aplikasi web "UKS GuestBook"** (Buku Tamu UKS) untuk SD 5 Parambahan. Project ini masih dalam tahap awal — kerangka (skeleton) sudah disiapkan, tapi sebagian besar file **belum diisi kodenya** (masih kosong). Analoginya seperti rumah yang sudah ada fondasi dan kerangkanya, tapi belum dibangun dinding dan atapnya.

---

## 🧱 Technology Stack (Tumpukan Teknologi)

"Stack" adalah kumpulan teknologi yang dipakai bersama untuk membangun aplikasi. Project ini menggunakan arsitektur **Full-Stack JavaScript**, artinya bahasa pemrograman yang dipakai di depan (frontend) dan belakang (backend) sama-sama **JavaScript**.

```
┌─────────────────────────────────────────────────────┐
│                   PENGGUNA (Browser)                │
│         Membuka website melalui Chrome/Edge         │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│              FRONTEND (Tampilan Website)             │
│         React + Vite + TailwindCSS v4               │
│         📂 folder: frontend/                        │
└──────────────────────┬──────────────────────────────┘
                       │ mengirim/menerima data (API)
                       ▼
┌─────────────────────────────────────────────────────┐
│              BACKEND (Server/Otak Website)           │
│         Node.js + Express.js                        │
│         📂 file: server.js, app.js                  │
│         📂 folder: controllers/, routes/            │
└──────────────────────┬──────────────────────────────┘
                       │ membaca/menyimpan data
                       ▼
┌─────────────────────────────────────────────────────┐
│              DATABASE (Gudang Data)                  │
│         MySQL                                       │
│         📂 folder: db/                              │
└─────────────────────────────────────────────────────┘
```

### Ringkasan Stack:

| Bagian | Teknologi | Fungsi |
|--------|-----------|--------|
| **Frontend** | React 19, Vite 8, TailwindCSS 4 | Tampilan yang dilihat pengguna |
| **Backend** | Node.js, Express 5 | Server yang memproses logika & data |
| **Database** | MySQL (via mysql2) | Menyimpan data secara permanen |
| **Autentikasi** | bcrypt, jsonwebtoken (JWT) | Login/keamanan pengguna |
| **Validasi** | Zod | Memeriksa apakah data yang masuk valid |
| **Upload File** | Multer | Menangani upload gambar/dokumen |

---

## 📁 Struktur Folder Lengkap

Berikut adalah seluruh file dan folder di project ini beserta penjelasannya:

```
📦 UKS_SD5_Parambahan/
│
├── 📄 .env                    ← Pengaturan rahasia (password database, dll)
├── 📄 .gitignore              ← Daftar file yang TIDAK boleh di-upload ke GitHub
├── 📄 README.md               ← Dokumentasi project (belum diisi)
├── 📄 package.json            ← Daftar belanja library backend
├── 📄 package-lock.json       ← Versi pasti dari setiap library
├── 📄 server.js               ← Titik start backend (belum diisi)
├── 📄 app.js                  ← Konfigurasi aplikasi Express (belum diisi)
│
├── 📂 controllers/            ← Logika bisnis backend (kosong)
├── 📂 routes/                 ← Daftar alamat API (kosong)
├── 📂 db/                     ← Koneksi & setup database
│   ├── 📄 db.js               ← Koneksi ke MySQL (belum diisi)
│   └── 📄 initDB.js           ← Membuat tabel database (belum diisi)
│
├── 📂 uploads/                ← Tempat menyimpan file yang di-upload (kosong)
├── 📂 node_modules/           ← Library backend yang terinstall (otomatis)
│
└── 📂 frontend/               ← Semua kode tampilan website
    ├── 📄 .gitignore
    ├── 📄 README.md
    ├── 📄 eslint.config.js    ← Aturan penulisan kode
    ├── 📄 index.html           ← Halaman HTML utama
    ├── 📄 package.json         ← Daftar belanja library frontend
    ├── 📄 package-lock.json
    ├── 📄 vite.config.js       ← Konfigurasi Vite (bundler)
    ├── 📂 node_modules/        ← Library frontend (otomatis)
    ├── 📂 public/              ← File statis (gambar, ikon)
    │   ├── 🖼️ favicon.svg
    │   └── 🖼️ icons.svg
    └── 📂 src/                 ← Kode sumber React
        ├── 📄 main.jsx         ← Titik masuk React
        ├── 📄 App.jsx          ← Komponen utama React
        ├── 📄 App.css          ← Style bawaan Vite
        ├── 📄 index.css        ← Import TailwindCSS
        └── 📂 assets/          ← Gambar & aset
            ├── 🖼️ hero.png
            ├── 🖼️ react.svg
            └── 🖼️ vite.svg
```

---

## 🔍 Penjelasan Detail Setiap Bagian

---

### 1. 📄 `.env` — File Pengaturan Rahasia

> **Status: Kosong** (belum diisi)

Bayangkan `.env` seperti **brankas rahasia** yang menyimpan informasi sensitif:

```env
# Contoh isi yang nantinya akan diisi:
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password_rahasia
DB_NAME=uks_guestbook
JWT_SECRET=kunci_rahasia_jwt
PORT=3000
```

File ini **TIDAK** di-upload ke GitHub (sudah diatur di `.gitignore`) supaya password tidak bocor ke publik. Setiap developer harus membuat file `.env` sendiri di komputernya.

---

### 2. 📄 `.gitignore` — Daftar File yang Diabaikan Git

File ini memberitahu Git: *"Jangan upload file-file ini ke GitHub!"*

```
node_modules/     ← Library terlalu besar, cukup install ulang pakai npm install
.env              ← Password rahasia, jangan sampai bocor
frontend/dist/    ← Hasil build frontend, bisa di-generate ulang
*.log             ← File log, tidak penting untuk disimpan
uploads/*         ← File yang di-upload user, terlalu besar untuk GitHub
```

Ini penting karena `node_modules` saja bisa berisi **ribuan file** yang tidak perlu di-upload — siapapun bisa menginstallnya kembali dengan perintah `npm install`.

---

### 3. 📄 `package.json` — Daftar Belanja Library Backend

> [package.json](file:///d:/ukssdkkn/package.json)

Bayangkan ini seperti **resep masakan** yang mencantumkan semua bahan yang dibutuhkan. File ini mendefinisikan:

#### 📦 Dependencies (Library yang dibutuhkan):

| Library | Versi | Fungsi | Analogi |
|---------|-------|--------|---------|
| **express** | 5.2.1 | Framework web server | Kerangka rumah |
| **mysql2** | 3.23.1 | Menghubungkan ke database MySQL | Kabel ke gudang data |
| **bcrypt** | 6.0.0 | Mengenkripsi password | Gembok password |
| **jsonwebtoken** | 9.0.3 | Membuat token login (JWT) | Kartu identitas digital |
| **cors** | 2.8.6 | Mengizinkan frontend akses backend | Penjaga pintu |
| **dotenv** | 17.4.2 | Membaca file `.env` | Pembaca brankas |
| **morgan** | 1.11.0 | Mencatat log aktivitas server | Buku catatan satpam |
| **multer** | 2.2.0 | Menangani upload file | Tukang pos untuk file |
| **uuid** | 14.0.1 | Membuat ID unik | Pencetak nomor KTP |
| **zod** | 4.4.3 | Validasi data yang masuk | Pemeriksa tiket |

#### 🛠️ devDependencies (Library untuk development saja):

| Library | Fungsi |
|---------|--------|
| **nodemon** | Auto-restart server saat kode berubah (hemat waktu developer) |

#### 📜 Scripts (Perintah yang bisa dijalankan):

```json
"dev": "nodemon server.js"    ← Menjalankan server mode development
"start": "node server.js"     ← Menjalankan server mode production
```

---

### 4. 📄 `server.js` — Titik Start Backend

> [server.js](file:///d:/ukssdkkn/server.js) — **Status: Kosong** (belum diisi)

Ini adalah file **pertama yang dijalankan** saat mengetik `npm run dev`. Bayangkan ini seperti **tombol ON** pada mesin.

Nantinya file ini akan berisi kode seperti:

```javascript
// Contoh isi yang diharapkan:
const app = require('./app');         // Mengambil aplikasi dari app.js
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server berjalan di port ${PORT}`);
});
```

**Tugasnya sederhana**: Menyalakan server dan mendengarkan permintaan dari pengguna.

---

### 5. 📄 `app.js` — Konfigurasi Aplikasi Express

> [app.js](file:///d:/ukssdkkn/app.js) — **Status: Kosong** (belum diisi)

Kalau `server.js` adalah tombol ON, maka `app.js` adalah **mesinnya sendiri**. Di sinilah semua pengaturan aplikasi dikonfigurasi.

Nantinya file ini akan berisi:

```javascript
// Contoh isi yang diharapkan:
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const app = express();

app.use(cors());              // Izinkan frontend mengakses API
app.use(morgan('dev'));       // Catat semua aktivitas
app.use(express.json());     // Bisa menerima data JSON

// Hubungkan ke routes
app.use('/api/siswa', require('./routes/siswaRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));

module.exports = app;
```

**Mengapa dipisah dari `server.js`?** Supaya lebih rapi — `app.js` mengurus *apa yang dilakukan*, `server.js` mengurus *kapan mulai bekerja*.

---

### 6. 📂 `controllers/` — Logika Bisnis

> **Status: Folder kosong** (belum ada file)

Controller adalah **otak** yang memproses setiap permintaan. Bayangkan seperti **karyawan di kantor** yang masing-masing punya tugas berbeda.

Contoh controller yang nantinya akan dibuat:

```
controllers/
├── authController.js      ← Mengurus login & registrasi
├── siswaController.js     ← Mengurus data siswa
├── kesehatanController.js ← Mengurus data kesehatan
└── uploadController.js    ← Mengurus upload file
```

Contoh isi controller:

```javascript
// siswaController.js
const tambahSiswa = async (req, res) => {
  // 1. Ambil data dari permintaan
  const { nama, kelas, alamat } = req.body;
  
  // 2. Simpan ke database
  await db.query('INSERT INTO siswa (nama, kelas, alamat) VALUES (?, ?, ?)', 
    [nama, kelas, alamat]);
  
  // 3. Kirim jawaban ke frontend
  res.json({ pesan: 'Siswa berhasil ditambahkan!' });
};
```

---

### 7. 📂 `routes/` — Daftar Alamat API

> **Status: Folder kosong** (belum ada file)

Routes adalah **papan petunjuk jalan** yang mengarahkan setiap permintaan ke controller yang tepat. Bayangkan seperti **resepsionis** di kantor.

```
Pengguna mengetik URL → Route mengarahkan → Controller memproses
```

Contoh:

```javascript
// routes/siswaRoutes.js
const router = require('express').Router();
const siswaController = require('../controllers/siswaController');

router.get('/',      siswaController.semuaSiswa);    // GET    /api/siswa
router.post('/',     siswaController.tambahSiswa);   // POST   /api/siswa
router.put('/:id',   siswaController.editSiswa);     // PUT    /api/siswa/5
router.delete('/:id', siswaController.hapusSiswa);   // DELETE /api/siswa/5
```

| Method | Analogi | Contoh |
|--------|---------|--------|
| `GET` | Minta lihat data | "Tampilkan semua siswa" |
| `POST` | Kirim data baru | "Tambahkan siswa baru" |
| `PUT` | Ubah data yang ada | "Edit nama siswa nomor 5" |
| `DELETE` | Hapus data | "Hapus siswa nomor 5" |

---

### 8. 📂 `db/` — Database (Gudang Data)

Database adalah tempat **semua data disimpan secara permanen**. Bayangkan seperti **lemari arsip** yang menyimpan semua catatan.

#### 📄 [db.js](file:///d:/ukssdkkn/db/db.js) — Koneksi Database (belum diisi)

File ini akan berisi kode untuk **menghubungkan** aplikasi ke MySQL:

```javascript
// Contoh isi yang diharapkan:
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST,         // Alamat database
  user: process.env.DB_USER,         // Username database
  password: process.env.DB_PASSWORD, // Password database
  database: process.env.DB_NAME      // Nama database
});

module.exports = pool;
```

#### 📄 [initDB.js](file:///d:/ukssdkkn/db/initDB.js) — Inisialisasi Tabel (belum diisi)

File ini akan membuat **tabel-tabel** di database saat pertama kali dijalankan:

```javascript
// Contoh isi yang diharapkan:
const db = require('./db');

const initDB = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS siswa (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nama VARCHAR(100),
      kelas VARCHAR(10),
      alamat TEXT
    )
  `);
  console.log('Tabel berhasil dibuat!');
};
```

> **MySQL** dipilih karena menggunakan library `mysql2` di `package.json`.

---

### 9. 📂 `uploads/` — Tempat Penyimpanan File Upload

> **Status: Folder kosong**

Ketika pengguna meng-upload foto atau dokumen melalui website, file tersebut akan disimpan di folder ini. Library **Multer** yang menangani proses upload ini.

```
uploads/
├── foto_siswa_001.jpg
├── surat_keterangan_002.pdf
└── ...
```

Folder ini tidak di-upload ke GitHub (karena diatur di `.gitignore`) — file upload milik setiap server berbeda-beda.

---

### 10. 📂 `frontend/` — Tampilan Website (Yang Dilihat Pengguna)

Ini adalah bagian yang **dilihat dan diinteraksikan** oleh pengguna di browser mereka.

#### 🛠️ Teknologi Frontend:

| Teknologi | Versi | Fungsi |
|-----------|-------|--------|
| **React** | 19 | Library untuk membangun tampilan (UI) secara modular |
| **Vite** | 8 | Bundler — mengemas & menyajikan kode dengan cepat |
| **TailwindCSS** | 4 | Framework CSS — styling cepat dengan class utility |
| **ESLint** | 10 | Pemeriksa kualitas kode |

#### 📄 [index.html](file:///d:/ukssdkkn/frontend/index.html) — Halaman Utama

```html
<body>
  <div id="root"></div>                              <!-- React akan mengisi div ini -->
  <script type="module" src="/src/main.jsx"></script> <!-- Memuat React -->
</body>
```

Ini adalah **satu-satunya file HTML**. React akan mengisi `<div id="root">` dengan konten dinamis. Inilah konsep **Single Page Application (SPA)** — hanya satu halaman HTML, tapi bisa menampilkan banyak "halaman" berbeda.

#### 📄 [main.jsx](file:///d:/ukssdkkn/frontend/src/main.jsx) — Titik Masuk React

```jsx
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

File ini **menghubungkan React ke HTML** — mengambil `<div id="root">` dari `index.html`, lalu memasukkan komponen `<App />` ke dalamnya.

#### 📄 [App.jsx](file:///d:/ukssdkkn/frontend/src/App.jsx) — Komponen Utama

```jsx
function App() {
  return (
    <div className="min-h-screen bg-blue-500 flex items-center justify-center">
      <h1 className="text-4xl font-bold text-white">
        UKS GuestBook
      </h1>
    </div>
  )
}
```

Saat ini hanya menampilkan **tulisan "UKS GuestBook"** dengan latar belakang biru. Class seperti `min-h-screen`, `bg-blue-500`, `text-4xl` adalah class dari **TailwindCSS**.

#### 📄 [index.css](file:///d:/ukssdkkn/frontend/src/index.css) — Mengaktifkan TailwindCSS

```css
@import "tailwindcss";
```

Satu baris ini mengaktifkan seluruh kemampuan TailwindCSS v4.

#### 📄 [vite.config.js](file:///d:/ukssdkkn/frontend/vite.config.js) — Konfigurasi Vite

```javascript
export default defineConfig({
  plugins: [
    react(),        // Plugin agar Vite bisa memproses React/JSX
    tailwindcss()   // Plugin agar Vite bisa memproses TailwindCSS
  ],
})
```

#### 📂 `public/` & `assets/` — Gambar & Ikon

File-file statis seperti gambar dan ikon yang dipakai di website:

- `public/favicon.svg` — Ikon kecil di tab browser
- `public/icons.svg` — Kumpulan ikon
- `assets/hero.png`, `react.svg`, `vite.svg` — Gambar bawaan template Vite

---

### 11. 📄 `package-lock.json` — Kunci Versi Library

File ini dibuat **otomatis** oleh npm. Fungsinya memastikan semua orang yang bekerja di project ini menggunakan **versi library yang persis sama**. Anda tidak perlu mengedit file ini secara manual.

---

### 12. 📂 `node_modules/` — Library yang Terinstall

Folder ini berisi **semua kode library** yang didownload saat menjalankan `npm install`. Folder ini:
- ❌ Tidak di-upload ke GitHub (terlalu besar)
- ✅ Bisa di-generate ulang kapan saja dengan `npm install`
- 🚫 Tidak perlu diedit manual

---

## 🔄 Bagaimana Semuanya Terhubung?

Berikut alur lengkap saat seorang pengguna menggunakan website:

```
 ┌─────────────────────────────────────────────────────────────────────────┐
 │                        ALUR KERJA APLIKASI                             │
 └─────────────────────────────────────────────────────────────────────────┘

 👤 Pengguna membuka browser dan mengakses website
        │
        ▼
 ┌──────────────────────────────────────────┐
 │  1️⃣  FRONTEND (React + Vite)              │
 │                                          │
 │  Browser memuat index.html               │
 │  → main.jsx dijalankan                   │
 │  → App.jsx ditampilkan                   │
 │  → Pengguna melihat halaman website      │
 │                                          │
 │  Pengguna mengisi form & klik "Simpan"   │
 └──────────────┬───────────────────────────┘
                │
                │  Mengirim data via HTTP Request
                │  (contoh: POST /api/siswa)
                ▼
 ┌──────────────────────────────────────────┐
 │  2️⃣  ROUTES (Papan Petunjuk)              │
 │                                          │
 │  "Oh, ada request ke /api/siswa"         │
 │  "Method-nya POST"                       │
 │  "Berarti mau tambah siswa baru"         │
 │  "Saya arahkan ke siswaController"       │
 └──────────────┬───────────────────────────┘
                │
                ▼
 ┌──────────────────────────────────────────┐
 │  3️⃣  CONTROLLER (Logika Bisnis)           │
 │                                          │
 │  1. Terima data dari request             │
 │  2. Validasi data dengan Zod             │
 │  3. Hash password dengan bcrypt          │
 │  4. Simpan file upload dengan Multer     │
 │  5. Kirim data ke database               │
 └──────────────┬───────────────────────────┘
                │
                ▼
 ┌──────────────────────────────────────────┐
 │  4️⃣  DATABASE (MySQL via db.js)           │
 │                                          │
 │  INSERT INTO siswa (nama, kelas)         │
 │  VALUES ('Budi', '5A')                   │
 │                                          │
 │  ✅ Data tersimpan!                       │
 └──────────────┬───────────────────────────┘
                │
                │  Mengirim response (jawaban)
                ▼
 ┌──────────────────────────────────────────┐
 │  5️⃣  FRONTEND menerima jawaban            │
 │                                          │
 │  "Siswa berhasil ditambahkan!"           │
 │  → Tampilkan notifikasi sukses           │
 │  → Refresh daftar siswa                  │
 └──────────────────────────────────────────┘
```

---

## 📊 Status Project Saat Ini

| Komponen | Status | Keterangan |
|----------|--------|------------|
| Struktur folder | ✅ Selesai | Folder sudah dibuat dengan benar |
| `package.json` (backend) | ✅ Selesai | Semua library sudah terdaftar |
| `package.json` (frontend) | ✅ Selesai | React, Vite, Tailwind terdaftar |
| `node_modules` | ✅ Terinstall | Library sudah di-download |
| `.gitignore` | ✅ Selesai | File yang diabaikan sudah diatur |
| Frontend dasar | ✅ Berjalan | Menampilkan "UKS GuestBook" |
| `server.js` | ❌ Kosong | Belum ada kode |
| `app.js` | ❌ Kosong | Belum ada kode |
| `.env` | ❌ Kosong | Belum ada konfigurasi |
| `db/db.js` | ❌ Kosong | Belum ada koneksi database |
| `db/initDB.js` | ❌ Kosong | Belum ada inisialisasi tabel |
| `controllers/` | ❌ Kosong | Belum ada controller |
| `routes/` | ❌ Kosong | Belum ada route |
| `uploads/` | ❌ Kosong | Menunggu fitur upload |

> **Kesimpulan:** Project ini baru memiliki **kerangka (boilerplate)** yang siap untuk dibangun. Frontend sudah bisa menampilkan halaman dasar, tapi backend belum memiliki fungsionalitas apapun.

---

## 🏃 Cara Menjalankan Project

### Backend:
```bash
# Install library backend
npm install

# Jalankan server (mode development)
npm run dev
```

### Frontend:
```bash
# Masuk ke folder frontend
cd frontend

# Install library frontend
npm install

# Jalankan frontend (mode development)
npm run dev
```

> ⚠️ **Catatan:** Karena file backend masih kosong, hanya frontend yang bisa dijalankan saat ini.
