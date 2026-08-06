# Analisis Project — UKS Digital SDN 05 Parambahan

**Tanggal analisis:** 3 Agustus 2026
**Commit:** `42c46bb` (branch `main`, working tree clean)
**Ruang lingkup:** seluruh source code backend + frontend (di luar `node_modules/`, `dist/`, `Mock-ups/`)

---

## 1. Ringkasan Eksekutif

UKS Digital adalah aplikasi web (PWA) untuk digitalisasi buku kunjungan UKS: pendataan siswa, rekam kunjungan sakit, riwayat, laporan analitik, dan cetak PDF resmi A4. Stack: **React 19 + Vite 8 + Tailwind v4** di frontend, **Express 5 + MySQL2** di backend.

**Penilaian umum:** Struktur folder rapi dan konsisten dengan pola MVC. Kualitas UI/UX di atas rata-rata untuk project skala ini — komponen reusable, empty state ditangani, print layout A4 sudah jadi. **Namun lapisan keamanan praktis belum ada, dan tiga bug fungsional membuat sebagian fitur inti tidak bekerja sebagaimana terlihat.**

| Aspek | Nilai | Catatan |
|---|---|---|
| Struktur & organisasi kode | 🟢 Baik | Pemisahan routes/controllers/db bersih dan konsisten |
| Keamanan | 🔴 Kritis | Password plaintext, tidak ada auth middleware sama sekali |
| Kebenaran fungsional | 🟠 Bermasalah | Halaman Laporan selalu kosong; delete/update diam-diam gagal |
| Konsistensi frontend–backend | 🟠 Bermasalah | ID desync, error ditelan diam-diam |
| Kesiapan produksi | 🔴 Belum | Hardcoded localhost, tidak ada build serving, tanpa test |
| Dokumentasi | 🟡 Cukup | README rapi tapi beberapa poin sudah tidak akurat |

**3 hal yang paling mendesak:**
1. Hash password dengan bcrypt (sudah ter-install, belum dipakai sama sekali) — Temuan #1
2. Halaman Laporan & Analitik membaca array kosong, bukan data asli — Temuan #10
3. Tambahkan auth middleware; saat ini seluruh API terbuka tanpa login — Temuan #2

---

## 2. Arsitektur Sistem

### 2.1 Diagram alur

```
┌─────────────────────────── Browser (localhost:5173) ────────────────────────────┐
│  React 19 SPA                                                                    │
│                                                                                  │
│  App.jsx ─── ToastProvider → AuthProvider → DataProvider → BrowserRouter         │
│                   │              │              │                                │
│                   │              │              └── siswaList, kunjunganList      │
│                   │              │                  (state global + optimistic)   │
│                   │              └── user (sessionStorage 'uks_user')             │
│                   │                                                              │
│  Pages: Dashboard · Pendaftaran · Riwayat · DataSiswa · Laporan · Pengaturan     │
│  Common: CustomSelect · DatePicker · DataTable · Modal · Toast · TagSelector      │
│                                          │                                       │
│                              utils/api.js (fetch + header X-User-Id)             │
└──────────────────────────────────────────┼───────────────────────────────────────┘
                                           │ Vite dev proxy  /api → :3000
┌──────────────────────────────────────────▼───────────────────────────────────────┐
│  Express 5 (localhost:3000)                                                       │
│  server.js → app.js → cors() · morgan · express.json()                            │
│                                                                                   │
│  /api/auth        → authRoutes       → authController      (login, register)      │
│  /api/siswa       → siswaRoutes      → siswaController     (GET POST PUT DELETE)  │
│  /api/kunjungan   → kunjunganRoutes  → kunjunganController (GET POST DELETE)      │
│  /api/laporan     → laporanRoutes    → laporanController   (GET)                  │
│  /api/pengaturan  → pengaturanRoutes → pengaturanController(GET, PUT ×2)          │
│                                           │                                       │
│                                   db/db.js (mysql2 pool, limit 10)                │
└───────────────────────────────────────────┼───────────────────────────────────────┘
                                            ▼
                      MySQL `uks_digital` — users · siswa · kunjungan · pengaturan_sekolah
                      (schema dibuat otomatis oleh db/initDB.js saat startup)
```

### 2.2 Inventaris file

**Backend (10 file, ~450 baris)**

| File | Peran |
|---|---|
| `server.js` | Entry point, panggil `initDatabase()` lalu `app.listen()` |
| `app.js` | Setup Express, middleware, mounting 5 route group, 404 handler |
| `db/db.js` | Connection pool MySQL2 (parsing `host:port` gabungan) |
| `db/initDB.js` | Auto-create database + 4 tabel + seed admin & data sekolah |
| `db/sqliteDB.js` | ⚠️ **Dead code** — jalur SQLite yang tidak pernah di-import |
| `db/uks_digital.sql` | Dump schema portable untuk import manual phpMyAdmin |
| `routes/*.js` (5) | Router tipis, murni mapping HTTP verb → controller |
| `controllers/*.js` (5) | Query langsung ke pool, tanpa layer service/model |

**Frontend (31 file, 5.099 baris)**

| Kelompok | File | Baris |
|---|---|---|
| Pages | Dashboard 416 · DataSiswa 410 · Riwayat 399 · Laporan 363 · Pendaftaran 336 · Pengaturan 317 · Register 305 · Login 161 | 2.707 |
| Components | DatePicker 270 · PrintReportTemplate 263 · Sidebar 249 · SearchAutocomplete 157 · CustomSelect 157 · Toast 115 · Modal 93 · StatCard 64 · DataTable 55 · PageHeader 39 · TagSelector 38 · Badge 32 · AppLayout 15 | 1.547 |
| Context / utils | DataContext 161 · AuthContext 91 · formatters 69 · api 65 · mockData 42 · useApi 30 | 458 |
| Styles | index.css 113 · App.css 184 | 297 |

### 2.3 Model data

```
users                    siswa                     kunjungan                pengaturan_sekolah
─────                    ─────                     ─────────                ──────────────────
id PK                    id PK                     id PK                    id PK
nama_lengkap             nis UNIQUE                siswa_id ──┐             nama_sekolah
username UNIQUE          nama                      siswa_nama │ (denormal)  npsn
nip UNIQUE               kelas       ◄─────────────siswa_nis  │             telepon_sekolah
no_telepon               jenis_kelamin ENUM        kelas    ──┘             kepala_sekolah
password (PLAINTEXT ⚠)   tanggal_lahir             waktu_masuk              alamat
role                     nama_wali                 waktu_keluar (tak dipakai ⚠)
created_at               telepon_wali              keluhan_utama
                         idx: kelas, nama          keterangan
                                                   is_darurat
                                                   tindakan
                                                   status ENUM(4)
                                                   idx: waktu_masuk, status
```

**Catatan desain:** `kunjungan` sengaja mendenormalisasi `siswa_nama`/`siswa_nis`/`kelas`. Ini keputusan yang **tepat** untuk domain rekam medis — riwayat kunjungan harus tetap merefleksikan kondisi saat kejadian meski siswa naik kelas atau datanya diubah. Namun tidak ada FOREIGN KEY pada `siswa_id`, jadi tidak ada jaminan integritas referensial sama sekali.

---

## 3. Temuan — Keamanan

### 🔴 KRITIS

**#1 — Password disimpan dan dibandingkan dalam bentuk plaintext**
`controllers/authController.js:45` · `controllers/authController.js:104`

```js
// Login — perbandingan string biasa
if (user.password !== password) { ... }

// Register — password masuk DB apa adanya
INSERT INTO users (..., password, role) VALUES (?, ?, ?, ?, ?, ?)
```

`bcrypt@6.0.0` sudah terpasang di `package.json` tetapi **0 file yang mereferensikannya**. Siapa pun yang bisa membaca tabel `users` langsung memperoleh semua kredensial. Ini juga membocorkan password yang kemungkinan besar dipakai ulang guru/petugas di layanan lain.

*Perbaikan:* `bcrypt.hash(password, 10)` saat register, `bcrypt.compare()` saat login, plus script migrasi untuk data yang sudah ada.

---

**#2 — Tidak ada middleware autentikasi pada seluruh endpoint**
`routes/*.js` (semua)

Setiap route langsung memetakan ke controller tanpa penjaga apa pun:

```js
router.get('/', getSiswa)        // siapa saja bisa akses
router.delete('/:id', deleteSiswa)
```

Tanpa login sama sekali, `curl http://localhost:3000/api/siswa` mengembalikan seluruh data siswa (nama, NIS, tanggal lahir, nama & telepon wali), dan `curl -X DELETE .../api/siswa/1` menghapusnya. Kombinasi dengan `cors()` tanpa opsi (`app.js:18`) yang mengizinkan **semua origin** membuat API sepenuhnya terbuka.

Ini data kesehatan anak di bawah umur — kategori paling sensitif.

---

**#3 — "Autentikasi" hanya ada di sisi klien**
`frontend/src/App.jsx:17-23` · `frontend/src/context/AuthContext.jsx:17-27`

```js
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth()      // = !!user
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return children
}
```

`user` berasal dari `sessionStorage.getItem('uks_user')`. Menjalankan satu baris di DevTools —
`sessionStorage.setItem('uks_user', '{"id":1,"nama_lengkap":"X"}')` — memberi akses penuh ke seluruh aplikasi. Tidak ada token, tidak ada sesi server-side. `jsonwebtoken@9.0.3` terpasang dan `JWT_SECRET` sudah ada di `.env`, keduanya **tidak pernah dipakai**.

---

**#4 — IDOR: identitas pengguna diambil dari header yang dikontrol klien**
`controllers/pengaturanController.js:7` · `controllers/pengaturanController.js:35-45`

```js
const userId = req.headers['x-user-id']          // dipercaya mentah-mentah
await pool.query(
  'UPDATE users SET nama_lengkap = ?, username = ?, nip = ?, no_telepon = ? WHERE id = ?',
  [nama_lengkap, username?.toLowerCase(), nip, no_telepon, userId]
)
```

Klien mana pun cukup mengirim `X-User-Id: 1` untuk **membaca dan menimpa profil petugas mana pun** — termasuk mengganti `username` akun lain sehingga pemiliknya tidak bisa login lagi. Tidak ada verifikasi kepemilikan.

Endpoint ini juga:
- **melewati validasi username** — `validateUsername()` di `authController.js:9` tidak dipanggil di sini, jadi format apa pun lolos dan langsung tidak sinkron dengan aturan register;
- **tidak mengecek duplikat** — menabrak constraint `UNIQUE` sehingga error MySQL mentah dikembalikan ke klien.

---

**#5 — File database SQLite ikut ter-commit ke Git**
`db/uks_digital.db` (36 KB, terverifikasi lewat `git ls-files`)

Berisi 1 baris `users` lengkap dengan password plaintext dan data `pengaturan_sekolah`. `.gitignore` sudah mencakup `.env` tetapi tidak `*.db`. Setiap orang yang meng-clone repo mendapat isinya, dan riwayat Git tetap menyimpannya walau file dihapus sekarang.

*Perbaikan:* tambahkan `*.db`, `*.db-wal`, `*.db-shm` ke `.gitignore`, jalankan `git rm --cached db/uks_digital.db`, dan bersihkan history bila repo pernah dipublikasikan.

### 🟠 TINGGI

**#6 — Penentuan role dipengaruhi input pengguna**
`controllers/authController.js:98-99`

```js
const isDokterKecil = nip.length <= 10
const role = isDokterKecil ? 'Dokter Kecil UKS' : 'Petugas UKS Pegawai'
```

Panjang NIP sepenuhnya ditentukan pendaftar, jadi pendaftar menentukan role-nya sendiri. Saat ini `role` belum dipakai untuk otorisasi apa pun sehingga dampaknya masih terbatas — tetapi begitu role dipakai untuk membatasi menu atau aksi, ini langsung menjadi jalur privilege escalation.

**#7 — Tidak ada rate limiting pada endpoint login**
`routes/authRoutes.js:6`

`POST /api/auth/login` tidak dibatasi. Dengan password default seed `'admin'` (`db/initDB.js:64`), brute force menjadi sangat murah.

**#8 — Pesan error database dikembalikan mentah ke klien**
`controllers/siswaController.js:9,37,56,68` · `kunjunganController.js:10,52,64` · `laporanController.js:23` · `pengaturanController.js:28,59,73`

```js
return res.status(500).json({ success: false, message: err.message })
```

Membocorkan nama tabel, nama kolom, dan detail constraint MySQL. Sebaiknya log detail ke server, kirim pesan generik ke klien.

**#9 — Tidak ada validasi input di controller**
`controllers/siswaController.js:14-22`

`createSiswa` menerima body apa adanya tanpa cek satu pun — `nis`/`nama` kosong, `kelas` di luar 1–6, atau `jenis_kelamin` sembarang semua diteruskan ke MySQL dan baru gagal di level constraint. `zod@4.4.3` terpasang tetapi **0 file merujuknya**.

---

## 4. Temuan — Kebenaran Fungsional

### 🔴 KRITIS

**#10 — Halaman Laporan & Analitik selalu kosong**
`frontend/src/pages/LaporanAnalitik.jsx:31`

```js
import { kunjunganList, dataSekolah, petugasUks } from '../data/mockData'
```

Sementara `frontend/src/data/mockData.js:26` berisi:

```js
export const kunjunganList = []
```

Halaman ini mengimpor **array kosong statis**, bukan `useData()` seperti Dashboard (`Dashboard.jsx:38`) dan Riwayat (`RiwayatKunjungan.jsx:28`). Akibatnya, berapa pun data kunjungan yang tersimpan di database:

- 4 StatCard → `0`, `0`, `-`, `-`
- Pie chart distribusi kelas → empty state
- Bar chart peringkat keluhan → empty state
- Ringkasan naratif → selalu cabang "Belum ada data kunjungan"
- Rincian status penanganan → semua `0` / `0%`
- **PDF resmi yang dicetak → tabel kosong**

Ini menonaktifkan salah satu fitur utama yang disebut di README ("Laporan bulanan ke Dinas Pendidikan atau Puskesmas"), dan gejalanya menyesatkan: aplikasi tampak berjalan normal, hanya "belum ada data".

*Perbaikan:* ganti dengan `const { kunjunganList } = useData()`, lalu filter berdasarkan `selectedBulan`/`selectedTahun` yang sudah ada state-nya tapi belum dipakai untuk menyaring apa pun.

---

**#11 — ID lokal palsu tidak pernah direkonsiliasi dengan ID database**
`frontend/src/pages/PendaftaranKunjungan.jsx:55` · `frontend/src/context/DataContext.jsx:75,114`

```js
// PendaftaranKunjungan.jsx
const newRecord = { id: Date.now(), siswa_id: selectedSiswa.id, ... }
await addKunjungan(newRecord)

// DataContext.jsx — hasil response dari server dibuang
const addKunjungan = async (kunjunganData) => {
  const newKunjungan = { id: kunjunganData.id || Date.now(), ...kunjunganData }
  setKunjunganList((prev) => [newKunjungan, ...prev])
  try { await api.kunjungan.create(newKunjungan) } catch (err) {}
  return newKunjungan
}
```

Backend mengabaikan `id` yang dikirim (kolom `AUTO_INCREMENT`) dan mengembalikan `result.insertId` yang benar (`kunjunganController.js:37`), tetapi frontend **tidak pernah membacanya**. Jadi record di state punya `id = 1754...` (timestamp) sedangkan di DB `id = 1`.

---

**#12 — Delete dan update gagal diam-diam, tetapi UI melaporkan sukses**
Konsekuensi langsung dari #11.

`DataSiswa.jsx` memanggil `updateSiswa(editingSiswa.id, formData)` dan `deleteSiswa(id)` dengan ID timestamp tersebut. Backend menjalankan:

```js
await pool.query('DELETE FROM siswa WHERE id = ?', [id])   // 0 baris terpengaruh
return res.json({ success: true, message: 'Data siswa berhasil dihapus' })
```

Tidak ada satu pun controller yang memeriksa `result.affectedRows`. Alurnya:

1. Petugas menghapus siswa → toast hijau *"Data siswa berhasil dihapus!"*
2. Baris hilang dari tabel (karena state lokal memang di-filter)
3. Database tidak berubah sama sekali
4. Setelah refresh, siswa tersebut **muncul kembali**

Hal yang sama berlaku untuk edit siswa dan hapus kunjungan. Untuk aplikasi rekam medis, "sudah dihapus/diubah padahal belum" adalah kelas bug yang serius.

*Perbaikan:* pakai `id` dari response server (`res.data.id`), dan kembalikan HTTP 404 ketika `affectedRows === 0`.

### 🟠 TINGGI

**#13 — Semua error API ditelan dalam catch kosong**
`frontend/src/context/DataContext.jsx:83-85, 97-99, 106-109, 122-125, 133-136`

```js
try {
  if (api && api.siswa) await api.siswa.create(newSiswa)
} catch (err) {
  // Saved in local state
}
```

Optimistic update tidak pernah di-rollback. Jika MySQL mati atau backend down, petugas tetap melihat konfirmasi hijau untuk setiap input, data hanya ada di memori, dan **hilang total saat halaman di-refresh** — tanpa peringatan apa pun. Komentar `// Saved in local state` menyiratkan ini disengaja, tapi `localStorage` yang ditulis (`STORAGE_KEYS`) tidak pernah dibaca kembali saat mount, jadi tidak ada mekanisme pemulihan offline yang benar-benar berfungsi.

**#14 — Endpoint laporan mengabaikan filter periode**
`controllers/laporanController.js:6-11`

```js
const bulan = req.query.bulan || new Date().getMonth() + 1
const tahun = req.query.tahun || new Date().getFullYear()
const [visits] = await pool.query('SELECT * FROM kunjungan')   // tanpa WHERE
```

`bulan`/`tahun` dibaca lalu dikembalikan di response, tapi query tidak pernah memfilter. Hasilnya total sepanjang masa yang **diberi label periode tertentu** — angka yang salah dengan tampilan meyakinkan. Endpoint ini juga menarik seluruh tabel ke memori hanya untuk menghitung dua angka; `COUNT(*)` dengan `WHERE` jauh lebih tepat. (Saat ini frontend belum memanggil endpoint ini, tapi tetap perlu diperbaiki.)

**#15 — Kunjungan tidak bisa diedit atau ditutup**
`routes/kunjunganRoutes.js` · `controllers/kunjunganController.js:20`

Kolom `waktu_keluar` ada di schema (`db/initDB.js:95`, `db/uks_digital.sql:54`) tetapi tidak pernah ditulis oleh INSERT, dan **tidak ada route PUT/PATCH** untuk kunjungan. Artinya:

- Siswa dengan status "Istirahat di UKS" tidak pernah bisa ditandai selesai
- Salah input keluhan hanya bisa diperbaiki dengan hapus + input ulang

Spesifikasi di `Preview, Prompt, and rules.md` baris 29 secara eksplisit meminta kolom **"Aksi (Detail/Edit)"** pada tabel riwayat.

### 🟡 SEDANG

**#16 — Persistensi localStorage yang tidak berguna**
`DataContext.jsx:34,45,62,68` — data ditulis ke `localStorage` di empat tempat tetapi tidak pernah dibaca saat inisialisasi state (`useState([])` di baris 23-24). Kode ini murni overhead; entah lengkapi jadi cache offline yang benar, atau hapus.

**#17 — Dependency array useEffect tidak lengkap**
`Pengaturan.jsx:66` — `useEffect(..., [])` padahal memakai `user` dan `updateUser`. Melanggar `react-hooks/exhaustive-deps` yang sudah dikonfigurasi di `frontend/eslint.config.js`.

---

## 5. Temuan — Arsitektur & Maintainability

### 🟠 TINGGI

**#18 — Dua jalur database, satu di antaranya dead code dengan schema berbeda**

`db/sqliteDB.js` **tidak di-import file mana pun**, tetapi memanggil `initSQLiteDB()` di module load (baris 112) sehingga akan membuat file DB begitu di-import. Yang lebih berbahaya: schema-nya sudah menyimpang — masih memakai kolom `email` (baris 23) sementara jalur MySQL sudah bermigrasi ke `username` (`initDB.js:35`). Dua definisi tabel `users` yang saling bertentangan di satu repo.

Ditambah lagi schema MySQL sendiri terdefinisi di **dua tempat** yang harus disinkronkan manual:
- `db/initDB.js` — dijalankan otomatis saat startup
- `db/uks_digital.sql` — untuk import manual phpMyAdmin

*Rekomendasi:* hapus `db/sqliteDB.js` beserta dependency `better-sqlite3`, dan jadikan `.sql` sebagai satu-satunya sumber kebenaran (atau generate dari sana).

**#19 — Validasi terduplikasi dan sudah menyimpang**

`AuthContext.jsx:7-14` dan `authController.js:9-17` mengimplementasikan `validateUsername` yang hampir identik. Backend punya satu cek tambahan yang tidak ada di frontend:

```js
const USERNAME_REGEX = /^[a-z][a-z0-9_]{3,19}$/
if (!USERNAME_REGEX.test(username)) return 'Format username tidak valid! ...'
```

Duplikasi ini sudah drift setelah beberapa commit, dan `pengaturanController.updatePetugas` bahkan tidak memakai keduanya (lihat #4).

### 🟡 SEDANG

**#20 — Lima dependency terpasang tanpa satu pun referensi**

| Package | Referensi di source | Maksud yang tersirat |
|---|---|---|
| `bcrypt@6.0.0` | 0 | Hashing password (Temuan #1) |
| `jsonwebtoken@9.0.3` | 0 | Token auth (Temuan #3) |
| `zod@4.4.3` | 0 | Validasi input (Temuan #9) |
| `multer@2.2.0` | 0 | Upload file — folder `uploads/` ada tapi tanpa route |
| `uuid@14.0.1` | 0 | — |

Kelimanya menandakan fitur yang direncanakan tapi berhenti di tahap instalasi. `JWT_SECRET` di `.env` memperkuat sinyal yang sama. Ini menyesatkan pembaca kode dan memperbesar surface area dependency tanpa manfaat.

**#21 — Hardcoded localhost menghalangi deployment**

- `app.js:24` — `res.redirect('http://localhost:5173/login')` di route `/`
- `vite.config.js:30` — PWA `runtimeCaching` mencocokkan `http://localhost:3000/api/*`, padahal `utils/api.js:1` memakai path relatif `/api`. Pola ini **tidak akan pernah cocok**, jadi caching API praktis mati.
- Express tidak pernah menyajikan `frontend/dist`, dan di produksi tidak ada Vite proxy — sehingga `/api` dari SPA hasil build tidak mengarah ke mana pun.

Belum ada cerita deployment yang utuh; aplikasi hanya berfungsi dalam mode dev dua-server.

**#22 — Komponen halaman terlalu besar dan mencampur beberapa tanggung jawab**

Dashboard (416), DataSiswa (410), Riwayat (399), Laporan (363) masing-masing menggabungkan turunan data, state form, handler, dan markup dengan string Tailwind panjang. Contoh: perhitungan `keluhanMap`/`top5KeluhanData` di `Dashboard.jsx:55-74` dan `kelasCount`/`keluhanCount` di `LaporanAnalitik.jsx:53-88` adalah logika agregasi yang mirip dan pantas diangkat ke custom hook (`useKunjunganStats`).

Fungsi `getStatusVariant` juga diduplikasi identik di `Dashboard.jsx:79-87` dan `RiwayatKunjungan.jsx` — kandidat langsung untuk `utils/formatters.js`.

### 🔵 RENDAH

**#23 — README memuat informasi yang tidak lagi akurat**

| Klaim README | Kondisi sebenarnya |
|---|---|
| "Validasi domain email resmi sekolah (`@sdn05parambahan.id`)" (baris 15) | Auth berbasis **username**; kolom `email` sudah dihapus dari schema MySQL |
| Tabel akun demo dengan kolom **Email** (baris 74-76) | Kolom email tidak ada; login memakai `siti_rahmawati` |
| "MySQL2 (Connection Pool with **Failover**)" (baris 43) | Tidak ada mekanisme failover apa pun di `db/db.js` |
| Struktur direktori (baris 82-99) | Tidak menyebut `context/`, `hooks/`, `components/layout/` |

**#24 — `.gitignore` mengecualikan seluruh dokumentasi**

```
*.md
!README.md
```

Pola ini membuat `penjelasan_struktur_project.md`, `Preview, Prompt, and rules.md`, dan file analisis ini **tidak terlacak Git**. Bila dokumentasi memang ingin disimpan, aturannya perlu dipersempit (mis. hanya abaikan `*.local.md`).

**#25 — Tidak ada test, CI, linting backend, maupun `.env.example`**

Tidak ada satu pun test di repo. ESLint hanya dikonfigurasi di `frontend/`; backend tanpa linter. `.env` (dengan benar) tidak di-commit, tetapi tidak ada `.env.example` sehingga kontributor baru harus menebak variabel yang dibutuhkan (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `JWT_SECRET`, `PORT`).

---

## 6. Hal yang Sudah Dikerjakan dengan Baik

Layak dipertahankan saat refactor:

1. **Pemisahan lapisan backend konsisten** — router tipis, controller fokus, satu titik akses DB. Menambah entitas baru hanya perlu mengikuti pola yang sudah ada.
2. **Seluruh query memakai parameterized statement.** Tidak ditemukan satu pun titik SQL injection — semua nilai lewat placeholder `?`, termasuk pada path yang menerima input pengguna langsung.
3. **Envelope response seragam** `{ success, message, data }` di semua endpoint, membuat penanganan di `utils/api.js` sederhana dan konsisten.
4. **Inisialisasi schema idempoten** — `CREATE TABLE IF NOT EXISTS` plus guard `COUNT(*) === 0` sebelum seeding; aman dijalankan berulang. Setup sekali jalan tanpa langkah manual.
5. **Constraint database yang bermakna** — `ENUM` pada `status` dan `jenis_kelamin`, `UNIQUE` pada `nis`/`nip`/`username`, index pada `kelas`, `nama`, `waktu_masuk`, `status`. Menunjukkan pemahaman akan pola query yang akan dipakai.
6. **Password tidak pernah dikirim balik ke klien** — `authController.js:52`:
   ```js
   const { password: _, ...userData } = user
   ```
   Praktik yang benar; sayangnya tertutupi masalah plaintext di #1.
7. **Empty state ditangani serius** — `hasKelasData`, `hasKeluhanData`, `recentVisits.length > 0`, masing-masing dengan ikon, judul, dan petunjuk aksi berikutnya. Ini sering diabaikan project sejenis.
8. **Denormalisasi `kunjungan` yang tepat secara domain** — riwayat kesehatan mempertahankan data siswa saat kejadian, tidak ikut berubah ketika master data diperbarui.
9. **Komponen reusable yang matang** — `CustomSelect`, `DatePicker` (dengan navigasi bulan + pemilih jam), `DataTable` (kolom + custom render), `Modal`, `Toast` via context, `SearchAutocomplete`. Sistem UI yang koheren, bukan sekadar kumpulan komponen ad-hoc.
10. **PWA dan cetak PDF sudah lengkap** — manifest, ikon maskable, service worker, kelas `no-print`, `PrintReportTemplate` A4 dengan kop surat dan lembar pengesahan. Fitur yang benar-benar dibutuhkan untuk laporan ke Dinas Pendidikan.
11. **Migrasi schema in-place di `initDB.js:44-57`** — mendeteksi kolom `email` lama dan memigrasikannya ke `username` sambil mempertahankan data. Pemikiran yang bagus untuk instalasi yang sudah berjalan.

---

## 7. Prioritas Perbaikan

### Tahap 1 — Blocker (lakukan sebelum menyentuh data siswa asli)

| # | Perbaikan | File | Est. |
|---|---|---|---|
| 1 | Hash password dengan bcrypt (register + login + migrasi data lama) | `authController.js` | 1–2 jam |
| 10 | Ganti import mockData → `useData()` di halaman Laporan | `LaporanAnalitik.jsx:31` | 15 menit |
| 11 | Pakai `id` dari response server, jangan `Date.now()` | `DataContext.jsx`, `PendaftaranKunjungan.jsx` | 1 jam |
| 12 | Cek `affectedRows`, kembalikan 404 bila 0 | 3 controller | 30 menit |
| 5 | Keluarkan `*.db` dari Git + `.gitignore` | `.gitignore` | 10 menit |

### Tahap 2 — Keamanan inti

| # | Perbaikan | File | Est. |
|---|---|---|---|
| 2, 3 | JWT + middleware `requireAuth` pada semua route non-auth | route baru + `middleware/auth.js` | 3–4 jam |
| 4 | Ambil `userId` dari token, bukan header `X-User-Id` | `pengaturanController.js` | 30 menit |
| 8 | Pesan error generik ke klien, detail hanya ke log server | semua controller | 45 menit |
| 9 | Skema validasi zod untuk semua body request | controller + `schemas/` | 2–3 jam |
| 7 | Rate limit pada `/api/auth/login` | `authRoutes.js` | 30 menit |
| 6 | Tentukan role secara eksplisit, jangan dari panjang NIP | `authController.js:98` | 20 menit |

### Tahap 3 — Kelengkapan fungsional

| # | Perbaikan | Est. |
|---|---|---|
| 15 | Endpoint `PUT /api/kunjungan/:id` + tombol Edit & tutup `waktu_keluar` | 2–3 jam |
| 13 | Rollback optimistic update + toast error saat API gagal | 1–2 jam |
| 14 | Filter `WHERE` periode di endpoint laporan, ganti ke `COUNT(*)` | 45 menit |
| — | Sambungkan filter bulan/tahun di UI Laporan ke data | 1 jam |

### Tahap 4 — Kualitas & kesiapan produksi

| # | Perbaikan | Est. |
|---|---|---|
| 18 | Hapus `db/sqliteDB.js` + `better-sqlite3`; satu sumber schema | 30 menit |
| 20 | Hapus dependency tak terpakai, atau implementasikan | 20 menit |
| 19 | Satukan aturan validasi username (satu modul bersama) | 45 menit |
| 21 | Serve `frontend/dist` dari Express, hapus URL hardcoded | 1–2 jam |
| 22 | Ekstrak agregasi ke `useKunjunganStats`, `getStatusVariant` ke utils | 2 jam |
| 25 | `.env.example`, ESLint backend, test dasar untuk controller | 3–4 jam |
| 23 | Perbarui README agar sesuai kondisi kode | 30 menit |

---

## 8. Catatan Penutup

Fondasi project ini kuat: struktur konsisten, komponen UI matang, dan pemodelan data menunjukkan pemahaman domain yang baik — terutama keputusan denormalisasi pada tabel `kunjungan` dan penanganan empty state di seluruh halaman.

Yang belum ada adalah **lapisan pengamanan dan lapisan verifikasi**. Autentikasi berhenti di tampilan visual (halaman login yang rapi, tanpa penegakan di server), dan operasi tulis berhenti di optimistic update (UI melaporkan sukses, tanpa memastikan server benar-benar melakukannya). Kedua pola ini punya gejala yang sama dan berbahaya: **aplikasi terlihat bekerja sempurna sampai seseorang memeriksa databasenya.**

Untuk aplikasi yang menyimpan rekam kesehatan siswa sekolah dasar, Tahap 1 dan 2 sebaiknya diselesaikan sebelum sistem dipakai mencatat data siswa yang sesungguhnya.

---

> ⚠️ **Catatan:** `.gitignore` project ini memuat pola `*.md` dengan pengecualian hanya untuk `README.md`, sehingga file ini **tidak akan terlacak oleh Git**. Bila ingin menyimpannya di repo, jalankan `git add -f ANALISIS_PROJECT.md` atau perbaiki aturan `.gitignore` (Temuan #24).
