# ANALISIS MENDALAM — UKS DIGITAL SDN 05 PARAMBAHAN

> Dokumen ini dibuat setelah membaca **seluruh** file kode di project (backend + frontend, di luar `node_modules`) dan memverifikasi setiap klaim dengan pencarian langsung ke dalam kode. Setiap temuan disertai lokasi file dan nomor baris supaya bisa Anda cek sendiri.
>
> Tanggal analisis: **4 Agustus 2026** · Branch: `main` · Commit terakhir: `4bdcac0 perbaiki tampilan`

---

## CARA MEMBACA DOKUMEN INI

Dokumen ini panjang. Kalau waktu Anda terbatas, baca dengan urutan ini:

| Kalau Anda ingin… | Lompat ke |
|---|---|
| Tahu kondisi project dalam 2 menit | [Ringkasan Eksekutif](#ringkasan-eksekutif) |
| Paham sistem ini sebenarnya apa | [Bagian 1 — Pemahaman Sistem](#bagian-1--pemahaman-sistem) |
| Lihat gambaran besar alur data | [Bagian 2 — Peta Arsitektur](#bagian-2--peta-arsitektur--alur-data) |
| Bedah backend baris per baris | [Bagian 3 — Backend](#bagian-3--backend-dibedah) |
| Paham database & file `.sql` | [Bagian 4 — Database](#bagian-4--database--file-sql-dibedah) |
| Lihat daftar semua endpoint | [Bagian 5 — Routes](#bagian-5--routes-lengkap) |
| Paham hubungan MVC | [Bagian 6 — MVC Relations](#bagian-6--mvc-relations-di-mana-huruf-m-nya) |
| Bedah frontend | [Bagian 7 — Frontend](#bagian-7--frontend-dibedah) |
| Lihat semua bug terurut prioritas | [Bagian 8 — Daftar Temuan](#bagian-8--daftar-temuan-terurut-prioritas) |
| Langsung ke solusi + kodenya | [Bagian 9 — Solusi Praktis](#bagian-9--solusi-praktis--alasan-logisnya) |
| Tahu harus mulai dari mana besok | [Bagian 10 — Roadmap](#bagian-10--roadmap-bertahap) |

Istilah teknis selalu saya jelaskan dengan analogi sederhana di dalam kotak seperti ini:

> 🧠 **Analogi:** penjelasan sederhana ada di sini.

---

## RINGKASAN EKSEKUTIF

**Kondisi singkat:** Project ini **sudah jadi secara tampilan, tapi belum jadi secara sistem.** Semua 7 halaman ada, desainnya rapi, database sudah terbentuk, endpoint sudah ada. Tetapi ada 3 lapisan masalah yang membuat aplikasi ini **belum layak dipakai untuk menyimpan data kesehatan siswa sungguhan**.

### Tiga masalah terbesar (kalau hanya boleh pilih 3)

**1. Halaman Laporan & Analitik selalu kosong — permanen.**
File `frontend/src/pages/LaporanAnalitik.jsx:31` mengambil data dari `mockData` (array kosong) bukan dari database. Jadi berapa pun kunjungan yang Anda catat, halaman Laporan akan **selalu** menampilkan angka 0 dan grafik kosong. PDF yang diekspor pun kosong. Ini bug paling terlihat oleh pengguna.

**2. Semua data siswa bisa diakses siapa pun tanpa login.**
Tidak ada satu pun *middleware* pengaman di seluruh backend (sudah saya cek semua file route dan `app.js`). Artinya siapa pun yang tahu alamat servernya bisa membuka `http://<server>:3000/api/siswa` di browser dan langsung mendapat **seluruh data siswa beserta nama & telepon wali** — tanpa username, tanpa password. Halaman login hanya "gerbang" di sisi tampilan, bukan di sisi server.

**3. Password disimpan sebagai teks biasa.**
Password `admin` tersimpan apa adanya di database (`db/uks_digital.sql:29`), dan saat login dibandingkan langsung dengan `if (user.password !== password)` (`controllers/authController.js`). Library `bcrypt` sudah terpasang di `package.json` tapi **tidak pernah dipakai sama sekali** — saya cek dengan pencarian, kata "bcrypt" hanya muncul di `package.json` dan `package-lock.json`, nol kali di kode.

### Angka-angka hasil audit

| Aspek | Hasil |
|---|---|
| Total file sumber dibaca | 45+ file (backend + frontend) |
| Endpoint API tersedia | 13 |
| Endpoint yang dilindungi autentikasi | **0** |
| Endpoint yang dipakai frontend | 9 dari 13 |
| Tabel database | 4 (`users`, `siswa`, `kunjungan`, `pengaturan_sekolah`) |
| Sumber definisi skema yang saling berbeda | **3** (`uks_digital.sql`, `initDB.js`, `sqliteDB.js`) |
| FOREIGN KEY antar tabel | **0** |
| Lapisan Model (MVC) | **Tidak ada** |
| Lapisan validasi input | **Tidak ada** (padahal `zod` sudah terpasang) |
| Dependency terpasang tapi tidak dipakai | **5** (`bcrypt`, `jsonwebtoken`, `multer`, `uuid`, `zod`) |
| File kode mati (tidak pernah di-*import*) | 3 (`db/sqliteDB.js`, `frontend/src/App.css`, `frontend/src/hooks/useApi.js`) |
| Total temuan yang saya catat | **109** (lihat [Bagian 8](#bagian-8--daftar-temuan-terurut-prioritas)) |

### Penilaian per lapisan

| Lapisan | Nilai | Alasan singkat |
|---|---|---|
| Tampilan / UI | 🟡 **Cukup** | Komponen dipisah rapi, tapi migrasi tema berhenti di tengah → judul tak terlihat di 5 halaman |
| Struktur folder | 🟢 **Baik** | Pemisahan `routes`/`controllers`/`db` sudah benar dan mudah dipahami |
| Backend API | 🟡 **Cukup** | Jalan, tapi tanpa validasi, tanpa pagination, `laporan` masih setengah jadi |
| Alur data frontend | 🔴 **Bermasalah** | Error ditelan diam-diam, ID dibuat di klien, Laporan pakai data palsu |
| Database | 🟡 **Cukup** | Skema wajar, tapi 3 sumber berbeda + tanpa FOREIGN KEY |
| Keamanan | 🔴 **Kritis** | Tanpa autentikasi server, password teks biasa, identitas bisa dipalsukan |
| Kesesuaian dengan spesifikasi | 🟡 **Cukup** | Beberapa permintaan di `Preview, Prompt, and rules.md` belum terpenuhi |

### Kabar baiknya

Semua masalah di atas **bisa diperbaiki tanpa membongkar struktur folder** (sesuai aturan project Anda: *"anda tidak boleh mengubah struktur folder saat ini"*). Perbaikan paling kritis — bug halaman Laporan — hanya butuh **mengubah 3 baris kode**. Detailnya ada di [Bagian 9](#bagian-9--solusi-praktis--alasan-logisnya).

Dan yang penting dicatat: **banyak temuan di dokumen ini adalah "pekerjaan yang berhenti di tengah jalan", bukan kesalahan konsep.** Contohnya:

| Yang sudah disiapkan pengembang | Yang belum tersambung |
|---|---|
| `bcrypt` terpasang, kolom `password VARCHAR(255)` sudah pas untuk hash | Belum dipakai — password masih teks biasa |
| `jsonwebtoken` terpasang, `JWT_SECRET` sudah ada di `.env` | Belum pernah dipanggil |
| `zod` terpasang | Belum ada validasi sama sekali |
| `getGreeting()` sudah ditulis lengkap di `formatters.js` | Belum dipanggil di Dashboard |
| Kolom `waktu_keluar` sudah ada di skema | Belum ada endpoint untuk mengisinya |
| `hooks/useApi.js` menyediakan `loading`/`error` | Belum dipakai — `DataContext` justru butuh ini |
| Endpoint `GET /api/laporan` sudah ada | Belum pernah dipanggil frontend |
| Font Plus Jakarta Sans sudah dimuat di `index.html` | Belum tersambung ke Tailwind (`@theme` kosong) |

**Ini kabar baik.** Fondasinya sudah benar; yang dibutuhkan adalah **menyambungkan** yang sudah ada, bukan membangun dari nol.

---

# BAGIAN 1 — PEMAHAMAN SISTEM

Sebelum membahas bug dan solusi, saya perlu memastikan pemahaman saya tentang sistem ini **benar dan sama dengan pemahaman Anda**. Kalau di bagian ini ada yang salah, tolong koreksi — karena semua analisis setelahnya bertumpu pada pemahaman ini.

## 1.1 Masalah dunia nyata yang ingin diselesaikan

Di sekolah dasar, ada ruang **UKS (Unit Kesehatan Sekolah)**. Ketika ada siswa sakit — pusing, mimisan, jatuh saat olahraga, sakit perut — siswa itu dibawa ke UKS. Petugas UKS (biasanya seorang guru yang ditugaskan) memberi pertolongan pertama, lalu **mencatatnya di buku besar**.

Buku fisik itu punya masalah yang nyata:

| Masalah buku fisik | Akibatnya |
|---|---|
| Tulisan tangan sering tidak terbaca | Riwayat siswa jadi tidak berguna saat dibutuhkan |
| Mencari riwayat 1 siswa = membolak-balik ratusan halaman | Petugas tidak tahu bahwa Andi sudah 5x pusing bulan ini |
| Tidak bisa dihitung otomatis | Sekolah tidak tahu penyakit apa yang paling sering muncul |
| Membuat laporan bulanan = menghitung manual | Butuh berjam-jam, sering salah hitung |
| Buku bisa hilang, basah, rusak | Data hilang permanen |
| Hanya ada satu buku, satu tempat | Kepala sekolah tidak bisa lihat data tanpa minta bukunya |

**Sistem ini adalah versi digital dari buku besar itu.** Tujuannya bukan menggantikan petugas UKS, tapi menghilangkan 6 masalah di atas.

## 1.2 Siapa saja yang memakainya

Dari kode, saya menemukan sistem ini mengenal **2 jenis pengguna** — dan ini ditentukan dengan cara yang cukup mengejutkan.

Di `controllers/authController.js`, saat seseorang mendaftar:

```js
const isDokterKecil = nip.length <= 10
```

> 🧠 **Artinya:** peran pengguna ditentukan dari **panjang NIP**. Kalau NIP-nya 10 karakter atau kurang → dia dianggap "Dokter Kecil". Kalau lebih panjang → dia "Petugas UKS".

**Alasan di balik logika ini** (masuk akal, tapi rapuh): NIP guru PNS Indonesia formatnya 18 digit (contoh: `198507152010012003` — tanggal lahir + tahun masuk + kode). Sedangkan "Dokter Kecil" adalah **siswa** yang dilatih membantu di UKS — siswa tidak punya NIP, jadi kemungkinan dia mengisi NIS-nya (biasanya 4–10 digit).

Jadi dua peran itu:

| Peran | Siapa | Cara sistem mengenali |
|---|---|---|
| **Petugas UKS** | Guru yang bertanggung jawab atas UKS | NIP > 10 karakter |
| **Dokter Kecil** | Siswa terlatih yang membantu di UKS | NIP ≤ 10 karakter |

⚠️ **Masalahnya:** peran ini hanya jadi **label**. Saya sudah cek seluruh kode — **tidak ada satu pun tempat** yang membedakan hak akses Petugas UKS dan Dokter Kecil. Seorang Dokter Kecil (yang notabene siswa kelas 5) bisa menghapus seluruh data siswa, mengubah data sekolah, dan melihat semua rekam kesehatan temannya. Ini akan saya bahas di [Bagian 9](#bagian-9--solusi-praktis--alasan-logisnya).

Ada juga peran ketiga yang **disebut di spesifikasi tapi tidak ada di kode**: **Kepala Sekolah**. Di `components/common/PrintReportTemplate.jsx` ada tanda tangan kepala sekolah di laporan cetak, dan di tabel `pengaturan_sekolah` ada kolom `kepala_sekolah` — tapi tidak ada akun kepala sekolah. Kepala sekolah hanya "menerima laporan cetak", tidak login.

## 1.3 Alur kerja nyata di ruang UKS

Ini yang paling penting untuk dipahami. Saya rekonstruksi alur ini dari kode `pages/PendaftaranKunjungan.jsx` dan struktur tabel `kunjungan`:

```
                    ┌──────────────────────────────┐
                    │  Siswa datang ke UKS         │
                    │  (mengeluh sakit)            │
                    └──────────────┬───────────────┘
                                   ▼
                    ┌──────────────────────────────┐
     LANGKAH 1      │  Petugas cari nama siswa     │  ← SearchAutocomplete
     (identifikasi) │  Ketik "And..." → muncul      │     mencari ke tabel siswa
                    │  "Andi Putra - Kelas 4"       │
                    └──────────────┬───────────────┘
                                   ▼
                    ┌──────────────────────────────┐
     LANGKAH 2      │  Pilih keluhan (bisa banyak) │  ← TagSelector
     (diagnosa)     │  ☑ Pusing  ☑ Demam            │     15 pilihan dari mockData
                    │  + catatan bebas             │
                    └──────────────┬───────────────┘
                                   ▼
                    ┌──────────────────────────────┐
     LANGKAH 3      │  Pilih tindakan              │  ← TagSelector
     (penanganan)   │  ☑ Istirahat  ☑ Minum obat    │     10 pilihan
                    │  ☐ Tandai DARURAT             │  ← toggle is_darurat
                    └──────────────┬───────────────┘
                                   ▼
                    ┌──────────────────────────────┐
     LANGKAH 4      │  Tentukan status akhir       │  ← CustomSelect
     (keputusan)    │  ○ Kembali ke Kelas           │     4 pilihan = ENUM di DB
                    │  ● Istirahat di UKS           │
                    │  ○ Dijemput Wali              │
                    │  ○ Dirujuk ke Klinik          │
                    └──────────────┬───────────────┘
                                   ▼
                    ┌──────────────────────────────┐
                    │  SIMPAN → masuk tabel        │
                    │  kunjungan + muncul di        │
                    │  Riwayat, Dashboard, Laporan  │
                    └──────────────────────────────┘
```

**Empat langkah ini adalah inti dari seluruh aplikasi.** Semua halaman lain hanya "melayani" alur ini:

- **Data Siswa** — mengisi "kamus" agar Langkah 1 bisa mencari nama
- **Riwayat Kunjungan** — melihat kembali hasil dari Langkah 1–4
- **Dashboard** — merangkum hasil Langkah 1–4 dalam angka & grafik
- **Laporan Analitik** — merangkum untuk dicetak & diserahkan ke kepala sekolah
- **Pengaturan** — mengubah identitas petugas & sekolah yang muncul di laporan

## 1.4 Empat tabel dan mengapa ada empat

Setiap tabel menjawab satu pertanyaan berbeda:

| Tabel | Menjawab pertanyaan | Sifat data |
|---|---|---|
| `users` | *"Siapa yang boleh memakai sistem ini?"* | Jarang berubah (1–5 baris) |
| `siswa` | *"Siapa saja siswa di sekolah ini?"* | Berubah per tahun ajaran (~150–300 baris) |
| `kunjungan` | *"Apa yang terjadi di UKS hari ini?"* | **Tumbuh terus** (bisa ribuan baris) |
| `pengaturan_sekolah` | *"Sekolah ini identitasnya apa?"* | **Selalu 1 baris**, hampir tidak berubah |

> 🧠 **Analogi:** bayangkan lemari arsip dengan 4 laci.
> - Laci **users** = daftar orang yang punya kunci lemari
> - Laci **siswa** = buku induk siswa (daftar nama semua murid)
> - Laci **kunjungan** = buku besar UKS, tiap halaman = satu kejadian
> - Laci **pengaturan_sekolah** = satu lembar kop surat sekolah

## 1.5 Hubungan antar tabel (dan keputusan desain yang penting)

```
   ┌─────────────┐
   │   users     │   Tidak terhubung ke tabel lain sama sekali.
   │  (petugas)  │   Hanya untuk login. Sistem TIDAK mencatat
   └─────────────┘   "siapa petugas yang menangani kunjungan ini".
                     ⚠️ Ini celah audit — dibahas di Temuan #23

   ┌─────────────┐         ┌──────────────────────────────┐
   │   siswa     │ 1 ───→ N│        kunjungan             │
   │             │         │                              │
   │ id  (PK)    │ ·······>│ siswa_id      ← relasi lemah │
   │ nis         │ ┄COPY┄─>│ siswa_nis     ← SALINAN      │
   │ nama        │ ┄COPY┄─>│ siswa_nama    ← SALINAN      │
   │ kelas       │ ┄COPY┄─>│ kelas         ← SALINAN      │
   └─────────────┘         └──────────────────────────────┘
                            ↑
                     Titik-titik (·····) artinya:
                     TIDAK ada FOREIGN KEY di database.
                     Relasi hanya "kesepakatan", tidak dipaksakan.
```

**Ada dua keputusan desain di sini yang harus Anda pahami:**

### Keputusan A — Data siswa disalin ke tabel kunjungan (denormalisasi)

Perhatikan bahwa `kunjungan` menyimpan `siswa_nama`, `siswa_nis`, dan `kelas` — padahal informasi itu **sudah ada** di tabel `siswa`.

Dalam pelajaran database, ini biasanya disebut "salah" (namanya *denormalisasi* — data ganda). Tapi di sini **ini justru keputusan yang tepat**, dan alasannya sangat masuk akal untuk kasus sekolah:

> **Bayangkan:** Andi kelas 4 berkunjung ke UKS bulan September 2025. Bulan Juli 2026 Andi naik ke kelas 5, jadi data di tabel `siswa` diubah: `kelas` = 5.
>
> - **Kalau data TIDAK disalin:** laporan September 2025 akan berubah sendiri jadi "Andi — Kelas 5". Padahal saat itu dia kelas 4. **Laporan lama jadi salah.**
> - **Kalau data DISALIN (seperti sekarang):** laporan September 2025 tetap berbunyi "Andi — Kelas 4". **Benar secara historis.**

Ini prinsip yang sama dipakai di sistem kasir: struk belanja mencatat *harga saat itu*, bukan menunjuk ke tabel harga yang bisa berubah besok. **Jadi desain ini sudah benar** — hanya belum didokumentasikan, sehingga programmer berikutnya bisa salah menganggapnya bug lalu "memperbaikinya" dan justru merusak laporan historis.

### Keputusan B — `siswa_id` boleh kosong, dan tanpa FOREIGN KEY

Di semua definisi skema, `siswa_id INT` — tanpa `NOT NULL`, tanpa `REFERENCES siswa(id)`.

**Sisi baiknya:** petugas bisa mencatat kunjungan siswa yang belum terdaftar di database (siswa baru pindahan, tamu, atau saat sedang darurat dan tidak ada waktu mendaftarkan dulu). Dalam keadaan darurat medis, **memaksa petugas mendaftarkan siswa dulu sebelum bisa mencatat pertolongan adalah desain yang berbahaya.** Jadi fleksibilitas ini benar.

**Sisi buruknya:** tanpa FOREIGN KEY, database tidak akan mencegah `siswa_id = 9999` padahal siswa 9999 tidak pernah ada. Dan kalau siswa dihapus, `siswa_id` di kunjungan menjadi menggantung (*orphan*). Solusi untuk mendapat kedua sisi baik ada di [Solusi #7](#solusi-7--satukan-sumber-skema--tambah-integritas-yang-aman).

## 1.6 Teknologi yang dipakai dan mengapa

| Bagian | Teknologi | Fungsi dalam bahasa sederhana |
|---|---|---|
| Server | **Node.js + Express 5** | "Pelayan" yang menerima permintaan dan menjawab |
| Database | **MySQL / MariaDB** | "Lemari arsip" tempat data disimpan permanen |
| Penghubung DB | **mysql2/promise** | "Penerjemah" antara kode JavaScript dan MySQL |
| Tampilan | **React 19** | Membangun antarmuka dari komponen kecil yang bisa dipakai ulang |
| Build tool | **Vite 8** | "Tukang bangun" yang mengubah kode jadi file siap pakai + server dev |
| Navigasi | **React Router v7** | Mengatur halaman mana yang muncul untuk URL apa |
| Styling | **Tailwind CSS v4** | Menulis gaya visual langsung di dalam HTML |
| Grafik | **Recharts 3** | Menggambar diagram batang, garis, dan pie |
| Ikon | **lucide-react** | Kumpulan ikon (stetoskop, kalender, dll.) |
| Ekspor PDF | **html2pdf.js** | Mengubah tampilan HTML jadi file PDF A4 |
| Offline | **vite-plugin-pwa** | Membuat aplikasi bisa di-*install* & dibuka tanpa internet |

> 🧠 **Kenapa gabungan ini masuk akal untuk sekolah?** Semuanya bisa jalan di **satu komputer di ruang UKS** tanpa perlu menyewa server internet. MySQL bisa dari XAMPP/Laragon yang umum di lingkungan sekolah Indonesia. Dan karena berbasis web, kalau nanti komputer UKS dihubungkan ke jaringan sekolah, kepala sekolah bisa membukanya dari ruangannya tanpa instalasi apa pun. Pilihan teknologi di project ini **tepat untuk konteksnya.**

## 1.7 Ringkasan pemahaman saya dalam satu paragraf

> **UKS Digital adalah aplikasi web satu-sekolah untuk menggantikan buku catatan kunjungan UKS.** Petugas UKS login dengan *username*, mendaftarkan data induk siswa sekali di awal tahun, lalu setiap kali ada siswa sakit ia mencatat kunjungan melalui alur 4 langkah (siapa → keluhan apa → ditindak apa → statusnya bagaimana). Data itu masuk ke satu tabel `kunjungan` yang tumbuh terus. Dari tabel itu, sistem otomatis menghitung ringkasan untuk **Dashboard** (pantauan harian) dan **Laporan Analitik** (rekap bulanan yang bisa dicetak/PDF untuk kepala sekolah). Sistem ini **sengaja dirancang lokal & sederhana** — satu sekolah, satu database, tanpa cloud, bisa dipakai offline — dan itu adalah keputusan yang tepat. Yang belum selesai adalah **lapisan keamanan di sisi server** dan **penyambungan data yang benar di halaman Laporan.**

---

# BAGIAN 2 — PETA ARSITEKTUR & ALUR DATA

## 2.1 Struktur folder lengkap (dengan penjelasan tiap file)

```
D:\ukssdkkn\
│
├── server.js ................. PINTU MASUK backend. Dijalankan pertama.
├── app.js .................... Perakitan Express + TABEL ROUTING utama.
├── package.json .............. Daftar dependency backend + script npm.
├── .env ...................... Konfigurasi rahasia (DB, port). TIDAK di-git. ✅
├── .gitignore ................ ⚠️ Berisi `*.md` — file analisis ini tidak akan di-git.
├── README.md ................. ⚠️ Sudah kedaluwarsa (masih tulis login pakai email).
├── Preview, Prompt, and rules.md .. Spesifikasi asli + aturan project.
│
├── db/ ....................... LAPISAN DATABASE
│   ├── db.js ................. Membuat connection pool MySQL. Dipakai semua controller.
│   ├── initDB.js ............. Membuat database + 4 tabel otomatis saat server nyala.
│   ├── uks_digital.sql ....... Dump SQL untuk import manual (phpMyAdmin).
│   ├── sqliteDB.js ........... ☠️ KODE MATI. Tidak pernah di-import siapa pun.
│   ├── uks_digital.db ........ ☠️ Sisa file SQLite lama (36 KB).
│   ├── uks_digital.db-shm .... ☠️ Sisa file SQLite lama (belum di-commit).
│   └── uks_digital.db-wal .... ☠️ Sisa file SQLite lama (belum di-commit).
│
├── routes/ ................... LAPISAN ROUTE — "papan penunjuk arah"
│   ├── authRoutes.js ......... POST /login, POST /register
│   ├── siswaRoutes.js ........ GET, POST, PUT /:id, DELETE /:id
│   ├── kunjunganRoutes.js .... GET, POST, DELETE /:id  ⚠️ tidak ada PUT
│   ├── laporanRoutes.js ...... GET /
│   └── pengaturanRoutes.js ... GET /, PUT /petugas, PUT /sekolah
│
├── controllers/ .............. LAPISAN CONTROLLER — "otak" pemroses
│   ├── authController.js ..... Login & registrasi. ⚠️ password teks biasa.
│   ├── siswaController.js .... CRUD siswa.
│   ├── kunjunganController.js  Baca, tambah, hapus kunjungan.
│   ├── laporanController.js .. ⚠️ Masih setengah jadi (abaikan filter bulan/tahun).
│   └── pengaturanController.js Profil petugas & data sekolah.
│
├── Mock-ups/ ................. 11 gambar PNG rancangan desain (referensi visual).
├── uploads/ .................. Folder kosong (disiapkan untuk foto, belum dipakai).
├── .cursor/ .................. Folder kosong.
│
└── frontend/ ................. APLIKASI REACT (project terpisah, package.json sendiri)
    ├── index.html ............ Kerangka HTML + pemuatan font Google. ✅
    ├── vite.config.js ........ Proxy /api → :3000 + konfigurasi PWA.
    ├── package.json .......... Dependency frontend.
    ├── public/ ............... manifest.json, ikon PWA.
    └── src/
        ├── main.jsx .......... Menempelkan React ke <div id="root">.
        ├── App.jsx ........... Susunan Provider + definisi semua rute halaman.
        ├── index.css ......... Tailwind + gaya glassmorphism + latar gelap.
        ├── App.css ........... ☠️ KODE MATI. Sisa template Vite, tidak di-import.
        │
        ├── context/ .......... "GUDANG DATA BERSAMA" antar halaman
        │   ├── AuthContext.jsx ... Siapa yang login (disimpan di sessionStorage).
        │   ├── DataContext.jsx ... Daftar siswa & kunjungan. ⚠️ banyak masalah.
        │   └── (ToastContext ada di dalam components/common/Toast.jsx)
        │
        ├── pages/ ........... 7 HALAMAN
        │   ├── Login.jsx .......... ⚠️ tema terang, typo nama sekolah, tanpa link daftar.
        │   ├── Register.jsx ....... Tema gelap, checklist aturan username. ✅
        │   ├── Dashboard.jsx ...... Ringkasan + 2 grafik. ⚠️ hitungan bukan "hari ini".
        │   ├── PendaftaranKunjungan.jsx  Form alur 4 langkah.
        │   ├── RiwayatKunjungan.jsx      Tabel + cari + ekspor CSV/PDF.
        │   ├── DataSiswa.jsx ............ CRUD siswa lengkap.
        │   ├── LaporanAnalitik.jsx ...... 🔴 BUG TERBESAR: pakai data palsu kosong.
        │   └── Pengaturan.jsx ........... Ubah profil petugas & data sekolah.
        │
        ├── components/
        │   ├── layout/
        │   │   ├── AppLayout.jsx .. Kerangka: Sidebar + Topbar + isi halaman.
        │   │   ├── Sidebar.jsx .... Menu 6 item + tombol logout (tema terang).
        │   │   ├── Topbar.jsx ..... Judul halaman + avatar pengguna (tema terang).
        │   │   └── PageHeader.jsx . 🔴 Tema GELAP di dalam layout TERANG → tak terlihat.
        │   └── common/
        │       ├── StatCard.jsx ......... Kartu angka. ⚠️ varian "success" tidak ada.
        │       ├── DataTable.jsx ........ Tabel generik.
        │       ├── Modal.jsx ............ Jendela pop-up.
        │       ├── Badge.jsx ........... Label status berwarna.
        │       ├── Toast.jsx ........... Notifikasi. 🔴 varian error tanpa warna latar.
        │       ├── CustomSelect.jsx .... Dropdown custom via React Portal.
        │       ├── TagSelector.jsx ..... Pilih banyak keluhan/tindakan.
        │       ├── SearchAutocomplete.jsx  Cari siswa saat mengetik.
        │       └── PrintReportTemplate.jsx ⚠️ kop surat & NIP di-hardcode.
        │
        ├── utils/
        │   ├── api.js ........ Semua pemanggilan ke backend. ⚠️ tidak ada namespace laporan.
        │   └── formatters.js . Format tanggal, inisial nama, warna avatar.
        │
        ├── hooks/
        │   └── useApi.js ..... ☠️ KODE MATI. Tidak dipakai halaman mana pun.
        │
        └── data/
            └── mockData.js ... Pilihan keluhan/tindakan/status/kelas
                                + 🔴 siswaList & kunjunganList KOSONG yang jadi sumber bug.
```

## 2.2 Diagram arsitektur tiga lapis

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  LAPIS 1 — BROWSER (React, port 5173 saat pengembangan)                   ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║   ┌───────────────────────────────────────────────────────────────┐       ║
║   │ ToastProvider  (notifikasi)                                   │       ║
║   │ └─ AuthProvider  (siapa yang login → sessionStorage)          │       ║
║   │    └─ DataProvider  (siswaList, kunjunganList → localStorage) │       ║
║   │       └─ BrowserRouter                                        │       ║
║   │          ├─ /login, /register   ..... PublicOnlyRoute         │       ║
║   │          └─ /, /pendaftaran, ...      ProtectedRoute          │       ║
║   │             └─ AppLayout (Sidebar + Topbar + <Outlet/>)       │       ║
║   └───────────────────────────────────────────────────────────────┘       ║
║                                                                           ║
║   Penyimpanan di browser:                                                 ║
║   • sessionStorage: "uks_user"  → hilang saat tab ditutup                 ║
║   • localStorage:   "uks_siswa_data_clean"     ⚠️ bisa beda dgn MySQL     ║
║                     "uks_kunjungan_data_clean" ⚠️ bisa beda dgn MySQL     ║
║                                                                           ║
╚════════════════════════════════════╤══════════════════════════════════════╝
                                     │
                       fetch('/api/...')  ← alamat RELATIF
                       + header: X-User-Id: <id>
                                     │
                       ┌─────────────▼──────────────┐
                       │  PROXY VITE                 │  vite.config.js
                       │  /api  →  localhost:3000    │  Hanya aktif saat DEV.
                       └─────────────┬──────────────┘  ⚠️ Saat produksi hilang!
                                     │
╔════════════════════════════════════▼══════════════════════════════════════╗
║  LAPIS 2 — SERVER (Express, port 3000)                                    ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║   server.js → initDatabase() → app.listen(3000)                           ║
║        │                                                                  ║
║   app.js:  cors()  →  morgan('dev')  →  express.json()                    ║
║        │   ↑ semua asal boleh   ↑ log     ↑ baca body JSON                ║
║        │                                                                  ║
║        │   🔴 DI SINI SEHARUSNYA ADA: authMiddleware  ← TIDAK ADA         ║
║        │                                                                  ║
║        ├─ /api/auth        → authRoutes        → authController           ║
║        ├─ /api/siswa       → siswaRoutes       → siswaController          ║
║        ├─ /api/kunjungan   → kunjunganRoutes   → kunjunganController      ║
║        ├─ /api/laporan     → laporanRoutes     → laporanController        ║
║        └─ /api/pengaturan  → pengaturanRoutes  → pengaturanController     ║
║                                     │                                     ║
║   🔴 TIDAK ADA lapisan Model.   🔴 TIDAK ADA lapisan Validasi.            ║
║      Controller menulis SQL langsung.                                     ║
║                                                                           ║
╚════════════════════════════════════╤══════════════════════════════════════╝
                                     │
                       pool.query('SELECT ...')   ← db/db.js, max 10 koneksi
                                     │
╔════════════════════════════════════▼══════════════════════════════════════╗
║  LAPIS 3 — DATABASE (MySQL/MariaDB, port 3306, db: uks_digital)           ║
╠═══════════════════════════════════════════════════════════════════════════╣
║    users          siswa          kunjungan          pengaturan_sekolah    ║
║      (1)          (0..n)          (0..n)                  (1 baris)       ║
║                      └··· tanpa FOREIGN KEY ···┘                          ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

## 2.3 Alur data lengkap: satu contoh nyata dari klik sampai database

Mari ikuti perjalanan **satu kunjungan** dari petugas menekan tombol "Simpan" sampai datanya muncul kembali di layar. Ini contoh terbaik untuk memahami hubungan semua lapisan.

### Tahap 1 — Petugas mengisi form (`pages/PendaftaranKunjungan.jsx`)

Petugas memilih siswa lewat `SearchAutocomplete`, mencentang keluhan lewat `TagSelector`, lalu klik Simpan. Kode membentuk objek:

```js
const newRecord = {
  id: Date.now(),                                   // 🔴 MASALAH #1 (lihat bawah)
  siswa_id: selectedSiswa?.id || null,
  siswa_nama: selectedSiswa?.nama || namaManual,
  siswa_nis: selectedSiswa?.nis || '-',
  kelas: selectedSiswa?.kelas || kelasManual,
  waktu_masuk: new Date().toISOString(),
  keluhan_utama: selectedKeluhan.join(', ') || keterangan,  // "Pusing, Demam"
  keterangan,
  is_darurat: isDarurat,
  tindakan: selectedTindakan.join(', '),
  status
}
addKunjungan(newRecord)
```

**Yang penting diperhatikan:** `keluhan_utama` disimpan sebagai **satu teks digabung koma** — misal `"Pusing, Demam"`. Ini keputusan yang wajar untuk aplikasi sederhana, **tapi menimbulkan konsekuensi** yang akan kita lihat di Tahap 6.

### Tahap 2 — `DataContext` menyimpan ke state + localStorage + kirim ke server

Di `context/DataContext.jsx`:

```js
const addKunjungan = async (data) => {
  const newK = { id: data.id || Date.now(), ...data }
  setKunjunganList(prev => [newK, ...prev])        // ① Tampilan langsung berubah
  try {
    if (api && api.kunjungan) await api.kunjungan.create(newK)   // ② Kirim ke server
  } catch (err) {
    /* Saved in local state */                     // 🔴 MASALAH #2: error DITELAN
  }
}
```

Ada 3 hal terjadi berurutan:
1. **State React diperbarui** → tabel di layar langsung menampilkan baris baru (*optimistic update* — bagus untuk kenyamanan pengguna).
2. **Data dikirim ke server** lewat `api.kunjungan.create()`.
3. **`useEffect` menyimpan seluruh list ke localStorage** dengan kunci `uks_kunjungan_data_clean`.

🔴 **MASALAH #2 di sini serius:** kalau MySQL mati, kabel jaringan lepas, atau server belum dinyalakan, blok `catch` **tidak melakukan apa pun**. Data tetap muncul di layar, notifikasi "Berhasil disimpan!" tetap tampil — **padahal data tidak pernah masuk database.** Petugas akan yakin datanya aman. Besok tab browser ditutup, dan datanya hilang selamanya. Untuk data kesehatan siswa, ini yang saya anggap bug paling berbahaya setelah masalah keamanan.

### Tahap 3 — `utils/api.js` mengirim permintaan HTTP

```js
const BASE_URL = '/api'

function getHeaders() {
  const user = JSON.parse(sessionStorage.getItem('uks_user') || '{}')
  return {
    'Content-Type': 'application/json',
    ...(user.id && { 'X-User-Id': String(user.id) })   // identitas dikirim di header
  }
}
```

Karena `BASE_URL` adalah `/api` (relatif, bukan `http://localhost:3000/api`), permintaan pergi ke alamat browser sendiri (`localhost:5173/api/kunjungan`) lalu **diteruskan oleh proxy Vite** ke port 3000.

> 🧠 **Kenapa pakai proxy?** Kalau frontend di port 5173 langsung menembak port 3000, browser akan memblokirnya karena aturan CORS. Proxy membuat browser merasa semuanya berasal dari satu alamat yang sama. Ini teknik standar dan **sudah benar** — hanya perlu diingat proxy ini **hanya ada saat pengembangan**, bukan saat aplikasi dipakai sungguhan (dibahas di [Solusi #12](#solusi-12--siapkan-jalur-produksi-satu-port)).

### Tahap 4 — Express meneruskan ke controller

`app.js` melihat awalan `/api/kunjungan` → serahkan ke `routes/kunjunganRoutes.js` → lihat metode `POST` pada path `/` → jalankan `createKunjungan` di controller.

**Perhatikan:** di antara langkah ini **tidak ada pemeriksaan apa pun.** Tidak ada "apakah orang ini sudah login?", tidak ada "apakah `keluhan_utama` benar-benar terisi?", tidak ada "apakah `status` salah satu dari 4 nilai yang sah?". Permintaan langsung sampai ke SQL.

### Tahap 5 — Controller menulis ke MySQL

```js
export async function createKunjungan(req, res) {
  const { siswa_id, siswa_nama, siswa_nis, kelas, waktu_masuk, keluhan_utama,
          keterangan, is_darurat, tindakan, status } = req.body
  try {
    const [result] = await pool.query(
      `INSERT INTO kunjungan (siswa_id, siswa_nama, siswa_nis, kelas, waktu_masuk,
       keluhan_utama, keterangan, is_darurat, tindakan, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [siswa_id || null, siswa_nama, siswa_nis, kelas, waktu_masuk, keluhan_utama,
       keterangan || '', is_darurat ? 1 : 0, tindakan || '', status || 'Istirahat di UKS']
    )
    const newKunjungan = { id: result.insertId, siswa_id, siswa_nama, /* ...dst */ }
    return res.status(201).json({ success: true, message: 'Rekam kunjungan berhasil disimpan', data: newKunjungan })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })   // ⚠️ pesan SQL mentah
  }
}
```

Dua hal penting:

✅ **Yang sudah benar:** penggunaan `?` (*prepared statement*). Ini melindungi dari **SQL Injection** — serangan di mana penyerang mengetik `'; DROP TABLE siswa; --` ke dalam form untuk menghapus tabel. Karena memakai `?`, mysql2 memperlakukan input sebagai *data* murni, bukan perintah. **Seluruh controller di project ini konsisten memakai `?` — ini poin plus yang layak dipuji.**

🔴 **MASALAH #1 muncul di sini:** perhatikan `id` yang dibuat frontend dengan `Date.now()` (misalnya `1754280000000`) **tidak dikirim ke dalam INSERT** — kolom `id` di MySQL memakai `AUTO_INCREMENT`, jadi MySQL memberi id sendiri, misalnya `1`.

Server memang membalas dengan `data: { id: result.insertId, ... }` = `{ id: 1, ... }`. **Tapi frontend tidak pernah membaca balasan itu.** Di state React, kunjungan itu tetap punya `id: 1754280000000`.

**Akibat nyatanya:** ketika petugas menekan tombol Hapus pada baris itu, frontend memanggil `DELETE /api/kunjungan/1754280000000`. MySQL mencari baris dengan id itu, **tidak menemukan apa pun**, dan menghapus 0 baris. Baris hilang dari layar (karena state React dihapus), tapi **datanya masih ada di database.** Setelah refresh halaman, baris itu muncul lagi. Bagi pengguna ini terlihat seperti "hantu" — data yang dihapus kembali sendiri.

### Tahap 6 — Data dibaca kembali dan dihitung untuk Dashboard

```js
// pages/Dashboard.jsx:43-51
const keluhanMap = {}
kunjunganList.forEach((k) => {
  if (k.keluhan_utama) {
    k.keluhan_utama.split(',').forEach((raw) => {        // ← DIPECAH per koma
      const keluhan = raw.trim()
      if (keluhan) keluhanMap[keluhan] = (keluhanMap[keluhan] || 0) + 1
    })
  }
})
```

Dashboard **memecah** `"Pusing, Demam"` menjadi `"Pusing"` (+1) dan `"Demam"` (+1). **Ini pendekatan yang benar.**

Tetapi di `pages/LaporanAnalitik.jsx`, hal yang sama dihitung **tanpa dipecah** — seluruh teks `"Pusing, Demam"` dipakai sebagai satu nama keluhan. Jadi seandainya halaman Laporan mendapat data (yang saat ini tidak), **angkanya akan berbeda dengan Dashboard untuk data yang sama persis.** Kepala sekolah bisa menerima dua laporan dengan angka berbeda dari satu sistem. Ini akan saya bahas di [Solusi #5](#solusi-5--satukan-cara-menghitung-statistik-di-satu-tempat).

## 2.4 Ringkasan tiga masalah struktural dari alur di atas

| # | Masalah | Lokasi | Akibat bagi pengguna |
|---|---|---|---|
| 1 | ID dibuat di frontend (`Date.now()`), balasan server diabaikan | `DataContext.jsx` | Hapus & edit tidak berfungsi; data "kembali" setelah refresh |
| 2 | Error API ditelan blok `catch` kosong | `DataContext.jsx` | Data hilang tanpa peringatan; pengguna merasa sudah tersimpan |
| 3 | Perhitungan statistik ditulis ulang berbeda di tiap halaman | `Dashboard.jsx` vs `LaporanAnalitik.jsx` | Angka Dashboard ≠ angka Laporan |

---

# BAGIAN 3 — BACKEND DIBEDAH

## 3.1 `server.js` — pintu masuk aplikasi

File ini pendek (33 baris) dan tugasnya cuma dua: siapkan database, lalu nyalakan server.

```js
initDatabase()
  .then((success) => {
    if (success) console.log('🗄️  MySQL Database terhubung dan siap!')
    else console.warn('⚠️  Gagal terhubung ke MySQL. Pastikan MySQL Laragon/XAMPP sudah aktif.')
  })
  .catch((err) => console.error('Database error:', err.message))

app.listen(PORT, () => { /* banner ... */ })
```

### ✅ Yang sudah baik

- Pemisahan `server.js` (menyalakan) dan `app.js` (merakit) adalah **pola yang benar**. Manfaatnya: nanti kalau Anda mau menulis tes otomatis, tes bisa meng-*import* `app.js` tanpa benar-benar menyalakan server di port 3000.
- Banner startup yang menampilkan URL server, health-check, dan info DB sangat membantu saat pengembangan.
- Pesan error menyebut "Laragon/XAMPP" — ini pertimbangan yang bagus karena memberi petunjuk konkret pada pengguna Windows.

### 🔴 Masalah: server tetap menyala walaupun database gagal

Perhatikan `initDatabase()` **tidak di-`await`**, dan `app.listen()` dipanggil **di luar** rantai `.then()`. Artinya kedua hal ini berjalan bersamaan, dan `app.listen()` tidak peduli hasil koneksi database.

**Konsekuensi nyata:** petugas UKS lupa menyalakan XAMPP. Server Express tetap hidup dan menjawab. Frontend terbuka normal. Petugas mencatat 12 kunjungan sepanjang pagi. Setiap `INSERT` gagal → tapi karena `DataContext` menelan error (Masalah #2 di Bagian 2), tampilan tetap bilang "Berhasil". **12 catatan kesehatan hilang.**

Kombinasi dua bug ini — server yang "berpura-pura sehat" + frontend yang "berpura-pura berhasil" — adalah skenario kehilangan data yang paling mungkin terjadi di project ini. Solusinya di [Solusi #2](#solusi-2--jangan-pernah-menelan-error-tampilkan-dan-tandai).

## 3.2 `app.js` — perakitan Express dan tabel routing

```js
app.use(cors())            // ← baris 18
app.use(morgan('dev'))     // ← baris 19
app.use(express.json())    // ← baris 20

app.get('/', (req, res) => res.redirect('http://localhost:5173/login'))   // ← baris 24
app.get('/api/health', ...)                                                // ← baris 28

app.use('/api/auth', authRoutes)
app.use('/api/siswa', siswaRoutes)
app.use('/api/kunjungan', kunjunganRoutes)
app.use('/api/laporan', laporanRoutes)
app.use('/api/pengaturan', pengaturanRoutes)

app.use((req, res) => { /* 404 handler */ })   // ← baris 45
```

### Penjelasan tiga middleware

> 🧠 **Apa itu middleware?** Bayangkan surat yang masuk ke kantor. Sebelum sampai ke meja tujuan, surat lewat beberapa petugas: penerima tamu, pencatat surat masuk, pembuka amplop. **Middleware adalah petugas-petugas itu** — kode yang memeriksa/mengubah permintaan sebelum sampai ke controller.

| Middleware | Fungsi | Penilaian |
|---|---|---|
| `cors()` | Mengizinkan browser dari alamat lain memanggil API | ⚠️ Tanpa argumen = **semua alamat di dunia diizinkan** |
| `morgan('dev')` | Mencetak log tiap permintaan ke terminal | ✅ Bagus untuk pengembangan |
| `express.json()` | Membaca body JSON jadi `req.body` | ✅ Wajib, sudah benar |

### ✅ Yang sudah baik: penanganan 404 khusus API

```js
app.use((req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    return res.status(404).json({ success: false, message: `Endpoint ${req.originalUrl} tidak ditemukan.` })
  }
  res.status(404).send('Not Found')
})
```

Ini **pemikiran yang matang**. Kalau frontend salah memanggil endpoint, ia menerima JSON yang bisa dibaca kodenya. Kalau browser salah membuka URL biasa, ia menerima teks HTML. Banyak project pemula tidak memikirkan pembedaan ini.

### 🔴 Masalah A: alamat frontend di-*hardcode*

```js
res.redirect('http://localhost:5173/login')
```

Alamat `localhost:5173` ditulis langsung di kode. Kalau nanti aplikasi dipasang di komputer server sekolah dengan IP `192.168.1.50`, atau frontend sudah di-*build* dan disajikan di port 3000 yang sama, baris ini akan mengarahkan pengguna ke alamat yang **tidak ada**. Nilai seperti ini seharusnya berada di `.env`.

### 🔴 Masalah B (KRITIS): tidak ada middleware autentikasi

Ini temuan terpenting di seluruh dokumen, jadi saya jelaskan sedetail mungkin.

Lihat urutan di `app.js`. Setelah `express.json()`, permintaan **langsung** diserahkan ke routes. Tidak ada satu baris pun yang bertanya: *"Sebentar, kamu siapa? Sudah login?"*

Saya sudah memeriksa **seluruh** file di folder `routes/` dan `controllers/` — tidak ada satu pun pemeriksaan autentikasi.

**Artinya, siapa pun yang bisa menjangkau server ini dapat melakukan hal berikut tanpa login:**

```bash
# Ambil SELURUH data siswa (nama, NIS, kelas, tanggal lahir, nama wali, telepon wali)
curl http://<alamat-server>:3000/api/siswa

# Ambil SELURUH rekam kunjungan UKS (data kesehatan semua siswa)
curl http://<alamat-server>:3000/api/kunjungan

# HAPUS data siswa nomor 5
curl -X DELETE http://<alamat-server>:3000/api/siswa/5

# HAPUS rekam kunjungan nomor 12
curl -X DELETE http://<alamat-server>:3000/api/kunjungan/12

# UBAH identitas sekolah yang muncul di semua laporan
curl -X PUT http://<alamat-server>:3000/api/pengaturan/sekolah \
  -H "Content-Type: application/json" -d '{"nama_sekolah":"Diubah"}'
```

**Mengapa halaman login tidak melindungi apa pun?** Karena `ProtectedRoute` di `App.jsx` hanya bekerja **di dalam browser**, di sisi tampilan:

```js
// frontend/src/App.jsx
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return children
}
```

> 🧠 **Analogi:** ini seperti rumah yang **pintu depannya digembok**, tapi **semua jendela dan pintu belakangnya dilepas.** Pengunjung yang datang lewat pintu depan (yaitu lewat aplikasi React) memang harus punya kunci. Tapi siapa pun bisa masuk lewat jendela (yaitu memanggil API langsung dari terminal/browser) tanpa kunci sama sekali.
>
> Aturan emas keamanan web: **pemeriksaan di sisi klien adalah untuk kenyamanan, bukan keamanan.** Kode di browser bisa dilihat, diubah, dan dilewati siapa pun. Hanya server yang bisa menjaga.

**Mengapa ini serius dalam konteks ini?** Data yang tersimpan adalah **data kesehatan anak di bawah umur** — beserta nama wali dan nomor telepon wali. Di Indonesia ini tergolong data pribadi yang dilindungi UU No. 27/2022 tentang Pelindungan Data Pribadi, dan data kesehatan termasuk kategori **data pribadi spesifik** yang perlindungannya lebih ketat. Bahkan jika sekarang aplikasi hanya jalan di satu komputer, cukup satu kali komputer itu terhubung ke Wi-Fi sekolah untuk membuat seluruh data terbuka bagi siapa pun di jaringan yang sama.

Solusi lengkap dengan kodenya ada di [Solusi #1](#solusi-1--pasang-autentikasi-nyata-di-sisi-server).

## 3.3 `db/db.js` — jembatan ke MySQL

```js
import mysql from 'mysql2/promise'
import dotenv from 'dotenv'
dotenv.config()

let host = process.env.DB_HOST || '127.0.0.1'
let port = parseInt(process.env.DB_PORT || '3306', 10)

if (host.includes(':')) {              // menangani DB_HOST="127.0.0.1:3307"
  const parts = host.split(':')
  host = parts[0]
  port = parseInt(parts[1], 10) || 3306
}

const pool = mysql.createPool({
  host, port,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'uks_digital',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
})

export default pool
```

### ✅ Yang sudah baik

**Pemakaian *connection pool*, bukan koneksi tunggal.** Ini keputusan teknis yang tepat.

> 🧠 **Analogi:** membuka koneksi database itu seperti menelepon seseorang — ada waktu "berdering" sebelum tersambung. Kalau setiap permintaan harus menelepon dari nol, aplikasi jadi lambat. *Pool* adalah **10 saluran telepon yang sudah tersambung dan menganggur**, siap dipakai kapan saja lalu dikembalikan. Untuk aplikasi 1 sekolah, angka 10 sudah lebih dari cukup.

**Penanganan `DB_HOST` yang mengandung port** (`"127.0.0.1:3307"`) juga pemikiran praktis yang bagus, karena Laragon/XAMPP di beberapa komputer memakai port MySQL non-standar.

### ⚠️ Catatan: `DB_PASSWORD` kosong

Di `.env`, `DB_PASSWORD=` (tidak ada isinya). Untuk XAMPP di komputer sendiri ini normal dan tidak berbahaya selama MySQL hanya mendengarkan `127.0.0.1`. Tapi kalau nanti dipasang di komputer server sekolah yang terhubung jaringan, **user `root` tanpa password adalah pintu terbuka.** Catat ini sebagai hal yang wajib diubah saat *deploy*.

## 3.4 `db/initDB.js` — pembentuk skema otomatis

File ini (143 baris) dijalankan setiap kali server menyala. Isinya `CREATE DATABASE IF NOT EXISTS` + 4 `CREATE TABLE IF NOT EXISTS` + *seed* data awal.

### ✅ Yang sudah baik

- Pemakaian `IF NOT EXISTS` di semua perintah = **idempoten**. Boleh dijalankan 100 kali, hasilnya sama, tidak ada data yang rusak. Ini praktik yang benar.
- *Seed* hanya jalan kalau tabel kosong (`if (users[0].count === 0)`), jadi tidak menimpa data yang sudah ada.
- Bisa dijalankan mandiri lewat baris 141: `if (process.argv[1]?.endsWith('initDB.js'))` — jadi Anda bisa `node db/initDB.js` untuk membangun database tanpa menyalakan server.
- Ada blok migrasi otomatis dari kolom `email` lama ke `username`, tanda pengembang memikirkan perpindahan versi.

### 🔴 Masalah A: `host` sudah dihitung, lalu diabaikan

Perhatikan baris 8–15 dan baris 23:

```js
let host = process.env.DB_HOST || '127.0.0.1'    // baris 8
...
if (host.includes(':')) { host = parts[0]; ... }  // baris 11-15 → host dihitung

const rootConnection = await mysql.createConnection({
  host: '127.0.0.1',    // ← baris 23: 🔴 nilai `host` di atas TIDAK DIPAKAI
  port, user, password
})
```

Variabel `host` dihitung dengan hati-hati di baris 8–15, lalu **tidak dipakai** — diganti string tetap `'127.0.0.1'`. Bahkan pesan log di baris 22 juga menulis `127.0.0.1` secara literal:

```js
console.log(`🔄 Connecting to MySQL server at 127.0.0.1:${port}...`)
```

**Akibatnya:** kalau nanti MySQL dipindahkan ke komputer lain (`DB_HOST=192.168.1.10`), maka `db.js` akan tersambung ke komputer yang benar, tapi `initDB.js` tetap mencoba `127.0.0.1` — pembuatan skema akan gagal sementara koneksi biasa berhasil. Ini bug yang **sangat membingungkan** saat terjadi, karena setengah sistem bekerja dan setengahnya tidak. Perbaikannya cuma 2 baris ([Solusi #10](#solusi-10--rapikan-konfigurasi-yang-di-hardcode)).

### 🔴 Masalah B: password admin disemai dalam bentuk teks biasa

```js
INSERT INTO users (nama_lengkap, username, nip, no_telepon, password, role)
VALUES ('Ibu Siti Rahmawati', 'siti_rahmawati', '198507152010012003', '081234567890', 'admin', 'Petugas UKS Utama')
```

Kolom `password` diisi `'admin'` — apa adanya. Siapa pun yang bisa membuka phpMyAdmin, melihat file backup `.sql`, atau membaca repository ini, langsung tahu passwordnya.

### ⚠️ Masalah C: blok migrasi menelan error diam-diam

```js
} catch (migErr) {
  // Kolom sudah benar, abaikan
}
```

Komentarnya berasumsi error hanya terjadi karena "kolom sudah benar". Tapi blok ini juga akan **menelan error nyata** — misalnya `ALTER TABLE` gagal karena ada nilai `username` duplikat, atau hak akses kurang. Migrasi gagal separuh jalan, tidak ada peringatan, lalu login misterius tidak bekerja. Minimal harus ada `console.warn(migErr.message)`.

## 3.5 Kelima controller dibedah satu per satu

### A. `controllers/authController.js` (128 baris)

**Yang sudah baik — dan ini layak dipuji:**

```js
if (!rows || rows.length === 0) {
  return res.status(401).json({ message: 'Username/NIP atau Password yang Anda masukkan salah!' })
}
const user = rows[0]
if (user.password !== password) {
  return res.status(401).json({ message: 'Username/NIP atau Password yang Anda masukkan salah!' })
}
```

Pesan error untuk "username tidak ada" dan "password salah" **sengaja dibuat identik**. Ini praktik keamanan yang benar dan sering dilupakan pemula. Kalau pesannya dibedakan ("username tidak ditemukan" vs "password salah"), penyerang bisa memakai form login untuk **mendaftar username mana yang valid** — namanya *user enumeration*. Pengembang di sini sudah menghindarinya. Bagus.

Juga bagus: password dibuang dari respons sebelum dikirim:

```js
const { password: _, ...userData } = user
```

Dan login menerima **username ATAU NIP** (`WHERE username = ? OR nip = ?`) — pertimbangan yang ramah pengguna, karena guru sering lebih ingat NIP-nya.

**🔴 Masalah A: password dibandingkan sebagai teks biasa.**

`if (user.password !== password)` berarti password nyata tersimpan di database. Kalau database bocor (dicuri, di-*backup* ke flashdisk, atau file `.sql` ikut ter-*commit*), **semua password langsung terbaca.** Karena banyak orang memakai password yang sama untuk email dan akun lain, dampaknya melebar jauh di luar aplikasi ini.

Ironisnya, `bcrypt` — library standar untuk masalah ini — **sudah terpasang** di `package.json`. Saya cek dengan pencarian: kata `bcrypt` muncul **nol kali** di seluruh kode sumber. Jadi solusinya sudah dibeli tapi belum dibuka dari kotaknya.

**🔴 Masalah B: login tidak menghasilkan token apa pun.**

Setelah login sukses, server hanya mengirim data user. Tidak ada *token*, tidak ada *session*. Frontend menyimpan data itu di `sessionStorage` dan menganggap dirinya "sudah login". Server **tidak menyimpan ingatan apa pun** bahwa login pernah terjadi.

Padahal `jsonwebtoken` juga **sudah terpasang**, dan `.env` sudah punya:

```
JWT_SECRET=uks-digital-secret-key-2026
```

Kunci rahasianya sudah disiapkan, tapi tidak pernah dipakai. Ini menunjukkan **niat awal pengembang sudah benar** — rencananya memakai JWT — hanya belum diselesaikan. Kabar baiknya: karena fondasinya sudah ada, [Solusi #1](#solusi-1--pasang-autentikasi-nyata-di-sisi-server) jadi lebih mudah dikerjakan.

**⚠️ Masalah C: peran ditentukan dari panjang NIP.**

```js
const isDokterKecil = nip.length <= 10
```

Rapuh karena: (a) guru yang salah mengetik NIP-nya jadi 9 digit otomatis dijadikan "Dokter Kecil"; (b) tidak ada cara mengubah peran setelah akun dibuat; (c) siapa pun bisa memilih perannya sendiri hanya dengan mengatur panjang NIP saat mendaftar.

**🔴 Masalah D: registrasi terbuka untuk umum.**

`POST /api/auth/register` tidak dijaga apa pun. Siapa pun yang bisa menjangkau server bisa membuat akun sendiri, lalu — karena tidak ada pembeda hak akses — punya kuasa penuh atas seluruh data. Untuk aplikasi internal satu sekolah, pendaftaran mandiri seperti ini **seharusnya tidak ada**; akun mestinya dibuat oleh petugas utama.

**⚠️ Masalah E: aturan username ditulis dua kali di tempat berbeda.**

`USERNAME_REGEX` ada di `controllers/authController.js:7` **dan** di `frontend/src/context/AuthContext.jsx`. Dua salinan aturan yang sama = suatu hari nanti salah satu diubah dan yang lain tidak. Lebih parah: `pages/Pengaturan.jsx` punya versi ketiga yang **lebih longgar** — hanya membersihkan karakter tanpa memaksa panjang minimal 4. Jadi lewat halaman Pengaturan, seorang petugas bisa mengubah username-nya menjadi `ab` — nilai yang **tidak akan pernah bisa dipakai untuk login** karena `validateUsername` di backend menolaknya. Pengguna bisa mengunci diri sendiri di luar aplikasi.

### B. `controllers/siswaController.js` (70 baris)

Berisi 4 fungsi standar: `getSiswa`, `createSiswa`, `updateSiswa`, `deleteSiswa`. Semuanya memakai *prepared statement* dengan benar.

| Masalah | Penjelasan |
|---|---|
| Tidak ada validasi | `nis` bisa kosong, `kelas` bisa `"99"`, `jenis_kelamin` bisa `"XYZ"` → MySQL menolak dengan error mentah, atau menerima data ngawur |
| `SELECT *` tanpa `LIMIT` | 300 siswa masih aman, tapi ini kebiasaan yang perlu diperbaiki |
| `err.message` mentah ke klien | Bocorkan nama tabel/kolom ke penyerang (lihat kotak di bawah) |
| Hapus siswa tanpa pemeriksaan | Siswa yang punya riwayat kunjungan bisa dihapus → kunjungan jadi *orphan* |

> ⚠️ **Kenapa `err.message` mentah berbahaya?** Kalau `INSERT` gagal, MySQL mengirim pesan seperti `Duplicate entry '1234' for key 'siswa.nis'` atau `Unknown column 'kelasx' in 'field list'`. Pesan ini diteruskan apa adanya ke browser. Penyerang bisa sengaja mengirim data ngawur untuk **memetakan struktur database Anda** dari pesan-pesan error itu. Yang benar: catat detail di log server, kirim pesan umum ke pengguna.

### C. `controllers/kunjunganController.js` (66 baris)

**Yang sudah baik:**

```js
const data = rows.map(r => ({ ...r, is_darurat: Boolean(r.is_darurat) }))
```

MySQL menyimpan `is_darurat` sebagai `TINYINT(1)` — nilainya `0`/`1`, bukan `true`/`false`. Di JavaScript, angka `0` bersifat *falsy* jadi kebetulan masih bekerja di `if`, **tetapi** `0 === false` adalah `false`. Kalau ada kode yang membandingkan dengan `===`, hasilnya akan salah. Konversi eksplisit ke `Boolean` di sini **mencegah bug yang sulit dilacak.** Detail yang menunjukkan ketelitian.

**🔴 Masalah utama: tidak ada endpoint untuk mengubah kunjungan.**

Route yang ada hanya `GET`, `POST`, `DELETE`. **Tidak ada `PUT`.** Padahal `Preview, Prompt, and rules.md` secara eksplisit meminta kolom **"Aksi (Detail/Edit)"** di halaman Riwayat.

**Dampak praktisnya besar.** Bayangkan alur kerja nyata:

1. Pukul 09.15 — Andi masuk UKS, pusing. Petugas mencatat, status: **"Istirahat di UKS"**.
2. Pukul 09.50 — Andi sudah membaik dan kembali ke kelas.
3. Petugas ingin memperbarui status menjadi **"Kembali ke Kelas"** dan mengisi `waktu_keluar`.
4. **Tidak bisa.** Satu-satunya pilihan: hapus catatannya, lalu buat ulang dari awal.

Ini juga menjelaskan mengapa kolom `waktu_keluar` — yang **sudah ada** di skema database — **tidak pernah terisi**: tidak ada mekanisme untuk mengisinya setelah kunjungan dibuat.

Dan ini menimbulkan efek berantai: spesifikasi meminta kartu Dashboard **"siswa sedang istirahat di UKS"**. Untuk menghitungnya dengan benar, kita perlu tahu siapa yang statusnya `Istirahat di UKS` **dan** `waktu_keluar`-nya masih kosong. Karena `waktu_keluar` tidak pernah terisi, angka itu tidak bisa dihitung dengan akurat. **Satu endpoint yang hilang menyebabkan satu fitur spesifikasi tidak bisa diwujudkan.**

### D. `controllers/laporanController.js` (26 baris) — masih setengah jadi

```js
export const laporanController = {
  getMonthlyReport: async (req, res) => {
    try {
      const bulan = req.query.bulan || new Date().getMonth() + 1     // ← dibaca...
      const tahun = req.query.tahun || new Date().getFullYear()      // ← dibaca...

      const [visits] = await pool.query('SELECT * FROM kunjungan')   // ← ...tapi TIDAK dipakai
      const totalKunjungan = visits.length                           //     untuk memfilter!
      const totalDarurat = visits.filter((v) => v.is_darurat).length

      res.json({ success: true, data: { bulan, tahun, totalKunjungan, totalDarurat } })
    } catch (err) {
      res.status(500).json({ success: false, message: err.message })
    }
  }
}
```

Perhatikan: `bulan` dan `tahun` **hanya dikembalikan kembali sebagai gema** di dalam respons. Keduanya tidak pernah masuk ke dalam klausa `WHERE` query mana pun.

Tiga masalah sekaligus:

1. **Parameter `bulan` dan `tahun` diambil tapi tidak pernah dipakai untuk memfilter.** Keduanya hanya dikembalikan sebagai gema di respons. Mengirim `?bulan=8&tahun=2026` atau tidak mengirimnya sama sekali menghasilkan angka yang identik.
2. **Perhitungan dilakukan di JavaScript, bukan di SQL.** Seluruh isi tabel diambil ke memori Node hanya untuk dihitung panjangnya. Untuk 50 baris tidak terasa; untuk 5.000 baris di akhir tahun ajaran, ini pemborosan besar. `SELECT COUNT(*)` mengembalikan **satu angka** — jauh lebih efisien.
3. **Isinya jauh dari kebutuhan.** Halaman Laporan butuh: top-5 keluhan, sebaran per kelas, tren harian, rasio darurat, sebaran status. Yang diberikan hanya 2 angka.

**Dan yang paling menentukan: endpoint ini tidak pernah dipanggil frontend.** Saya cek `frontend/src/utils/api.js` — hanya ada namespace `siswa` dan `kunjungan`. Tidak ada `laporan`. Jadi endpoint ini **kode mati secara fungsional**: ada, jalan, tapi tak seorang pun memanggilnya.

### E. `controllers/pengaturanController.js` (76 baris)

**🔴 Masalah A (celah keamanan): identitas diambil dari header yang bisa dipalsukan.**

```js
const userId = req.headers['x-user-id']
```

Header HTTP bisa diisi apa saja oleh siapa saja. Tidak ada tanda tangan digital, tidak ada verifikasi. Contoh nyata:

```bash
# Berpura-pura menjadi user nomor 1, lalu mengubah profilnya
curl -X PUT http://localhost:3000/api/pengaturan/petugas \
  -H "X-User-Id: 1" -H "Content-Type: application/json" \
  -d '{"nama_lengkap":"Penyerang","username":"hacker","nip":"000"}'
```

Berhasil. Tanpa password.

**🔴 Masalah B: fallback yang membocorkan data.**

```js
} else {
  // Fallback: ambil user pertama
  const [rows] = await pool.query('SELECT id, nama_lengkap, username, nip, no_telepon, role FROM users LIMIT 1')
  petugas = rows[0] || {}
}
```

Kalau header `X-User-Id` **tidak ada sama sekali**, server tidak menolak — ia justru **mengirimkan data user pertama** (biasanya petugas utama): nama lengkap, username, dan **NIP**. Jadi:

```bash
curl http://localhost:3000/api/pengaturan
```

…tanpa header apa pun, tanpa login, mengembalikan identitas petugas utama beserta NIP-nya. NIP adalah nomor identitas pegawai negeri — data pribadi yang tidak seharusnya terbuka.

Niat di balik kode ini bisa dipahami: agar halaman Pengaturan tidak kosong saat pengembangan. Tapi *fallback* yang memilih "user mana saja" adalah pola yang berbahaya. Yang benar: tanpa identitas sah → `401 Unauthorized`.

**⚠️ Masalah C: `WHERE id = 1` di-*hardcode*.**

```js
'UPDATE pengaturan_sekolah SET ... WHERE id = 1'
```

Ini sebenarnya **bisa diterima** karena tabel ini memang dirancang hanya berisi satu baris. Tapi kalau baris id=1 pernah terhapus, `UPDATE` akan "berhasil" tanpa mengubah apa pun, dan pengguna tidak diberi tahu bahwa penyimpanan gagal. Perbaikan aman: periksa `result.affectedRows === 0` lalu lakukan `INSERT`, atau pakai `INSERT ... ON DUPLICATE KEY UPDATE`.

**⚠️ Masalah D: tidak ada validasi format username saat pembaruan.**

`updatePetugas` menyimpan `username.toLowerCase()` tanpa memanggil `validateUsername()`. Ini pintu masuk masalah yang saya jelaskan di Masalah E authController: pengguna bisa menyimpan username yang tidak memenuhi syarat login.

## 3.6 Rekap kualitas backend

| Aspek | Nilai | Catatan |
|---|---|---|
| Struktur & pemisahan folder | 🟢 | `routes`/`controllers`/`db` sudah rapi dan mudah diikuti |
| Pencegahan SQL Injection | 🟢 | Konsisten memakai `?` di seluruh controller |
| Penanganan 404 | 🟢 | Membedakan API dan non-API |
| Pesan login anti-enumerasi | 🟢 | Pesan sengaja disamakan — praktik yang benar |
| Konversi tipe `is_darurat` | 🟢 | Detail kecil yang mencegah bug |
| Autentikasi | 🔴 | **Tidak ada sama sekali di server** |
| Penyimpanan password | 🔴 | Teks biasa, padahal `bcrypt` sudah terpasang |
| Validasi input | 🔴 | Tidak ada, padahal `zod` sudah terpasang |
| Endpoint `laporan` | 🔴 | Setengah jadi & tidak pernah dipanggil |
| Kelengkapan CRUD | 🟡 | `PUT /kunjungan/:id` tidak ada → tidak bisa edit kunjungan |
| Penanganan error | 🟡 | Pesan SQL mentah dikirim ke klien |
| Efisiensi query | 🟡 | `SELECT *` tanpa `LIMIT`; agregasi di JS bukan SQL |
| Konfigurasi | 🟡 | `127.0.0.1` dan `localhost:5173` di-*hardcode* |

---

# BAGIAN 4 — DATABASE & FILE `.SQL` DIBEDAH

## 4.1 Masalah paling mendasar: ada TIGA definisi skema yang berbeda

Ini temuan struktural terpenting di lapisan database. Di project ini, pertanyaan sederhana **"sebenarnya tabel `users` itu bentuknya seperti apa?"** punya **tiga jawaban berbeda**, tergantung file mana yang Anda baca.

| # | File | Jenis DB | Kolom identitas | Punya `waktu_keluar`? | Kapan dijalankan? |
|---|---|---|---|---|---|
| 1 | `db/uks_digital.sql` | MySQL | `username` | ✅ Ya | Manual, saat di-*import* ke phpMyAdmin |
| 2 | `db/initDB.js` | MySQL | `username` | ✅ Ya | Otomatis, tiap kali server nyala |
| 3 | `db/sqliteDB.js` | **SQLite** | **`email`** | ❌ **Tidak** | ☠️ Tidak pernah — kode mati |

> 🧠 **Kenapa ini masalah?** Bayangkan sebuah bangunan punya tiga gambar denah yang berbeda-beda. Tukang A membangun pakai denah 1, tukang B merenovasi pakai denah 3. Hasilnya kacau — dan yang paling berbahaya, kekacauannya baru ketahuan **setelah** bangunan berdiri.
>
> Dalam perangkat lunak, prinsip yang benar disebut **"satu sumber kebenaran"** (*single source of truth*): satu hal penting hanya boleh didefinisikan di **satu** tempat.

### Bukti bahwa `sqliteDB.js` adalah kode mati

Saya melakukan pencarian menyeluruh untuk kata `sqliteDB`, `initSQLiteDB`, dan `better-sqlite3` di seluruh project. Hasilnya:

- `db/sqliteDB.js` sendiri (definisinya)
- `package.json` & `package-lock.json` (daftar dependency)

**Tidak ada satu pun file lain yang meng-*import*-nya.** Tidak `server.js`, tidak `app.js`, tidak satu pun controller. File ini benar-benar tidak pernah dijalankan.

### Kenapa kode mati ini tetap berbahaya

Meskipun tidak pernah jalan, keberadaannya menimbulkan tiga risiko nyata:

**1. Menyesatkan siapa pun yang membaca project.** Programmer baru (atau Anda sendiri 6 bulan lagi) membuka folder `db/`, melihat `sqliteDB.js`, dan menyimpulkan *"oh, aplikasi ini pakai SQLite dan login-nya pakai email."* Dua-duanya salah. Waktu terbuang mengejar arah yang keliru.

**2. Bom waktu jika ada yang meng-*import*-nya.** Perhatikan baris 112:

```js
// Execute schema initialization immediately on module load
initSQLiteDB()
```

Fungsi ini dipanggil **langsung saat modul dimuat** — bukan saat dipanggil. Jadi kalau suatu hari ada yang menulis `import db from './db/sqliteDB.js'` (bahkan hanya untuk coba-coba), file SQLite akan langsung dibuat/ditulis di disk sebagai efek samping, tanpa siapa pun sengaja memintanya. Modul yang punya efek samping saat di-*import* seperti ini adalah pola yang berbahaya.

**3. Skemanya bertentangan dengan yang asli.** Bukan sekadar berbeda dialek — dua perbedaannya **fundamental**:

```js
// db/sqliteDB.js baris 23
email TEXT UNIQUE NOT NULL,        // ← seluruh aplikasi sekarang memakai `username`
```

```js
// db/sqliteDB.js baris 66-79 — tabel kunjungan
waktu_masuk TEXT NOT NULL,
keluhan_utama TEXT NOT NULL,       // ← 🔴 `waktu_keluar` HILANG total
```

Kalau ada yang salah memakai file ini sebagai acuan, mereka akan membangun database yang **tidak kompatibel** dengan seluruh kode yang ada.

### Sisa fisik yang juga harus diberesi

```
db/uks_digital.db       (36 KB)   ← file database SQLite lama
db/uks_digital.db-shm             ← file pendamping WAL (belum di-commit)
db/uks_digital.db-wal             ← file pendamping WAL (belum di-commit)
```

File `-shm` dan `-wal` muncul karena `sqliteDB.js` menyalakan `journal_mode = WAL` (baris 13). Keberadaan file-file ini di `git status` sebagai *untracked* adalah **bukti bahwa file SQLite pernah benar-benar dibuka** di komputer ini. Kalau isinya memuat data siswa sungguhan, file ini **tidak boleh masuk ke git**.

**Penting:** file `.db` ini bisa saja berisi data lama yang masih Anda butuhkan. Jangan langsung dihapus — periksa dulu isinya. Prosedur amannya ada di [Solusi #7](#solusi-7--satukan-sumber-skema--tambah-integritas-yang-aman).

## 4.2 Bedah `db/uks_digital.sql` baris per baris

File ini (83 baris) adalah versi yang bisa Anda *import* langsung ke phpMyAdmin. Mari kita baca dengan teliti.

### Baris 7–8 — pembuatan database

```sql
CREATE DATABASE IF NOT EXISTS uks_digital CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE uks_digital;
```

✅ **Pilihan `utf8mb4` sudah tepat dan penting.**

> 🧠 **Kenapa `utf8mb4`, bukan `utf8` biasa?** Di MySQL, yang bernama `utf8` sebenarnya "UTF-8 palsu" — hanya sanggup menyimpan karakter sampai 3 byte. Karakter 4 byte seperti emoji (😷 🤒) akan **menyebabkan error atau data terpotong**. `utf8mb4` adalah UTF-8 yang sebenarnya.
>
> Ini relevan untuk aplikasi ini: petugas UKS bisa saja mengetik catatan seperti `"Sudah membaik 👍"` di kolom keterangan. Dengan `utf8` biasa, penyimpanan itu gagal. Pilihan di sini sudah benar.

`utf8mb4_unicode_ci` untuk pengurutan juga tepat — `_ci` artinya *case-insensitive*, sehingga pencarian "andi" akan menemukan "Andi".

### Baris 11–14 — urutan DROP yang benar

```sql
DROP TABLE IF EXISTS kunjungan;
DROP TABLE IF EXISTS siswa;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS pengaturan_sekolah;
```

✅ Urutannya sudah benar: **tabel anak dihapus sebelum tabel induk** (`kunjungan` sebelum `siswa`). Kalau nanti FOREIGN KEY ditambahkan, urutan ini tetap aman. Ini menunjukkan pemahaman yang baik.

> 🔴 **PERINGATAN KERAS:** file ini **menghapus semua tabel** sebelum membuatnya kembali. Kalau Anda meng-*import*-nya ke database yang sudah berisi data kunjungan sungguhan, **seluruh data hilang permanen** tanpa konfirmasi. Tidak ada peringatan di dalam file. Saya sarankan menambahkan komentar peringatan besar di bagian atas file ([Solusi #7](#solusi-7--satukan-sumber-skema--tambah-integritas-yang-aman)).

### Baris 16–25 — tabel `users`

```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama_lengkap VARCHAR(100) NOT NULL,
  username VARCHAR(20) UNIQUE NOT NULL COMMENT 'Huruf kecil, angka, underscore. Min 4, Max 20 karakter. Tidak boleh dimulai angka.',
  nip VARCHAR(20) UNIQUE NOT NULL,
  no_telepon VARCHAR(15),
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'Petugas UKS',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

| Kolom | Analisis |
|---|---|
| `username VARCHAR(20) UNIQUE` | ✅ Panjang cocok dengan aturan max 20 di `authController`. `UNIQUE` mencegah dua orang punya username sama. |
| `COMMENT '...'` | ✅ **Sangat bagus.** Aturan validasi didokumentasikan langsung di database. Programmer berikutnya yang membuka phpMyAdmin langsung melihat aturannya. Praktik yang jarang dilakukan tapi sangat membantu. |
| `nip VARCHAR(20) UNIQUE` | ✅ Tepat menggunakan `VARCHAR`, bukan angka — NIP bisa diawali `0` dan tidak pernah dihitung matematis. |
| `password VARCHAR(255)` | ✅ **Ukurannya sudah pas untuk bcrypt** (hasil bcrypt selalu 60 karakter). Jadi saat Anda menerapkan [Solusi #1](#solusi-1--pasang-autentikasi-nyata-di-sisi-server), **skema tidak perlu diubah sama sekali.** Kolomnya sudah siap; hanya isinya yang salah. |
| `role VARCHAR(50)` | ⚠️ Teks bebas, bukan `ENUM`. Bisa terisi `'Petugas UKS'`, `'Petugas UKS Pegawai'`, `'Petugas UKS Utama'`, `'Dokter Kecil UKS'` — empat variasi untuk konsep yang seharusnya cuma dua. Menyulitkan kalau nanti mau memfilter berdasarkan peran. |
| `created_at TIMESTAMP` | ✅ Jejak waktu pembuatan akun. Baik untuk audit. |

**🔴 Baris 28–29 — seed dengan password teks biasa:**

```sql
INSERT INTO users (id, nama_lengkap, username, nip, no_telepon, password, role)
VALUES (1, 'Ibu Siti Rahmawati', 'siti_rahmawati', '198507152010012003', '081234567890', 'admin', 'Petugas UKS Utama');
--                                                                                        ^^^^^^^
--                                                                        kolom password diisi teks biasa
```

Password `admin` tertulis di dalam file yang **ikut masuk ke git**. Siapa pun yang punya akses ke repository ini tahu password akun utama. Perbaikannya ada di [Solusi #1](#solusi-1--pasang-autentikasi-nyata-di-sisi-server).

**⚠️ Catatan tambahan:** `id` ditulis eksplisit (`VALUES (1, ...)`). Ini sebenarnya membantu, karena `pengaturanController` mengandalkan asumsi bahwa user pertama ber-id 1.

### Baris 32–44 — tabel `siswa`

```sql
CREATE TABLE siswa (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nis VARCHAR(20) UNIQUE NOT NULL,
  nama VARCHAR(100) NOT NULL,
  kelas VARCHAR(5) NOT NULL,
  jenis_kelamin ENUM('Laki-laki', 'Perempuan') NOT NULL,
  tanggal_lahir DATE,
  nama_wali VARCHAR(100),
  telepon_wali VARCHAR(15),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_kelas (kelas),
  INDEX idx_nama (nama)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

| Kolom | Analisis |
|---|---|
| `nis VARCHAR(20) UNIQUE NOT NULL` | ✅ Benar. NIS unik per siswa, dan `VARCHAR` menjaga angka `0` di depan. |
| `jenis_kelamin ENUM(...)` | ✅ **Pemakaian ENUM yang tepat.** Nilainya hanya dua dan tidak akan berubah. Database sendiri yang menolak nilai ngawur — perlindungan gratis di lapisan paling dalam. |
| `tanggal_lahir DATE` | ✅ Tipe `DATE`, bukan teks. Memungkinkan hitung umur & urutkan tanggal dengan benar. |
| `nama_wali`, `telepon_wali` | ✅ Sangat penting secara praktis — saat anak sakit, orang pertama yang dihubungi adalah walinya. Kolom ini menunjukkan pemahaman kebutuhan nyata. |
| `INDEX idx_kelas`, `idx_nama` | ✅ **Pilihan indeks yang cerdas.** |

> 🧠 **Apa itu INDEX?** Bayangkan buku 500 halaman tanpa daftar isi — untuk mencari satu topik Anda harus membalik semua halaman. INDEX adalah daftar isi itu. Di sini indeks dipasang tepat pada dua kolom yang paling sering dicari: **nama** (dipakai fitur autocomplete saat mengetik nama siswa) dan **kelas** (dipakai filter di halaman Data Siswa). Ini bukan indeks asal pasang — ini indeks yang cocok dengan cara aplikasi benar-benar dipakai.

**⚠️ Satu catatan:** `kelas VARCHAR(5)`. Aplikasi saat ini hanya memakai `'1'`–`'6'` (dari `mockData.js`). Tapi spesifikasi di `Preview, Prompt, and rules.md` memberi contoh **"Andi Putra - 4A"** — yang menyiratkan adanya **rombel** (4A, 4B, 5A…). Untungnya `VARCHAR(5)` sudah cukup panjang untuk menampung `"4A"`, jadi **database sudah siap**; yang perlu diubah hanya daftar pilihan di frontend. Ini akan saya bahas di [Solusi #9](#solusi-9--lengkapi-kekurangan-terhadap-spesifikasi).

### Baris 47–68 — tabel `kunjungan` (tabel inti)

```sql
CREATE TABLE kunjungan (
  id INT AUTO_INCREMENT PRIMARY KEY,
  siswa_id INT,
  siswa_nama VARCHAR(100) NOT NULL,
  siswa_nis VARCHAR(20) NOT NULL,
  kelas VARCHAR(5) NOT NULL,
  waktu_masuk DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  waktu_keluar DATETIME,
  keluhan_utama VARCHAR(255) NOT NULL,
  keterangan TEXT,
  is_darurat TINYINT(1) DEFAULT 0,
  tindakan VARCHAR(255),
  status ENUM('Kembali ke Kelas','Istirahat di UKS','Dijemput Wali','Dirujuk ke Klinik')
         NOT NULL DEFAULT 'Istirahat di UKS',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_waktu (waktu_masuk),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

**✅ Hal-hal yang sudah dirancang dengan baik:**

| Elemen | Mengapa bagus |
|---|---|
| `status ENUM(4 nilai)` | Keempat nilainya **persis sama** dengan `statusOptions` di `frontend/src/data/mockData.js`. Frontend dan database sepakat — ini konsistensi yang sering gagal di project lain. |
| `DEFAULT 'Istirahat di UKS'` | Nilai bawaan yang **aman secara medis**. Kalau petugas lupa memilih, sistem berasumsi siswa masih di UKS (butuh perhatian), bukan sudah kembali ke kelas. Ini pilihan yang bijak. |
| `INDEX idx_waktu` | Semua laporan disaring per tanggal/bulan → indeks ini sangat tepat sasaran. |
| `INDEX idx_status` | Mendukung pertanyaan "siapa yang sedang istirahat di UKS?" |
| Ada `waktu_masuk` **dan** `waktu_keluar` | Perancangnya paham bahwa kunjungan UKS punya **durasi**, bukan hanya satu titik waktu. |
| `is_darurat TINYINT(1)` | Cara standar MySQL menyimpan ya/tidak. Sudah benar. |
| `keterangan TEXT` | `TEXT` (bukan `VARCHAR`) untuk catatan bebas yang bisa panjang. Tepat. |

**🔴 Masalah A: `waktu_keluar` ada tapi tidak pernah dipakai.**

Saya cari kata `waktu_keluar` di seluruh kode. Hasilnya: hanya muncul di **definisi skema** (`uks_digital.sql` dan `initDB.js`). **Nol kemunculan** di controller, nol di frontend.

Jadi kolom ini selalu `NULL`. Konsekuensinya sudah saya jelaskan di Bagian 3.5: kartu Dashboard **"siswa sedang istirahat di UKS"** yang diminta spesifikasi tidak bisa dihitung akurat, dan durasi penanganan tidak bisa dianalisis. Penyebabnya satu: **tidak ada endpoint `PUT /api/kunjungan/:id`** untuk memperbarui kunjungan setelah dibuat.

**⚠️ Masalah B: `keluhan_utama VARCHAR(255)` menyimpan daftar bergabung koma.**

Frontend menggabungkan pilihan menjadi `"Pusing, Demam, Mual"`. Tiga akibatnya:

1. **Analisis jadi rumit** — untuk menghitung "berapa kali Pusing muncul", SQL harus memecah teks. Itu sebabnya semua perhitungan keluhan dilakukan di JavaScript.
2. **Rawan tidak konsisten** — `"Pusing, Demam"` dan `"Demam, Pusing"` adalah dua teks berbeda bagi database, padahal maknanya sama.
3. **Batas 255 karakter** — memilih ~15 keluhan sekaligus bisa melebihi batas dan menyebabkan galat.

> **Apakah ini harus segera diubah?** **Tidak.** Solusi "benar" secara teori adalah membuat tabel penghubung `kunjungan_keluhan`. Tapi itu menambah kerumitan besar untuk aplikasi satu sekolah. Menurut saya, **pendekatan sekarang sudah cukup memadai** — asalkan perhitungannya konsisten (dipecah per koma di **semua** halaman, lihat [Solusi #5](#solusi-5--satukan-cara-menghitung-statistik-di-satu-tempat)) dan batas jumlah pilihan diberi pengaman. Saya tidak menyarankan normalisasi penuh sekarang; alasan lengkapnya di Bagian 9.

**🔴 Masalah C: tidak ada FOREIGN KEY.**

```sql
siswa_id INT,          -- tanpa: REFERENCES siswa(id)
```

Sudah saya bahas di Bagian 1.5. Ringkasnya: fleksibilitasnya berguna (bisa mencatat siswa tak terdaftar saat darurat), tapi tanpa pengaman apa pun, `siswa_id` bisa menunjuk ke siswa yang tidak ada. Solusi yang mempertahankan **kedua** sisi baik ada di [Solusi #7](#solusi-7--satukan-sumber-skema--tambah-integritas-yang-aman).

**⚠️ Masalah D: tidak ada catatan siapa petugas yang menangani.**

Tabel `kunjungan` tidak punya kolom `petugas_id`. Jadi sistem tidak bisa menjawab: *"Siapa yang mencatat kunjungan ini?"* Untuk rekam medis — bahkan yang sederhana seperti UKS sekolah — **jejak pertanggungjawaban itu penting**. Kalau ada pertanyaan di kemudian hari tentang penanganan seorang siswa, tidak ada catatan siapa yang menanganinya.

### Baris 71–82 — tabel `pengaturan_sekolah`

```sql
CREATE TABLE pengaturan_sekolah (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama_sekolah VARCHAR(200),
  npsn VARCHAR(20),
  telepon_sekolah VARCHAR(15),
  kepala_sekolah VARCHAR(100),
  alamat TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

✅ `ON UPDATE CURRENT_TIMESTAMP` otomatis mencatat kapan terakhir diubah — detail yang bagus.

✅ Ada `npsn` (Nomor Pokok Sekolah Nasional) — menunjukkan pemahaman konteks administrasi sekolah Indonesia.

⚠️ Tabel ini **dirancang hanya berisi 1 baris**, tapi tidak ada yang memaksanya. Secara teknis bisa terisi 5 baris, dan `LIMIT 1` di controller akan mengambil salah satunya secara acak.

**🔴 Yang paling ironis:** tabel ini berisi identitas sekolah — **tapi laporan cetak tidak memakainya.** Di `components/common/PrintReportTemplate.jsx`, kop surat ditulis langsung di dalam kode:

```jsx
PEMERINTAH KABUPATEN SOLOK
DINAS PENDIDIKAN DAN KEBUDAYAAN
...
const kepalaNip = '197508122005011002'   // ← NIP kepala sekolah di-hardcode
```

Jadi seorang petugas bisa dengan rajin memperbarui nama kepala sekolah di halaman Pengaturan, menekan Simpan, melihat notifikasi "Berhasil diperbarui!" — lalu mencetak laporan dan mendapati **nama lama masih tercetak.** Fitur Pengaturan terasa "bohong". Ini bug yang merusak kepercayaan pengguna terhadap sistem.

## 4.3 Perbandingan berdampingan: `initDB.js` vs `uks_digital.sql`

Kedua file ini **seharusnya** menghasilkan struktur yang identik. Saya bandingkan baris per baris — hasilnya:

| Aspek | `uks_digital.sql` | `initDB.js` | Sama? |
|---|---|---|---|
| Kolom tabel `users` | 8 kolom | 8 kolom | ✅ Identik |
| `COMMENT` pada `username` | ✅ Ada | ❌ Tidak ada | ⚠️ Beda (kosmetik) |
| Kolom tabel `siswa` | 9 kolom + 2 indeks | 9 kolom + 2 indeks | ✅ Identik |
| Kolom tabel `kunjungan` | 13 kolom + 2 indeks | 13 kolom + 2 indeks | ✅ Identik |
| Kolom `pengaturan_sekolah` | 7 kolom | 7 kolom | ✅ Identik |
| Nilai `ENUM status` | 4 nilai | 4 nilai | ✅ Identik |
| Seed admin | `id` eksplisit = 1 | tanpa `id` eksplisit | ⚠️ Beda kecil |
| Perilaku terhadap data lama | **DROP semua** | `IF NOT EXISTS` (aman) | 🔴 **Berlawanan** |
| Blok migrasi email→username | ❌ Tidak ada | ✅ Ada | ⚠️ Beda |

**Kesimpulan:** kabar baiknya, kedua file **saat ini masih sinkron** dalam hal struktur. Kabar buruknya, tidak ada apa pun yang menjamin mereka **tetap** sinkron. Cukup satu kali seseorang menambah kolom di `initDB.js` dan lupa memperbarui `uks_digital.sql`, keduanya bercabang — dan orang yang meng-*import* file `.sql` akan mendapat database yang kekurangan kolom, dengan error yang membingungkan.

## 4.4 Peta relasi lengkap dengan kardinalitas

```
┌────────────────────────────────────────┐
│  users                                 │
│  ─────────────────────────────────     │      TIDAK ADA RELASI
│  🔑 id            INT AUTO_INCREMENT   │      ke tabel mana pun.
│     nama_lengkap  VARCHAR(100)         │
│  ⭐ username      VARCHAR(20) UNIQUE   │      ⚠️ Seharusnya:
│  ⭐ nip           VARCHAR(20) UNIQUE   │      kunjungan.petugas_id → users.id
│     no_telepon    VARCHAR(15)          │         (agar ada jejak audit)
│     password      VARCHAR(255) 🔴teks  │
│     role          VARCHAR(50)          │
│     created_at    TIMESTAMP            │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│  siswa                     (INDUK)     │
│  ─────────────────────────────────     │
│  🔑 id            INT AUTO_INCREMENT   │
│  ⭐ nis           VARCHAR(20) UNIQUE   │
│  📇 nama          VARCHAR(100)  INDEX  │
│  📇 kelas         VARCHAR(5)    INDEX  │
│     jenis_kelamin ENUM(L / P)          │
│     tanggal_lahir DATE                 │
│     nama_wali     VARCHAR(100)         │
│     telepon_wali  VARCHAR(15)          │
│     created_at    TIMESTAMP            │
└──────────────────┬─────────────────────┘
                   │  1  (satu siswa)
                   │
                   ┊  ← garis PUTUS-PUTUS = relasi TANPA FOREIGN KEY
                   ┊     Database tidak memaksa apa pun di sini.
                   │
                   │  N  (bisa banyak kunjungan)
┌──────────────────▼─────────────────────┐
│  kunjungan                 (ANAK)      │
│  ─────────────────────────────────     │
│  🔑 id             INT AUTO_INCREMENT  │
│  🔗 siswa_id       INT  (boleh NULL)   │ ← relasi lemah, tanpa FK
│  📋 siswa_nama     VARCHAR(100)        │ ← SALINAN (sengaja, sudah benar)
│  📋 siswa_nis      VARCHAR(20)         │ ← SALINAN (sengaja, sudah benar)
│  📋 kelas          VARCHAR(5)          │ ← SALINAN (sengaja, sudah benar)
│  📇 waktu_masuk    DATETIME     INDEX  │
│  ⬜ waktu_keluar   DATETIME            │ ← 🔴 SELALU NULL, tak pernah diisi
│     keluhan_utama  VARCHAR(255)        │ ← "Pusing, Demam" (gabung koma)
│     keterangan     TEXT                │
│     is_darurat     TINYINT(1)          │
│     tindakan       VARCHAR(255)        │
│  📇 status         ENUM(4)      INDEX  │
│     created_at     TIMESTAMP           │
│                                        │
│  ⬜ petugas_id     ← 🔴 TIDAK ADA      │ ← seharusnya ada (jejak audit)
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│  pengaturan_sekolah      (SELALU 1 BARIS)
│  ─────────────────────────────────     │
│  🔑 id              INT (selalu = 1)   │
│     nama_sekolah    VARCHAR(200)       │  🔴 Data di tabel ini TIDAK
│     npsn            VARCHAR(20)        │     dipakai oleh laporan cetak.
│     telepon_sekolah VARCHAR(15)        │     PrintReportTemplate memakai
│     kepala_sekolah  VARCHAR(100)       │     teks yang di-hardcode.
│     alamat          TEXT               │
│     updated_at      TIMESTAMP          │
└────────────────────────────────────────┘

Keterangan:  🔑 Primary Key   ⭐ UNIQUE   📇 Ada INDEX
             🔗 Relasi lemah  📋 Salinan sengaja  ⬜ Ada tapi tak terpakai
```

## 4.5 Rekap kualitas database

| Aspek | Nilai | Catatan |
|---|---|---|
| Pilihan tipe data | 🟢 | `ENUM`, `DATE`, `TEXT`, `VARCHAR` semuanya dipilih tepat |
| Strategi indeks | 🟢 | 4 indeks, semuanya sesuai pola pemakaian nyata |
| Charset `utf8mb4` | 🟢 | Aman untuk emoji & karakter khusus |
| Denormalisasi historis | 🟢 | Keputusan tepat, hanya perlu didokumentasikan |
| `password VARCHAR(255)` | 🟢 | Sudah siap menampung bcrypt tanpa ubah skema |
| Nilai `DEFAULT` yang aman | 🟢 | `'Istirahat di UKS'` adalah default yang bijak |
| Satu sumber kebenaran | 🔴 | **3 definisi skema berbeda + 1 kode mati** |
| Integritas referensial | 🔴 | **0 FOREIGN KEY** |
| Password tersimpan | 🔴 | Teks biasa di 3 tempat (`.sql`, `initDB.js`, DB) |
| Jejak audit petugas | 🔴 | Tidak ada `petugas_id` di `kunjungan` |
| Pemakaian `waktu_keluar` | 🔴 | Kolom ada, tidak pernah diisi |
| Konsistensi `.sql` ↔ `initDB.js` | 🟡 | Saat ini sinkron, tapi tidak ada penjaga |
| `pengaturan_sekolah` → laporan | 🔴 | Data ada tapi diabaikan saat cetak |

---

# BAGIAN 5 — ROUTES LENGKAP

## 5.1 Apa itu route, dalam bahasa sederhana

> 🧠 **Analogi:** bayangkan kantor sekolah dengan meja resepsionis. Setiap orang datang membawa dua informasi: **mau ke ruangan mana** (URL) dan **mau melakukan apa** (metode HTTP). Resepsionis melihat kombinasi keduanya, lalu mengarahkan ke petugas yang tepat.
>
> - `GET /api/siswa` = *"Saya mau **melihat** daftar siswa"*
> - `POST /api/siswa` = *"Saya mau **menambah** siswa baru"*
> - `PUT /api/siswa/5` = *"Saya mau **mengubah** siswa nomor 5"*
> - `DELETE /api/siswa/5` = *"Saya mau **menghapus** siswa nomor 5"*
>
> **Route adalah resepsionis itu.** File di folder `routes/` hanya berisi tabel pengarahan — tidak ada logika di dalamnya. Itu sudah benar: tugas route hanya menunjuk arah, bukan bekerja.

## 5.2 Tabel lengkap 14 endpoint

| # | Metode | URL | Controller & fungsi | Dijaga? | Dipakai frontend? | Status |
|---|---|---|---|---|---|---|
| 1 | GET | `/` | *(inline di `app.js`)* redirect | ❌ | — | ⚠️ Alamat di-*hardcode* |
| 2 | GET | `/api/health` | *(inline di `app.js`)* | ❌ | ❌ Tidak dipanggil | ✅ Berfungsi |
| 3 | POST | `/api/auth/login` | `authController.loginUser` | — | ✅ `Login.jsx` | 🔴 Password teks biasa |
| 4 | POST | `/api/auth/register` | `authController.registerUser` | ❌ | ✅ `Register.jsx` | 🔴 Terbuka untuk umum |
| 5 | GET | `/api/siswa` | `siswaController.getSiswa` | ❌ | ✅ `DataContext` | ⚠️ Tanpa `LIMIT` |
| 6 | POST | `/api/siswa` | `siswaController.createSiswa` | ❌ | ✅ `DataContext` | ⚠️ Tanpa validasi |
| 7 | PUT | `/api/siswa/:id` | `siswaController.updateSiswa` | ❌ | ✅ `DataContext` | 🔴 Gagal karena id `Date.now()` |
| 8 | DELETE | `/api/siswa/:id` | `siswaController.deleteSiswa` | ❌ | ✅ `DataContext` | 🔴 Gagal karena id `Date.now()` |
| 9 | GET | `/api/kunjungan` | `kunjunganController.getKunjungan` | ❌ | ✅ `DataContext` | ✅ Berfungsi |
| 10 | POST | `/api/kunjungan` | `kunjunganController.createKunjungan` | ❌ | ✅ `DataContext` | ⚠️ Tanpa validasi |
| 11 | **PUT** | **`/api/kunjungan/:id`** | **— TIDAK ADA —** | — | — | 🔴 **HILANG** |
| 12 | DELETE | `/api/kunjungan/:id` | `kunjunganController.deleteKunjungan` | ❌ | ✅ `DataContext` | 🔴 Gagal karena id `Date.now()` |
| 13 | GET | `/api/laporan` | `laporanController.getMonthlyReport` | ❌ | ❌ **Tidak pernah dipanggil** | 🔴 Setengah jadi |
| 14 | GET | `/api/pengaturan` | `pengaturanController.get` | ❌ | ✅ `Pengaturan.jsx` | 🔴 *Fallback* bocor data |
| 15 | PUT | `/api/pengaturan/petugas` | `pengaturanController.updatePetugas` | ❌ | ✅ `Pengaturan.jsx` | 🔴 `X-User-Id` bisa dipalsukan |
| 16 | PUT | `/api/pengaturan/sekolah` | `pengaturanController.updateSekolah` | ❌ | ✅ `Pengaturan.jsx` | ⚠️ `WHERE id = 1` kaku |

**Angka ringkasnya:**

- **16 endpoint** terdaftar (14 di `/api` + 1 redirect + 1 health)
- **0 endpoint** dilindungi autentikasi server
- **2 endpoint** tidak pernah dipanggil frontend (`/api/health`, `/api/laporan`)
- **1 endpoint** yang seharusnya ada tapi hilang (`PUT /api/kunjungan/:id`)
- **4 endpoint** rusak fungsional karena masalah id `Date.now()` (#7, #8, #12, dan efek berantainya)

## 5.3 Isi kelima file route

Kelima file ini sangat pendek, jadi saya tampilkan seluruhnya supaya Anda bisa melihat polanya.

```js
// routes/authRoutes.js
router.post('/login', loginUser)
router.post('/register', registerUser)

// routes/siswaRoutes.js
router.get('/', getSiswa)
router.post('/', createSiswa)
router.put('/:id', updateSiswa)
router.delete('/:id', deleteSiswa)

// routes/kunjunganRoutes.js
router.get('/', getKunjungan)
router.post('/', createKunjungan)
router.delete('/:id', deleteKunjungan)      // ← 🔴 tidak ada router.put

// routes/laporanRoutes.js
router.get('/', laporanController.getMonthlyReport)

// routes/pengaturanRoutes.js
router.get('/', pengaturanController.get)
router.put('/petugas', pengaturanController.updatePetugas)
router.put('/sekolah', pengaturanController.updateSekolah)
```

### ✅ Yang sudah baik

**1. Route benar-benar "tipis".** Tidak ada satu baris logika bisnis di dalam folder `routes/`. Semuanya diserahkan ke controller. Ini pemisahan tanggung jawab yang **tepat** dan membuat kode mudah dibaca — Anda bisa melihat seluruh permukaan API hanya dengan membaca 5 file pendek ini.

**2. Penamaan URL mengikuti konvensi REST.** Kata benda jamak (`/siswa`, `/kunjungan`), bukan kata kerja (`/getSiswa`, `/hapusSiswa`). Ini standar industri dan membuat API mudah diprediksi.

**3. `/api/pengaturan/petugas` dan `/api/pengaturan/sekolah` dipisah.** Ini keputusan yang bagus. Kalau digabung jadi satu `PUT /api/pengaturan`, controller harus menebak bagian mana yang mau diubah. Dengan dipisah, maksudnya jelas dan validasinya bisa spesifik.

### ⚠️ Ketidakkonsistenan gaya ekspor

Perhatikan ada **dua gaya berbeda** di project ini:

```js
// Gaya A — named export per fungsi (authController, siswaController, kunjunganController)
export async function getSiswa(req, res) { ... }
import { getSiswa, createSiswa } from '../controllers/siswaController.js'

// Gaya B — satu objek berisi method (laporanController, pengaturanController)
export const pengaturanController = { get: async (req, res) => {...}, ... }
import { pengaturanController } from '../controllers/pengaturanController.js'
```

Ini bukan bug — keduanya bekerja. Tapi campuran gaya seperti ini membuat pengembang harus mengingat "yang mana pakai gaya apa" setiap kali membuka file. Untuk project yang akan dirawat jangka panjang, sebaiknya pilih satu. Saya sarankan **Gaya A** (named export) karena lebih mudah dilacak oleh editor dan lebih ramah *tree-shaking*.

### 🔴 Masalah utama: tidak ada satu pun *guard* di lapisan route

Inilah tempat yang **paling tepat** untuk memasang perlindungan, dan justru di sini yang kosong. Bandingkan:

```js
// KONDISI SEKARANG — siapa pun bisa lewat
router.get('/', getSiswa)
router.delete('/:id', deleteSiswa)
```

```js
// SEHARUSNYA — ada pemeriksa di depan
router.get('/', requireAuth, getSiswa)
router.delete('/:id', requireAuth, requireRole('Petugas UKS'), deleteSiswa)
```

> 🧠 **Cara kerjanya:** di Express, Anda bisa menyelipkan fungsi pemeriksa **sebelum** controller. Kalau pemeriksa memanggil `next()`, permintaan diteruskan. Kalau pemeriksa mengirim `res.status(401)`, permintaan **berhenti di situ** dan controller tidak pernah dijalankan.
>
> Ini seperti menempatkan petugas keamanan di depan pintu setiap ruangan, bukan hanya di lobi.

Kode lengkap untuk `requireAuth` dan `requireRole` ada di [Solusi #1](#solusi-1--pasang-autentikasi-nyata-di-sisi-server).

## 5.4 Kesenjangan CRUD: tabel perbandingan

Untuk melihat mana yang lengkap dan mana yang bolong:

| Sumber daya | Create | Read | Update | Delete | Catatan |
|---|:---:|:---:|:---:|:---:|---|
| `siswa` | ✅ | ✅ | ✅ | ✅ | Lengkap |
| `kunjungan` | ✅ | ✅ | 🔴 | ✅ | **Update hilang** |
| `pengaturan_sekolah` | ⚠️ | ✅ | ✅ | — | Create disemai lewat `initDB.js`; Delete memang tidak perlu |
| `users` | ✅ (register) | ⚠️ (hanya diri sendiri) | ⚠️ (hanya diri sendiri) | 🔴 | Tidak ada cara menghapus/menonaktifkan akun |

**Dua kesenjangan yang berdampak nyata:**

**1. `kunjungan` tidak bisa di-*update*.** Sudah dibahas di Bagian 3.5. Dampaknya berantai: `waktu_keluar` tak pernah terisi → kartu "siswa sedang istirahat di UKS" tak bisa akurat → petugas harus hapus-dan-buat-ulang untuk koreksi sekecil apa pun.

**2. Akun tidak bisa dihapus atau dinonaktifkan.** Kalau seorang guru pindah sekolah, akunnya tetap hidup selamanya dengan akses penuh ke seluruh data kesehatan siswa. Untuk aplikasi yang menyimpan data sensitif, kemampuan mencabut akses adalah kebutuhan dasar, bukan fitur tambahan.

## 5.5 Bagaimana permintaan mengalir melalui route: contoh konkret

Mari lacak satu permintaan sampai ke ujung, supaya jelas siapa mengerjakan apa.

```
Petugas menekan tombol "Hapus" pada baris siswa Andi
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│ 1. DataContext.jsx  →  api.siswa.delete(5)                      │
└──────────────────────────┬──────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. utils/api.js  →  fetch('/api/siswa/5', {                      │
│                        method: 'DELETE',                         │
│                        headers: { 'X-User-Id': '1' } })          │
└──────────────────────────┬──────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. Proxy Vite  →  meneruskan ke localhost:3000/api/siswa/5       │
└──────────────────────────┬──────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. app.js middleware:  cors() → morgan() → express.json()        │
│    🔴 DI SINI TIDAK ADA PEMERIKSAAN "SIAPA KAMU?"                │
└──────────────────────────┬──────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. app.js:39  app.use('/api/siswa', siswaRoutes)                 │
│    Awalan '/api/siswa' cocok → sisa URL menjadi '/5'             │
└──────────────────────────┬──────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. siswaRoutes.js:9  router.delete('/:id', deleteSiswa)          │
│    Metode DELETE + pola '/:id' cocok → req.params.id = '5'       │
└──────────────────────────┬──────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ 7. siswaController.deleteSiswa                                   │
│    pool.query('DELETE FROM siswa WHERE id = ?', [5])             │
└──────────────────────────┬──────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ 8. MySQL menghapus baris. Kunjungan Andi menjadi ORPHAN          │
│    (siswa_id = 5 kini menunjuk ke siswa yang tak ada)            │
│    ⚠️ Tidak ada FK, jadi database tidak protes.                   │
│    ✅ Riwayat masih terbaca karena nama disalin di kunjungan.     │
└─────────────────────────────────────────────────────────────────┘
```

Perhatikan langkah 4: itulah **satu-satunya tempat** di mana perlindungan seharusnya berdiri, dan itulah yang kosong.

---

# BAGIAN 6 — MVC RELATIONS: DI MANA HURUF "M"-NYA?

## 6.1 Apa itu MVC, dengan analogi rumah makan

> 🧠 **Bayangkan sebuah rumah makan:**
>
> - **View (Tampilan)** = **ruang makan & buku menu**. Yang dilihat dan disentuh pelanggan.
> - **Controller (Pengendali)** = **pelayan**. Menerima pesanan, membawanya ke dapur, mengantar makanan kembali. Pelayan **tidak memasak**.
> - **Model (Model)** = **koki & dapur**. Yang benar-benar tahu cara mengolah bahan. Resep tersimpan di sini.
>
> Kenapa dipisah? Supaya kalau Anda mengganti buku menu (View), koki tidak perlu tahu. Kalau Anda mengganti resep (Model), pelayan tidak perlu belajar ulang. Setiap bagian bisa diubah tanpa mengganggu yang lain.

Dalam istilah program:

| Huruf | Tugas | Contoh |
|---|---|---|
| **M**odel | Menyimpan & mengolah data. Tahu bentuk data dan aturannya. | "Cara mengambil siswa dari database", "Cara memvalidasi NIS" |
| **V**iew | Menampilkan ke pengguna. Tidak tahu asal data. | Tabel HTML, form, grafik |
| **C**ontroller | Menerima permintaan, memanggil Model, mengembalikan hasil ke View. | "Terima POST /siswa → suruh Model simpan → balas 201" |

## 6.2 Bagaimana MVC diterapkan di project ini

```
┌────────────────────────────────────────────────────────────────────────┐
│                       YANG SEHARUSNYA (MVC penuh)                      │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│   VIEW              CONTROLLER              MODEL           DATABASE   │
│   ────              ──────────              ─────           ────────   │
│                                                                        │
│  React    ──HTTP──►  siswaController  ──►  siswaModel  ──SQL──► MySQL  │
│  pages               • baca req.body       • validasi                  │
│                      • panggil Model       • query SQL                 │
│                      • susun respons       • bentuk data               │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│                     YANG SEBENARNYA TERJADI DI SINI                    │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│   VIEW                    CONTROLLER                        DATABASE   │
│   ────                    ──────────                        ────────   │
│                                                                        │
│  React    ──HTTP──►  siswaController  ─────────SQL─────────►  MySQL    │
│  pages               • baca req.body                                   │
│                      • TULIS SQL SENDIRI  ← 🔴 tugas Model             │
│                      • susun respons          dikerjakan Controller     │
│                                                                        │
│                          ╔═══════════════════════╗                     │
│                          ║   TIDAK ADA MODEL     ║                     │
│                          ╚═══════════════════════╝                     │
└────────────────────────────────────────────────────────────────────────┘
```

**Bukti konkret** — inilah isi sesungguhnya sebuah controller:

```js
// controllers/kunjunganController.js
import pool from '../db/db.js'                                   // ← langsung ke database

export async function getKunjungan(req, res) {
  try {
    const [rows] = await pool.query('SELECT * FROM kunjungan ORDER BY id DESC')  // ← SQL di controller
    const formatted = rows.map((r) => ({ ...r, is_darurat: Boolean(r.is_darurat) }))
    return res.json({ success: true, data: formatted })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}
```

Controller ini merangkap **tiga peran sekaligus**: menerima permintaan (tugas Controller), menulis SQL (tugas Model), dan mengubah bentuk data (tugas Model). Tidak ada folder `models/` di project ini.

## 6.3 Apakah ini salah? Jawaban jujur: belum tentu

Saya tidak akan mengatakan "ini salah, harus segera dibongkar." Mari kita nilai secara adil.

**Pola ini punya nama resmi: *Thin Route → Fat Controller*.** Untuk aplikasi kecil, pola ini **sah dan bahkan disarankan** oleh banyak praktisi, karena:

| Keuntungan | Penjelasan |
|---|---|
| Lebih sedikit file | 1 tempat untuk dibaca, bukan 2. Untuk 4 tabel, lapisan tambahan terasa berlebihan. |
| Lebih mudah dilacak | Buka `siswaController.js`, semua yang terjadi ada di situ. Tidak perlu lompat antar file. |
| Cocok untuk tim kecil | Tidak ada "aturan tak tertulis" yang harus dipelajari anggota baru. |

**Tapi pola ini mulai menyakitkan ketika satu hal terjadi: logika yang sama dibutuhkan di dua tempat.** Dan di project ini, hal itu **sudah terjadi**. Tiga contohnya:

### Contoh 1 — aturan username ditulis TIGA kali

| Lokasi | Isinya |
|---|---|
| `controllers/authController.js:7` | `USERNAME_REGEX = /^[a-z][a-z0-9_]{3,19}$/` + fungsi `validateUsername` lengkap |
| `frontend/src/context/AuthContext.jsx` | Salinan `validateUsername` yang hampir sama |
| `frontend/src/pages/Pengaturan.jsx` | Versi **ketiga yang lebih longgar** — hanya membersihkan karakter, tanpa cek panjang minimal |

Akibat nyatanya sudah saya jelaskan: lewat halaman Pengaturan, seseorang bisa menyimpan username `ab` — yang **tidak akan pernah bisa dipakai login** karena backend menolaknya. Pengguna terkunci di luar akunnya sendiri, dan tidak ada satu pun pesan error yang menjelaskan kenapa.

**Ini persis gejala tidak adanya Model:** aturan tentang "apa itu username yang sah" tidak punya rumah. Jadi ia dicangkokkan di mana-mana, dan salinannya bercabang.

### Contoh 2 — perhitungan keluhan ditulis dua kali dengan hasil berbeda

```js
// Dashboard.jsx — MEMECAH per koma  ✅ benar
k.keluhan_utama.split(',').forEach((raw) => {
  const keluhan = raw.trim()
  keluhanMap[keluhan] = (keluhanMap[keluhan] || 0) + 1
})
```

```js
// LaporanAnalitik.jsx — TIDAK memecah  ❌ salah
keluhanCount[k.keluhan_utama] = (keluhanCount[k.keluhan_utama] || 0) + 1
```

Data yang sama, dua hasil berbeda. Kalau ada tabel `Statistik` sebagai Model, perhitungan ini hanya ada di satu tempat dan mustahil bercabang.

### Contoh 3 — bentuk data siswa didefinisikan ulang di banyak tempat

Tidak ada satu pun tempat di project ini yang menyatakan *"inilah bentuk sebuah objek Siswa."* Akibatnya, setiap file menebak sendiri: `DataSiswa.jsx` mengasumsikan ada `nis`, `nama`, `kelas`; `siswaController` mengasumsikan ada `jenis_kelamin`, `tanggal_lahir`, `nama_wali`. Kalau nanti ada kolom baru, Anda harus mencarinya di seluruh project.

## 6.4 Perbandingan lapisan: yang ada vs yang ideal

| Lapisan | Ada? | Yang mengerjakan sekarang | Risiko |
|---|:---:|---|---|
| **Route** | ✅ | `routes/*.js` — tipis dan bersih | — |
| **Middleware autentikasi** | 🔴 | **Tidak ada** | Semua data terbuka |
| **Middleware validasi** | 🔴 | **Tidak ada** (`zod` terpasang, tak dipakai) | Data ngawur masuk DB |
| **Controller** | ✅ | `controllers/*.js` | Merangkap tugas Model |
| **Service / logika bisnis** | 🔴 | Tersebar di controller & komponen React | Logika ganda & bercabang |
| **Model / akses data** | 🔴 | **Tidak ada** — SQL langsung di controller | Query sulit dipakai ulang |
| **Database** | ✅ | MySQL via `pool` | — |

## 6.5 Di mana "View" berada? Ini bagian yang menarik

Di MVC klasik (seperti PHP/Laravel), View adalah *template* yang dirender **di server**. Tapi di project ini, View adalah **aplikasi React terpisah** yang berjalan di browser.

Artinya arsitekturnya sebenarnya bukan MVC murni, melainkan:

```
   ┌───────────────────────────────┐         ┌──────────────────────────┐
   │   CLIENT (React SPA)          │         │  SERVER (Express API)    │
   │                               │         │                          │
   │   • View     = pages/         │         │  • Route                 │
   │   • ViewModel= context/       │◄──JSON─►│  • Controller (+Model)   │
   │   • Client   = utils/api.js   │         │  • Database              │
   └───────────────────────────────┘         └──────────────────────────┘
             "Frontend MVVM"                        "Backend MVC-tanpa-M"
```

**Ini pola modern yang benar** dan bukan kekurangan. Yang penting dipahami: karena View hidup di komputer pengguna, **View tidak bisa dipercaya**. Semua aturan penting harus ditegakkan **di sisi server**. Inilah akar dari masalah keamanan yang saya bahas di Bagian 3 — perlindungan dipasang di View (`ProtectedRoute`), padahal View adalah bagian yang paling mudah dilewati.

## 6.6 Rekomendasi saya soal MVC — dan alasannya

**Saya TIDAK menyarankan Anda membuat folder `models/` sekarang.** Alasannya:

1. Aplikasi ini hanya punya 4 tabel dan operasi CRUD sederhana. Menambah lapisan Model berarti menambah ~5 file lagi **tanpa menyelesaikan satu pun masalah nyata** dari 41 temuan di dokumen ini.
2. Aturan project Anda melarang mengubah struktur folder.
3. Masalah nyata bukan "tidak ada folder models", melainkan **"logika yang sama ditulis berulang di tempat berbeda."**

**Yang saya sarankan: selesaikan masalahnya, bukan polanya.** Buat 3 file "penampung logika bersama" **di dalam folder yang sudah ada** — tanpa mengubah struktur:

| File baru | Isi | Menyelesaikan |
|---|---|---|
| `controllers/validators.js` | Aturan username, siswa, kunjungan (satu-satunya salinan) | Contoh 1 & 3 |
| `frontend/src/utils/statistik.js` | Semua perhitungan (top keluhan, tren, filter periode) | Contoh 2 |
| `middleware.js` *(di root, sejajar `app.js`)* | `requireAuth`, `requireRole`, penangan error | Masalah keamanan |

Ketiganya adalah **file baru di folder yang sudah ada** — struktur folder tidak berubah sedikit pun. Kode lengkapnya ada di [Bagian 9](#bagian-9--solusi-praktis--alasan-logisnya).

> **Prinsipnya:** pola arsitektur (MVC, MVVM, dsb.) adalah **alat untuk mencegah duplikasi**, bukan tujuan itu sendiri. Kalau duplikasinya bisa dihilangkan tanpa membongkar struktur, itu pilihan yang lebih baik — lebih sedikit risiko, lebih sedikit pekerjaan, hasil yang sama.

---

# BAGIAN 7 — FRONTEND DIBEDAH

## 7.1 Susunan Provider di `App.jsx`

```jsx
<ToastProvider>            {/* notifikasi — paling luar agar semua bisa memanggil */}
  <AuthProvider>           {/* siapa yang login */}
    <DataProvider>         {/* daftar siswa & kunjungan */}
      <BrowserRouter>      {/* navigasi halaman */}
```

### ✅ Urutan `ToastProvider` di luar sudah benar

`AuthProvider` dan `DataProvider` mungkin perlu memunculkan notifikasi, jadi `ToastProvider` harus membungkus keduanya. Urutan ini sudah tepat.

### 🔴 Masalah A: `BrowserRouter` berada di dalam, bukan di luar

Karena `BrowserRouter` adalah lapisan **paling dalam**, maka `AuthProvider` dan `DataProvider` **tidak bisa memakai `useNavigate()`**. Akibat praktisnya: ketika sesi berakhir atau server menolak permintaan, context tidak bisa mengarahkan pengguna ke halaman login secara otomatis. Pengalihan harus dilakukan manual di setiap halaman.

**Yang benar:** `BrowserRouter` di lapisan paling luar (tepat di bawah `ToastProvider`).

### 🔴 Masalah B: `DataProvider` memuat data walau belum login

`DataProvider` menjalankan `syncWithBackend()` di `useEffect` saat komponen dipasang — dan ia dipasang **sebelum** `ProtectedRoute` sempat memeriksa apa pun. Artinya:

> Saat seseorang membuka halaman `/login` — bahkan sebelum mengetik apa pun — browser sudah mengunduh **seluruh data siswa dan seluruh riwayat kunjungan** ke memori dan menyimpannya ke `localStorage`.

Dikombinasikan dengan tidak adanya autentikasi di server (Bagian 3.2), ini berarti data kesehatan siswa **tersimpan permanen di disk komputer** siapa pun yang cukup membuka halaman login.

### ⚠️ Masalah C: `<Route path="*">` berada di dalam route terlindungi

```jsx
<Route path="*" element={<Navigate to="/" replace />} />   // di dalam ProtectedRoute
```

URL salah ketik oleh pengguna yang belum login akan memicu `ProtectedRoute` → dilempar ke `/login`. Ini kebetulan berperilaku benar, tapi bukan karena dirancang begitu. Tidak ada halaman 404 yang ramah.

## 7.2 `AuthContext.jsx` — pengelolaan sesi

### ✅ Yang sudah baik

**Pemakaian `sessionStorage`, bukan `localStorage`, untuk data user.** Ini keputusan keamanan yang **tepat dan disengaja**: `sessionStorage` terhapus otomatis saat tab ditutup. Untuk komputer bersama di ruang UKS, ini jauh lebih aman daripada `localStorage` yang bertahan selamanya.

**`logout()` membersihkan keduanya:**

```js
sessionStorage.removeItem('uks_user')
localStorage.removeItem('uks_user')     // ← membersihkan sisa versi lama
```

Ini pembersihan defensif yang bagus.

### 🔴 Masalah A: `logout()` tidak membersihkan data siswa & kunjungan

Perhatikan yang **tidak** dihapus:

```js
// TIDAK dihapus saat logout:
localStorage.removeItem('uks_siswa_data_clean')       // ← tidak ada
localStorage.removeItem('uks_kunjungan_data_clean')   // ← tidak ada
```

**Skenario nyatanya:** Petugas UKS memakai komputer bersama di kantor guru. Ia login, bekerja, lalu logout dengan benar. **Seluruh data siswa dan riwayat kesehatan tetap tersimpan di `localStorage` komputer itu** — bisa dibaca siapa pun yang membuka Developer Tools, bahkan tanpa login.

Ini kebocoran data yang berbahaya karena petugas **merasa sudah aman** setelah logout.

### 🔴 Masalah B: tidak ada `try/catch` pada `sessionStorage.setItem`

```js
const updateUser = (userData) => {
  setUser((prev) => {
    const updated = { ...prev, ...userData }
    sessionStorage.setItem('uks_user', JSON.stringify(updated))   // ← bisa melempar error
    return updated
  })
}
```

Dua masalah sekaligus:
1. `setItem` bisa gagal (mode privat Safari, kuota penuh) dan melempar error **di dalam fungsi updater React** — ini bisa merusak state.
2. **Efek samping di dalam fungsi updater `setState`** adalah anti-pola React. Di React 19 Strict Mode, updater bisa dipanggil dua kali; efek samping seharusnya berada di `useEffect`.

Bandingkan dengan pembacaan awal (baris 17-27) yang **sudah** memakai `try/catch` — jadi ketidakkonsistenannya jelas.

### ⚠️ Masalah C: `validateUsername` ada di sini **dan** di backend

Sudah dibahas di Bagian 6.3. Ini salinan kedua dari tiga.

## 7.3 `DataContext.jsx` — pusat semua masalah data

Ini file paling bermasalah di frontend. Saya sudah membahas 2 masalah di Bagian 2; berikut daftar lengkapnya.

### 🔴 Masalah A: ID dibuat di klien (dampak berantai besar)

```js
const newSiswa = { id: siswaData.id || Date.now(), ...siswaData }
```

Sudah dijelaskan di Bagian 2.3. **Tapi ada dampak yang lebih dalam dari sekadar hapus-gagal:**

Perhatikan urutan `{ id: ..., ...siswaData }`. Karena `...siswaData` disebar **setelah** `id`, kalau `siswaData` kebetulan sudah punya properti `id`, nilai itu akan **menimpa** `id` yang baru dibuat. Di `DataSiswa.jsx`, `formData` tidak punya `id`, jadi saat ini aman — tapi ini kerapuhan yang menunggu terpicu.

**Dampak berantai penuh:**

| Aksi | Yang terjadi | Yang dilihat pengguna |
|---|---|---|
| Tambah siswa | Client: `id = 1754280000000`<br>MySQL: `id = 1` | Tampak berhasil ✅ |
| Edit siswa (sebelum refresh) | `PUT /api/siswa/1754280000000` → 0 baris diubah | "Berhasil diperbarui!" ❌ padahal tidak |
| Hapus siswa (sebelum refresh) | `DELETE /api/siswa/1754280000000` → 0 baris dihapus | Hilang dari layar ❌ tapi masih di DB |
| Refresh halaman | Data diambil ulang dari MySQL dengan `id` asli | **Data yang "dihapus" muncul lagi** 👻 |

### 🔴 Masalah B: error API ditelan tanpa jejak

```js
try {
  if (api && api.siswa) await api.siswa.create(newSiswa)
} catch (err) {
  // Saved in local state
}
```

Blok `catch` benar-benar kosong — bahkan tanpa `console.error`. Sudah dibahas di Bagian 2.3 sebagai skenario kehilangan data paling mungkin.

**Yang membuatnya lebih buruk:** halaman pemanggil menampilkan notifikasi sukses **tanpa syarat**:

```js
// PendaftaranKunjungan.jsx
await addKunjungan(newRecord)
setSuccessData(newRecord)
toast.success(`Kunjungan ${selectedSiswa.nama} berhasil disimpan!`)   // ← selalu tampil
```

Karena `addKunjungan` tidak pernah melempar error, `toast.success` **pasti** berjalan — walau database mati.

### 🔴 Masalah C (BARU): `localStorage` hanya ditulis, tidak pernah dibaca

Ini temuan yang saya verifikasi khusus. Perhatikan:

```js
const [siswaList, setSiswaList] = useState([])          // ← selalu mulai dari array KOSONG
const [kunjunganList, setKunjunganList] = useState([])  // ← selalu mulai dari array KOSONG
```

Lalu ada **tiga** tempat yang **menulis** ke `localStorage` (baris 34, 45, 62, 68), tapi **nol** tempat yang **membacanya** untuk mengisi state awal.

**Artinya seluruh mekanisme `localStorage` di file ini tidak berguna** — ia hanya menyalin data ke disk tanpa pernah dipakai. Konsekuensinya:

1. **Klaim "bisa offline" tidak benar.** Kalau server mati dan halaman di-*refresh*, aplikasi tampil kosong meskipun `localStorage` penuh data.
2. **Data sensitif tersimpan di disk tanpa manfaat apa pun** — semua risiko, nol keuntungan.
3. Kalau `addSiswa` menyimpan hanya ke state (karena server mati), lalu halaman di-*refresh*, data itu hilang selamanya — padahal komentar `// Saved in local state` menyiratkan sebaliknya.

**Ini membuat komentar di blok `catch` menjadi menyesatkan.** Data itu **tidak** aman.

### 🔴 Masalah D: tidak ada `updateKunjungan` sama sekali

Context hanya mengekspos `addKunjungan` dan `deleteKunjungan`. Konsisten dengan tidak adanya `PUT /api/kunjungan/:id` di backend.

### 🔴 Masalah E (BARU): `deleteSiswa` menghapus dari state sebelum server dikonfirmasi

```js
const deleteSiswa = async (id) => {
  setSiswaList((prev) => prev.filter((s) => s.id !== id))   // ① hapus dari layar DULU
  try {
    if (api && api.siswa) await api.siswa.delete(id)        // ② baru kirim ke server
  } catch (err) { }                                          // ③ gagal? diam saja
}
```

Kalau langkah ② gagal, tidak ada *rollback*. Data hilang dari layar tapi tetap ada di server — persis kebalikan dari yang diharapkan pengguna.

### ⚠️ Masalah F: tidak ada indikator *loading* atau *error* sama sekali

Context tidak mengekspos `loading` atau `error`. Jadi tidak ada halaman yang bisa menampilkan "Sedang memuat…" atau "Gagal terhubung ke server". Pengguna hanya melihat tabel kosong dan tidak tahu apakah itu karena datanya memang belum ada, atau karena servernya mati.

Menariknya, file `hooks/useApi.js` yang menyediakan tepat fungsi ini **ada tapi tidak pernah dipakai**.

### ⚠️ Masalah G: tidak ada pemuatan ulang setelah mutasi

Setelah `addSiswa`, tidak ada `syncWithBackend()` untuk mengambil data terbaru dari server. Ini yang membuat masalah `Date.now()` bertahan sampai pengguna me-*refresh* manual.

## 7.4 `utils/api.js` — lapisan pemanggil API

### ✅ Yang sudah baik

- Semua pemanggilan terpusat di satu file. Kalau nanti perlu menambah token JWT, cukup ubah satu fungsi `getHeaders`.
- `BASE_URL = '/api'` relatif → bekerja lewat proxy tanpa masalah CORS.
- Ada penanganan `if (!res.ok) throw new Error(...)` — sudah benar.

### 🔴 Masalah A: tidak ada namespace `laporan`

```js
export const api = {
  get, post, put, del,
  siswa: { getAll, create, update, delete },
  kunjungan: { getAll, create, delete }        // ← tidak ada update
  // ← tidak ada laporan sama sekali
}
```

Ini yang membuat `GET /api/laporan` menjadi endpoint yatim.

### 🔴 Masalah B (BARU): `res.json()` bisa gagal untuk respons non-JSON

```js
const res = await fetch(url, config)
const data = await res.json()      // ← dipanggil TANPA syarat
```

Kalau server mengembalikan HTML (misalnya halaman error 502 dari proxy, atau `Not Found` teks polos dari handler 404 di `app.js`), `res.json()` akan melempar `SyntaxError: Unexpected token '<'`. Pesan yang muncul ke pengguna menjadi teknis dan membingungkan, bukan "Server tidak dapat dihubungi".

Perhatikan bahwa `app.js` **memang** mengembalikan teks polos `'Not Found'` untuk URL non-API — jadi kondisi ini bisa benar-benar terjadi.

### ⚠️ Masalah C: tidak ada *timeout*

Kalau server hidup tapi menggantung (misalnya MySQL sedang *lock*), `fetch` akan menunggu **selamanya**. Tidak ada `AbortController`, jadi antarmuka bisa tampak membeku tanpa penjelasan.

## 7.5 Halaman `LaporanAnalitik.jsx` — bug paling terlihat

### 🔴 Masalah A: mengambil data dari mock kosong

```js
// baris 31
import { kunjunganList, dataSekolah, petugasUks } from '../data/mockData'
```

Dan di `mockData.js` baris 26:

```js
export const kunjunganList = []
```

Halaman ini **tidak pernah memanggil `useData()`**. Semua perhitungan di baris 49–88 berjalan atas array kosong:

| Yang ditampilkan | Nilai sebenarnya | Selalu |
|---|---|---|
| Total Kunjungan | `kunjunganList.length` | **0** |
| Kasus Darurat | `.filter(...).length` | **0** |
| Kelas Terbanyak | `topKelas` | **`-`** |
| Keluhan Paling Sering | `topKeluhan` | **`-`** |
| Pie chart per kelas | `hasKelasData = false` | **Kosong** |
| Bar chart keluhan | `hasKeluhanData = false` | **Kosong** |
| 4 kartu status | semua `statusCount` | **0 (0%)** |
| Ringkasan naratif | `totalKunjungan > 0` = false | **"Belum ada data"** |
| **PDF yang diekspor** | `dataKunjungan={kunjunganList}` | **Tabel kosong** |

**Perbaikannya hanya 3 baris** — ganti impor dengan `useData()`. Detail di [Solusi #3](#solusi-3--perbaiki-halaman-laporan-yang-selalu-kosong).

### 🔴 Masalah B: filter bulan/tahun tidak memfilter apa pun

```js
const [selectedBulan, setSelectedBulan] = useState(new Date().getMonth() + 1)
const [selectedTahun, setSelectedTahun] = useState(new Date().getFullYear())
...
const periodeText = `${selectedBulanLabel} ${selectedTahun}`   // ← HANYA dipakai sebagai LABEL
```

Cari `selectedBulan` di seluruh file: ia hanya muncul di `useState`, di `CustomSelect`, dan di pembentukan `periodeText`. **Tidak pernah dipakai untuk menyaring `kunjunganList`.**

Ini lebih berbahaya daripada tidak punya filter sama sekali, karena laporan akan **mencetak judul "Periode: Maret 2026"** di atas data yang sebenarnya mencakup seluruh tahun. Kepala sekolah menerima dokumen resmi dengan label periode yang salah.

### 🔴 Masalah C: perhitungan keluhan berbeda dengan Dashboard

```js
// LaporanAnalitik.jsx baris 64-69
keluhanCount[k.keluhan_utama] = (keluhanCount[k.keluhan_utama] || 0) + 1
```

Tidak ada `.split(',')`. Jadi `"Pusing, Demam"` dihitung sebagai satu jenis keluhan bernama `"Pusing, Demam"`. Dashboard menghitungnya sebagai dua. **Dua halaman, satu data, dua angka berbeda.**

### ⚠️ Masalah D: `dataSekolah` diambil dari mock, bukan dari database

```js
kepalaSekolah={dataSekolah.kepala_sekolah}    // ← dari mockData.js, bukan dari API
```

Padahal `pengaturan_sekolah` di database punya nilai yang bisa diubah pengguna. Jadi mengubah nama kepala sekolah di Pengaturan **tidak berpengaruh** pada laporan.

### ⚠️ Masalah E: tema gelap di dalam layout terang

Halaman ini memakai `bg-slate-900/70`, `text-white`, `border-slate-800` — tapi `AppLayout` memakai `bg-white`. Hasilnya tabrakan visual.

## 7.6 Halaman `Dashboard.jsx`

### ✅ Yang sudah baik

- Benar memakai `useData()` (berbeda dengan Laporan).
- Memecah keluhan per koma dengan benar.
- Punya *empty state* yang informatif untuk grafik dan daftar.
- Tema terang, **konsisten** dengan `AppLayout`.

### 🔴 Masalah A: semua angka adalah total sepanjang masa, bukan periode

| Judul yang ditampilkan | Yang sebenarnya dihitung |
|---|---|
| "5 Keluhan Terbanyak **Bulan Ini**" | Seluruh keluhan **sepanjang sejarah** |
| Kartu "Kasus Darurat" | Total darurat **sepanjang sejarah** |
| Kartu "Kembali ke Kelas" | Total **sepanjang sejarah** |

Tidak ada satu pun filter tanggal. Judul "Bulan Ini" adalah klaim yang tidak dipenuhi kode.

Spesifikasi di `Preview, Prompt, and rules.md` meminta kartu **"kunjungan hari ini"**, **"siswa sedang istirahat di UKS"**, dan **"kasus darurat minggu ini"** — ketiganya tidak ada.

### 🔴 Masalah B (BARU): tren mingguan salah karena zona waktu

```js
const dateStr = date.toISOString().split('T')[0]              // ← UTC!
const total = kunjunganList.filter((k) => k.waktu_masuk?.startsWith(dateStr)).length
```

`toISOString()` selalu mengembalikan waktu **UTC**. Indonesia Barat adalah **UTC+7**.

**Contoh konkret kesalahannya:** hari ini tanggal 4 Agustus 2026 pukul 06.00 WIB. `new Date().toISOString()` menghasilkan `"2026-08-03T23:00:00Z"` → `dateStr = "2026-08-03"`. **Grafik menunjukkan tanggal kemarin sebagai "hari ini".**

Sementara itu `waktu_masuk` yang tersimpan berasal dari `DatePicker` yang memakai waktu **lokal**. Jadi perbandingannya membandingkan dua sistem waktu berbeda — kunjungan pagi hari (00.00–07.00 WIB) akan **terhitung di hari yang salah**.

### 🔴 Masalah C: `variant="success"` tidak ada di `StatCard`

```js
// Dashboard.jsx baris 120
<StatCard ... variant="success" />
```

```js
// StatCard.jsx — VARIANTS yang tersedia:
const VARIANTS = { default, warning, info, alert }    // ← tidak ada 'success'
const v = VARIANTS[variant] || VARIANTS.default        // ← diam-diam jatuh ke default
```

Kartu "Kembali ke Kelas" yang seharusnya hijau-sukses malah tampil dengan gaya default. Tidak ada error — hanya salah warna secara diam-diam.

### ⚠️ Masalah D: tidak ada sapaan "Selamat Datang"

Spesifikasi meminta **"Selamat Datang [Nama akun yang login]"**. Menariknya, fungsi `getGreeting()` **sudah ada** di `utils/formatters.js` (mengembalikan "Selamat pagi/siang/sore/malam") — tapi **tidak pernah dipanggil di mana pun**. Fiturnya sudah 90% siap, hanya belum disambungkan.

### ⚠️ Masalah E: `recentVisits` mengandalkan urutan dari server

```js
const recentVisits = kunjunganList.slice(0, 5)
```

Ini mengambil 5 item pertama, bukan 5 **terbaru**. Kebetulan benar karena backend memakai `ORDER BY id DESC`, tapi kalau urutan backend berubah, tampilan ikut salah tanpa peringatan. Sebaiknya diurutkan eksplisit berdasarkan `waktu_masuk`.

## 7.7 Halaman `RiwayatKunjungan.jsx`

### ✅ Yang sudah baik

- Filter gabungan (cari + kelas + status + darurat) diterapkan dengan benar dan efisien.
- Ada penghitung "Menampilkan X dari Y kunjungan" — umpan balik yang bagus.
- Modal detail lengkap dan rapi.

### 🔴 Masalah A: ekspor CSV rusak untuk data Indonesia

```js
`"${k.siswa_nama}"`,                    // ① dibungkus kutip, TAPI tidak di-escape
...
const csvContent = 'data:text/csv;charset=utf-8,' + [...].join('\n')
const encodedUri = encodeURI(csvContent)   // ② encodeURI, bukan encodeURIComponent
```

**Tiga masalah:**

1. **Kutip di dalam data merusak kolom.** Kalau `keterangan` berisi `Siswa bilang "pusing sekali"`, hasilnya `"Siswa bilang "pusing sekali""` → Excel salah membaca dan kolom bergeser. Aturan CSV: kutip di dalam data harus digandakan (`""`).

2. **Tidak ada BOM UTF-8.** Saat dibuka di Excel Indonesia, karakter seperti `°C` (dari contoh "suhu tubuh 38.5°C") akan tampil sebagai `Â°C`. Ini keluhan klasik pengguna Excel.

3. **`encodeURI` tidak meng-*encode* `#` dan `&`.** Kalau ada nama atau keterangan mengandung `#`, sisa file setelahnya akan **terpotong** karena browser menganggapnya sebagai *fragment*.

Tambahan: pendekatan `data:` URI punya batas ukuran di beberapa browser (~2 MB di Chrome lama). Untuk ribuan baris, ekspor bisa gagal diam-diam.

### 🔴 Masalah B: label periode di-*hardcode*

```jsx
<PrintReportTemplate
  periodeLabel="Tahun 2026"        // ← ditulis mati
```

Dokumen resmi yang dicetak akan **selalu** berbunyi "Periode: Tahun 2026" — bahkan di tahun 2027, dan bahkan ketika pengguna sudah memfilter hanya kelas 3 status darurat. Label tidak mencerminkan isi.

### 🔴 Masalah C: kolom "Aksi" hanya punya Detail, tidak ada Edit

Spesifikasi meminta **"Aksi (Detail/Edit)"**. Yang ada hanya tombol mata (Detail). Ini konsekuensi langsung dari tidak adanya `PUT /api/kunjungan/:id`.

### 🔴 Masalah D: tidak ada filter tanggal

Spesifikasi meminta filter **"by Tanggal"**. Yang tersedia: cari teks, kelas, status, darurat. **Tidak ada filter tanggal atau rentang tanggal** — padahal ini kebutuhan paling dasar untuk halaman riwayat.

### ⚠️ Masalah E: pencarian NIS *case-sensitive*

```js
k.siswa_nis?.includes(q)      // q sudah lowercase, tapi NIS tidak di-lowercase
```

Kalau NIS mengandung huruf (misalnya `"2024A15"`), mengetik `A` tidak akan menemukannya karena `q` sudah diubah ke huruf kecil. Kolom lain memakai `.toLowerCase()`, kolom ini tidak — inkonsistensi.

### ⚠️ Masalah F: data petugas & sekolah dari mock

```js
petugasName={user?.nama_lengkap || petugasUks.nama_lengkap}
kepalaSekolah={dataSekolah.kepala_sekolah}     // ← selalu dari mock
```

Sama dengan LaporanAnalitik — nama kepala sekolah tidak pernah diambil dari database.

## 7.8 Halaman `PendaftaranKunjungan.jsx`

### ✅ Yang sudah baik

- Alur 2 kolom (cari siswa → isi form) intuitif dan cocok dengan alur kerja nyata.
- Kartu info siswa menampilkan **nama wali & telepon wali** — sangat membantu saat darurat.
- Ada banner sukses dengan tombol "Daftar Kunjungan Baru" — alur berulang yang efisien.
- Penanganan zona waktu untuk nilai awal `waktuMasuk` **sudah benar**:
  ```js
  const tzoffset = now.getTimezoneOffset() * 60000
  return new Date(Date.now() - tzoffset).toISOString().slice(0, 16)
  ```
  Ini justru menunjukkan pengembang **paham** masalah zona waktu — sayangnya pemahaman itu tidak diterapkan di `Dashboard.jsx`.

### 🔴 Masalah A: `keluhan_utama` bisa terisi teks bebas yang panjang

```js
keluhan_utama: selectedKeluhan.join(', ') || keterangan
```

Kalau petugas tidak memilih keluhan tapi mengisi keterangan panjang, **seluruh keterangan** masuk ke `keluhan_utama` yang dibatasi `VARCHAR(255)`. Kalau lebih dari 255 karakter, MySQL akan menolak (atau memotong diam-diam, tergantung mode). Pesan error yang muncul ke pengguna adalah pesan SQL mentah.

Selain itu, teks bebas ini akan masuk ke statistik keluhan sebagai "jenis keluhan" tersendiri — mengotori grafik dengan entri unik yang tidak berarti.

### 🔴 Masalah B: tidak ada pengaman terhadap klik ganda

Tombol submit tidak punya state `loading` atau `disabled`. Kalau petugas mengklik "Simpan" dua kali dengan cepat (hal yang sangat umum), **dua catatan kunjungan identik** akan masuk ke database. Tidak ada pencegahan.

Bandingkan dengan `Pengaturan.jsx` yang **sudah** punya `disabled={loadingPetugas}` — jadi polanya sudah dikenal di project ini, hanya tidak diterapkan di sini.

### ⚠️ Masalah C: `waktu_masuk` bisa diisi tanggal masa depan

`DatePicker` mengizinkan memilih tanggal apa pun, termasuk tahun 2030. Tidak ada validasi bahwa waktu kunjungan tidak boleh di masa depan.

### ⚠️ Masalah D: `CustomSelect` menerima array string, bukan objek

```js
<CustomSelect options={statusOptions} ... />    // statusOptions = array string
```

Ini **bekerja** karena `CustomSelect` menormalisasi array string (baris 19–24). Tapi di halaman lain ia diberi array objek `{value, label}`. Dua bentuk pemanggilan berbeda untuk komponen yang sama — bukan bug, tapi menambah beban ingatan.

## 7.9 Halaman `DataSiswa.jsx`

### ✅ Yang sudah baik

- CRUD lengkap dengan modal konfirmasi hapus — praktik yang benar untuk aksi merusak.
- Modal konfirmasi menampilkan nama & NIS siswa, sehingga petugas bisa memastikan yang dihapus benar.
- Kolom tabel informatif (wali + telepon digabung dalam satu sel).

### 🔴 Masalah A: validasi terlalu longgar

```js
if (!formData.nis || !formData.nama) {
  toast.error('NIS dan Nama Lengkap wajib diisi!')
  return
}
```

Hanya dua kolom diperiksa. **Tidak ada** pemeriksaan:
- NIS duplikat → MySQL menolak dengan `Duplicate entry` mentah
- Format NIS (bisa diisi spasi, simbol, atau satu huruf)
- `tanggal_lahir` masuk akal (bisa diisi tahun 2050 atau 1900)
- Format `telepon_wali`

### 🔴 Masalah B (BARU): NIS duplikat menghasilkan pengalaman yang membingungkan

Karena `addSiswa` menelan error, urutan yang terjadi saat NIS duplikat adalah:

1. Siswa muncul di tabel (state React diperbarui) ✅
2. Server menolak dengan `Duplicate entry '123' for key 'siswa.nis'` ❌
3. Error ditelan `catch` kosong
4. Notifikasi **"Siswa baru berhasil ditambahkan!"** tampil ✅
5. Setelah refresh, siswa itu **hilang**

Pengguna melihat data hilang tanpa penjelasan apa pun.

### ⚠️ Masalah C: menghapus siswa tidak memperingatkan tentang riwayat kunjungan

Modal hapus berbunyi *"Action ini tidak dapat dibatalkan"* — tapi tidak menyebutkan bahwa siswa ini punya, misalnya, 12 riwayat kunjungan yang akan menjadi yatim. Petugas menghapus tanpa memahami dampaknya.

### ⚠️ Masalah D: campuran bahasa di antarmuka

*"**Action** ini tidak dapat dibatalkan"* — seharusnya "Tindakan ini tidak dapat dibatalkan". Kecil, tapi ini antarmuka berbahasa Indonesia untuk guru SD.

## 7.10 Halaman `Pengaturan.jsx`

### 🔴 Masalah A: `useEffect` dengan dependensi kosong memakai nilai yang berubah

```js
useEffect(() => {
  async function fetchData() {
    ...
    nama_lengkap: res.data.petugas.nama_lengkap || user?.nama_lengkap || '',   // ← pakai `user`
    ...
    updateUser(fetched)                                                        // ← pakai `updateUser`
  }
  fetchData()
}, [])        // ← 🔴 array kosong, padahal memakai `user` dan `updateUser`
```

Ini *stale closure*: `user` dan `updateUser` yang terbaca adalah versi dari render pertama. Kalau `user` berubah setelah itu, efek ini tetap memakai nilai lama. Saat ini kebetulan tidak menimbulkan bug terlihat, tapi ini pola yang rapuh dan akan dilaporkan oleh ESLint (`react-hooks/exhaustive-deps`).

### 🔴 Masalah B: username bisa disimpan dalam bentuk yang tidak sah

```js
onChange={(e) => setPetugas({
  ...petugas,
  username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')
})}
```

Hanya membersihkan karakter. **Tidak memaksa** minimal 4 karakter, dan **tidak melarang** diawali angka. Padahal label di bawahnya menulis *"Min 4, max 20 karakter"* — aturan yang ditampilkan tapi tidak ditegakkan.

Backend `updatePetugas` juga tidak memvalidasi. Jadi username `ab` atau `1abc` bisa tersimpan, lalu **login menjadi mustahil** karena `loginUser` memakai `validateUsername` yang ketat.

Ini jalur nyata menuju **terkunci dari akun sendiri** — dan sangat sulit dipulihkan tanpa akses langsung ke phpMyAdmin.

### 🔴 Masalah C (BARU): `updateUser` dipanggil saat memuat, menimpa sesi

```js
setPetugas(fetched)
updateUser(fetched)      // ← menimpa sessionStorage dengan data dari API
```

Ingat bahwa `GET /api/pengaturan` punya *fallback* `LIMIT 1` ketika `X-User-Id` tidak terkirim. Kalau karena suatu hal header itu hilang, halaman ini akan **mengambil identitas user pertama dan menimpa sesi pengguna yang sedang login dengan identitas orang lain.**

Ini bug identitas yang serius: petugas B bisa tiba-tiba "menjadi" petugas A di sesinya sendiri.

### ⚠️ Masalah D: error saat memuat sengaja disembunyikan

```js
} catch (err) {
  // Fallback ke data session yang sudah ada — tidak perlu tampilkan error
}
```

Pengguna tidak tahu bahwa yang ditampilkan adalah data sesi lama, bukan data terkini dari database. Ia bisa mengedit di atas data basi.

### ⚠️ Masalah E: `sekolah` diinisialisasi dari mock

```js
const [sekolah, setSekolah] = useState(fallbackSekolah)
```

Kalau API gagal, form menampilkan data mock (SDN 05 Parambahan, dst.) yang tampak seperti data asli. Pengguna bisa menekan Simpan dan **menimpa data database dengan nilai mock**.

## 7.11 Halaman `Login.jsx` dan `Register.jsx`

### 🔴 Masalah A: typo nama sekolah

```jsx
SDN 05 Prambahan       // ← baris 42, kurang huruf 'a'
```

Nama yang benar (dipakai di semua tempat lain): **Parambahan**. Ini adalah **halaman pertama** yang dilihat setiap pengguna, dan typo-nya ada pada nama sekolah itu sendiri.

### 🔴 Masalah B: tidak ada tautan ke halaman Register

Halaman `/register` ada dan berfungsi, tapi **tidak ada satu pun tautan menuju ke sana** dari halaman Login. Pengguna baru harus mengetik URL `/register` secara manual — sesuatu yang tidak akan terpikirkan oleh guru SD.

### 🔴 Masalah C: tabrakan tema antara Login dan Register

| Halaman | Tema |
|---|---|
| `Login.jsx` | **Terang** (`bg-white`, `border-slate-200`, `text-slate-900`) |
| `Register.jsx` | **Gelap** (glassmorphism, `text-white`) |

Dua halaman yang saling berhubungan langsung punya tampilan yang sama sekali berbeda. Pengguna akan merasa berpindah ke aplikasi lain.

### ⚠️ Masalah D: tidak ada pembatasan percobaan login

Tidak ada *rate limiting* di frontend maupun backend. Kombinasikan dengan password sederhana seperti `admin`, dan akun bisa ditebak dengan percobaan berulang tanpa hambatan.

## 7.12 Komponen bersama

### 🔴 `PageHeader.jsx` — teks putih di atas latar putih

```jsx
<h1 className="... text-white ...">      // teks PUTIH
<span className="... shadow-glow" />      // kelas tidak terdefinisi
```

Komponen ini bertema **gelap**, tapi `AppLayout` memakai `bg-white`. Hasilnya: **judul halaman berwarna putih di atas latar putih — tidak terlihat sama sekali.**

Halaman yang terdampak: **Pendaftaran, Riwayat, Data Siswa, Laporan, Pengaturan** — 5 dari 6 halaman. Hanya Dashboard yang lolos karena tidak memakai `PageHeader`.

### 🔴 `Toast.jsx` — notifikasi error tidak terbaca

```js
error: { bg: 'bg-coral-500', icon: '✕' }
```

`coral` **bukan** warna bawaan Tailwind, dan `index.css` **tidak punya blok `@theme`** untuk mendefinisikannya (saya sudah verifikasi — yang ada hanya `.text-gradient-coral` sebagai kelas CSS biasa, bukan token warna).

Akibatnya `bg-coral-500` tidak menghasilkan CSS apa pun → **toast error tampil tanpa warna latar**, hanya teks putih di atas transparan. **Pesan error praktis tidak terbaca** — padahal justru pesan error yang paling penting untuk dilihat.

Dua kelas lain di komponen yang sama juga tidak terdefinisi:
- `shadow-lifted` → tidak ada bayangan
- `rounded-[var(--radius-btn)]` → variabel CSS `--radius-btn` tidak pernah dideklarasikan, sudut tidak membulat

### 🔴 `PrintReportTemplate.jsx` — kop surat & NIP di-*hardcode*

```jsx
<h3>PEMERINTAH KABUPATEN SOLOK</h3>
<h3>DINAS PENDIDIKAN, PEMUDA DAN OLAHRAGA</h3>
<h1>SD NEGERI 05 PARAMBAHAN</h1>
<p>Alamat: Jl. Pendidikan No. 5, ... Kode Pos 27371</p>
```

```js
kepalaNip = '197508122005011002'      // ← NIP kepala sekolah, nilai default di-hardcode
```

Seluruh kop surat ditulis mati di JSX, mengabaikan tabel `pengaturan_sekolah`. Dan `kepalaNip` **tidak pernah dikirim** oleh pemanggil mana pun — jadi NIP kepala sekolah yang tercetak **selalu** nilai default ini, siapa pun kepala sekolahnya.

### 🔴 `PrintReportTemplate.jsx` — CSS cetak berisiko

```css
@media print {
  body * { visibility: hidden !important; }
  .print-area, .print-area * { visibility: visible !important; }
  .print-area { position: absolute !important; ... }
}
```

Teknik `visibility: hidden` pada semua elemen lalu dibalik ini **rapuh**: elemen yang tetap menempati ruang (karena `visibility` tidak menghapus dari alur tata letak, berbeda dengan `display: none`) bisa menghasilkan **halaman kosong** di awal atau di antara halaman PDF. Untuk dokumen resmi yang diserahkan ke kepala sekolah, halaman kosong di tengah adalah masalah nyata.

Selain itu tidak ada aturan `page-break-inside: avoid` pada baris tabel, sehingga satu baris data bisa terpotong di tengah antar halaman.

### 🔴 `PrintReportTemplate.jsx` — tabel tanpa batas jumlah baris

Kalau ada 2.000 kunjungan, `html2pdf` akan mencoba merender 2.000 baris menjadi satu kanvas gambar. Ini akan **membekukan browser** selama puluhan detik atau gagal total dengan kehabisan memori. Tidak ada peringatan atau pembatasan.

### ⚠️ `StatCard.jsx` — varian `success` tidak ada

Sudah dibahas di 7.6.

### ⚠️ `DataTable.jsx` — tidak ada pagination

```jsx
{data.map((row, idx) => ( ... ))}      // merender SEMUA baris
```

Dengan 3.000 kunjungan setelah satu tahun ajaran, tabel akan merender 3.000 baris DOM sekaligus. Halaman menjadi sangat lambat. Tidak ada *pagination* maupun *virtualization*.

Juga: `key={row.id || idx}` — memakai indeks sebagai cadangan bisa menyebabkan React salah memasangkan baris saat data difilter.

### ⚠️ `SearchAutocomplete.jsx` — pencarian di sisi klien saja

```js
const filtered = query.length >= 1 ? items.filter(...).slice(0, 10) : []
```

Menyaring **seluruh array di memori** setiap ketikan. Untuk 300 siswa masih cepat, tapi ini berarti seluruh data siswa harus sudah diunduh ke browser terlebih dulu. Juga tidak ada *debounce*.

Selain itu: dropdown tidak memakai React Portal (berbeda dengan `CustomSelect`), sehingga bisa terpotong oleh `overflow` induknya.

### ⚠️ `CustomSelect.jsx` — dropdown tidak menutup saat tombol Escape ditekan di luar fokus

Komponen ini bagus (memakai Portal, memperbarui posisi saat scroll), tapi tidak menangani tombol `Escape` dan tidak punya atribut ARIA (`role="listbox"`, `aria-expanded`). Untuk aksesibilitas keyboard, ini kurang.

### ⚠️ `Modal.jsx` — tidak ada *focus trap*

Modal tidak mengunci fokus keyboard di dalamnya, sehingga pengguna keyboard bisa "keluar" dari modal dengan Tab tanpa menutupnya.

### ⚠️ `DatePicker.jsx` — hari terpilih ditandai salah saat berpindah bulan

```js
const isSelected =
  dayNum === selectedDay &&
  viewMonth === currentDate.getMonth() &&      // ← membandingkan dengan currentDate,
  viewYear === currentDate.getFullYear()       //    bukan dengan bulan yang dipilih
```

`currentDate` dihitung ulang setiap render dari `value`. Setelah pengguna memilih tanggal di bulan lain, penandaan bisa tidak konsisten karena membandingkan dengan `currentDate` alih-alih bulan/tahun dari nilai terpilih.

### ⚠️ `TagSelector.jsx` — tidak ada batas jumlah pilihan

Pengguna bisa memilih ke-15 keluhan sekaligus → teks gabungan bisa melebihi `VARCHAR(255)`.

## 7.13 Styling & konfigurasi frontend

### 🔴 `index.css` menetapkan latar gelap yang selalu ditimpa

```css
body {
  background-color: #0B132B;     /* gelap */
  color: #F8FAFC;                /* teks terang */
}
```

Tapi `AppLayout` memakai `bg-white`. Jadi seluruh sistem desain gelap di `index.css` (glassmorphism, scrollbar gelap, gradien) **bertabrakan** dengan layout terang. Inilah akar dari semua masalah tema di project ini.

**Diagnosis akar masalah:** project ini tampaknya **awalnya dirancang bertema gelap** (bukti: `index.css`, semua komponen `common/`, halaman Register, Riwayat, Laporan, Pendaftaran, Pengaturan), lalu **sebagian diubah ke tema terang** (bukti: `AppLayout`, `Sidebar`, `Topbar`, `Dashboard`, `Login`, `StatCard`) — dan perubahan itu **tidak diselesaikan**. Ini bukan banyak bug terpisah, melainkan **satu migrasi tema yang berhenti di tengah jalan**.

### ✅ Koreksi penting: font **sudah** dimuat dengan benar

Saya periksa `frontend/index.html` baris 19–21:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:...&family=DM+Sans:..." rel="stylesheet" />
```

Plus Jakarta Sans dan DM Sans **dimuat dengan benar** melalui Google Fonts, lengkap dengan `preconnect` untuk performa. `index.css` juga mendeklarasikan `--font-display` dan `--font-body` dengan *fallback* yang wajar.

**Namun** kelas `font-display` yang dipakai di banyak komponen **bukan** kelas Tailwind yang valid tanpa konfigurasi `@theme`. Jadi elemen yang memakai `className="font-display"` tetap memakai font body, bukan Plus Jakarta Sans. Font-nya termuat, tapi tidak tersambung ke Tailwind.

### 🔴 `vite.config.js` — aturan cache PWA tidak pernah cocok

```js
urlPattern: /^http:\/\/localhost:3000\/api\/.*/i
```

Tapi aplikasi memanggil `/api/...` (relatif). Dari sudut pandang service worker, URL yang diminta adalah `http://localhost:5173/api/...` — **tidak pernah cocok** dengan pola di atas. Aturan cache ini tidak pernah aktif.

**Dan ini justru kebetulan yang menguntungkan.** Kalau polanya diperbaiki, service worker akan mulai men-*cache* data kesehatan siswa ke disk pengguna selama 5 menit (`maxAgeSeconds: 300`). Untuk data medis anak, **men-*cache* respons API bukan ide yang baik.** Rekomendasi saya: hapus `runtimeCaching` sepenuhnya, jangan diperbaiki.

### ⚠️ PWA `autoUpdate` tanpa pemberitahuan

`registerType: 'autoUpdate'` akan memperbarui aplikasi di latar belakang. Kalau petugas sedang mengisi form panjang saat pembaruan terjadi, halaman bisa dimuat ulang dan **data form hilang**.

### ⚠️ `App.css` — 100% kode mati

Berisi sisa template Vite (`.counter`, `.hero`, `#next-steps`). Tidak di-*import* oleh siapa pun.

### ⚠️ `hooks/useApi.js` — kode mati

Menyediakan `loading`/`error` yang justru sangat dibutuhkan `DataContext`, tapi tidak pernah dipakai.

---

# BAGIAN 8 — DAFTAR TEMUAN TERURUT PRIORITAS

## 8.1 Cara membaca daftar ini

**Tingkat keparahan:**

| Simbol | Arti | Tindakan |
|---|---|---|
| 🔴 **KRITIS** | Data bisa bocor, hilang, atau fitur utama tidak berfungsi | Perbaiki sebelum dipakai dengan data asli |
| 🟠 **TINGGI** | Pengguna melihat informasi salah atau alur kerja terhambat | Perbaiki dalam waktu dekat |
| 🟡 **SEDANG** | Mengganggu tapi ada jalan keluarnya | Perbaiki saat ada waktu |
| 🔵 **RENDAH** | Kebersihan kode, tidak berdampak langsung | Perbaiki saat merapikan |

**Total: 109 temuan** — 21 kritis, 33 tinggi, 34 sedang, 21 rendah.

---

## 8.2 🔴 KRITIS — 21 temuan

### Kelompok Keamanan (K-01 … K-09)

| # | Temuan | Lokasi | Dampak nyata |
|---|---|---|---|
| **K-01** | **Tidak ada middleware autentikasi sama sekali** | `app.js`, seluruh `routes/` | Siapa pun di jaringan bisa `curl` seluruh data siswa & rekam kesehatan tanpa login |
| **K-02** | **Password disimpan & dibandingkan sebagai teks biasa** | `authController.js:45`, `initDB.js:64`, `uks_digital.sql:29` | Database bocor = semua password langsung terbaca |
| **K-03** | **Identitas diambil dari header `X-User-Id` yang bisa dipalsukan** | `pengaturanController.js:7,35` | Siapa pun bisa mengubah profil orang lain dengan satu perintah `curl` |
| **K-04** | **Fallback `LIMIT 1` membocorkan identitas petugas utama** | `pengaturanController.js:20-23` | `curl /api/pengaturan` tanpa header apa pun → nama & NIP petugas utama terkirim |
| **K-05** | **Pendaftaran akun terbuka untuk umum** | `authRoutes.js:7` | Siapa pun bisa membuat akun sendiri dan mendapat akses penuh |
| **K-06** | **`logout()` tidak menghapus data siswa/kunjungan dari `localStorage`** | `AuthContext.jsx:74-78` | Setelah logout di komputer bersama, data kesehatan tetap terbaca di DevTools |
| **K-07** | **`DataProvider` mengunduh semua data sebelum login** | `App.jsx:37`, `DataContext.jsx:27` | Membuka halaman login saja sudah menarik seluruh data ke disk |
| **K-08** | **Peran (`role`) tidak pernah menentukan hak akses** | seluruh backend | "Dokter Kecil" (siswa SD) bisa menghapus seluruh database |
| **K-09** | **`cors()` tanpa pembatasan asal** | `app.js:18` | Situs web mana pun bisa memanggil API ini dari browser korban |

### Kelompok Kehilangan Data (D-01 … D-06)

| # | Temuan | Lokasi | Dampak nyata |
|---|---|---|---|
| **D-01** | **Error API ditelan blok `catch` kosong** | `DataContext.jsx:83,97,107,123,135` | MySQL mati → notifikasi tetap "Berhasil disimpan!" → data hilang tanpa jejak |
| **D-02** | **`localStorage` ditulis tapi TIDAK PERNAH dibaca** | `DataContext.jsx:23-24 vs 34,45,62,68` | Klaim "tersimpan lokal" tidak benar; refresh = data hilang |
| **D-03** | **ID dibuat di klien (`Date.now()`), balasan server diabaikan** | `DataContext.jsx:75,115` | Edit & hapus gagal diam-diam; data "dihapus" muncul lagi setelah refresh |
| **D-04** | **Server tetap menyala walau koneksi database gagal** | `server.js:10-22` | Petugas mencatat sepanjang pagi; semua gagal tanpa peringatan |
| **D-05** | **Tidak ada rollback saat penghapusan di server gagal** | `DataContext.jsx:102-110,130-138` | Baris hilang dari layar tapi tetap ada di database |
| **D-06** | **Tidak ada pengaman klik ganda pada form kunjungan** | `PendaftaranKunjungan.jsx:308` | Klik dua kali = dua rekam medis duplikat |

### Kelompok Fitur Utama Rusak (F-01 … F-06)

| # | Temuan | Lokasi | Dampak nyata |
|---|---|---|---|
| **F-01** | **Halaman Laporan mengambil dari `mockData` kosong** | `LaporanAnalitik.jsx:31` | Seluruh halaman Laporan **permanen kosong**; PDF ekspor tanpa baris |
| **F-02** | **Filter bulan/tahun tidak memfilter apa pun** | `LaporanAnalitik.jsx:38-39,93` | Dokumen resmi bertuliskan "Periode: Maret 2026" berisi data seluruh tahun |
| **F-03** | **Judul halaman putih di atas latar putih (5 halaman)** | `PageHeader.jsx` + `AppLayout.jsx` | Judul Pendaftaran/Riwayat/Siswa/Laporan/Pengaturan **tidak terlihat** |
| **F-04** | **Toast error tanpa warna latar (`bg-coral-500` tak terdefinisi)** | `Toast.jsx:66` | Pesan **error** — yang paling penting dilihat — praktis tidak terbaca |
| **F-05** | **`PUT /api/kunjungan/:id` tidak ada** | `kunjunganRoutes.js` | Tidak bisa mengoreksi kunjungan; `waktu_keluar` mustahil terisi |
| **F-06** | **Username tidak sah bisa disimpan → terkunci dari akun** | `Pengaturan.jsx:185` + `pengaturanController.js:42` | Simpan username `ab` → login jadi mustahil selamanya |

---

## 8.3 🟠 TINGGI — 33 temuan

### Backend

| # | Temuan | Lokasi |
|---|---|---|
| T-01 | `laporanController` membaca `bulan`/`tahun` tapi tidak memfilter — hanya menggemakannya | `laporanController.js:6-9` |
| T-02 | Endpoint `/api/laporan` tidak pernah dipanggil frontend (tak ada namespace `laporan`) | `utils/api.js:48-65` |
| T-03 | Agregasi dilakukan di JavaScript, bukan SQL (`SELECT *` lalu `.length`) | `laporanController.js:9-11` |
| T-04 | Pesan error SQL mentah dikirim ke klien | seluruh controller (`err.message`) |
| T-05 | Tidak ada lapisan validasi input sama sekali (padahal `zod` terpasang) | seluruh controller |
| T-06 | `SELECT *` tanpa `LIMIT`/pagination di semua endpoint daftar | `siswaController.js`, `kunjunganController.js:6` |
| T-07 | `initDB.js` mengabaikan variabel `host` yang sudah dihitung, memakai `'127.0.0.1'` mati | `initDB.js:23` |
| T-08 | Blok migrasi menelan error tanpa `console.warn` | `initDB.js:55-57` |
| T-09 | Peran ditentukan dari panjang NIP (`nip.length <= 10`) | `authController.js:98` |
| T-10 | Tidak ada cara menghapus/menonaktifkan akun | tidak ada endpoint |
| T-11 | Tidak ada kolom `petugas_id` di `kunjungan` — nol jejak audit | skema DB |
| T-12 | Tidak ada rate limiting pada login | `authRoutes.js` |
| T-13 | `updateSekolah` memakai `WHERE id = 1` tanpa cek `affectedRows` | `pengaturanController.js:68` |
| T-14 | `updatePetugas` tidak memvalidasi format username | `pengaturanController.js:42` |

### Database

| # | Temuan | Lokasi |
|---|---|---|
| T-15 | **Tiga definisi skema yang saling berbeda** | `uks_digital.sql`, `initDB.js`, `sqliteDB.js` |
| T-16 | `sqliteDB.js` adalah kode mati dengan skema bertentangan (`email`, tanpa `waktu_keluar`) | `db/sqliteDB.js` |
| T-17 | `initSQLiteDB()` dieksekusi saat modul dimuat — efek samping berbahaya | `sqliteDB.js:112` |
| T-18 | Nol FOREIGN KEY — `siswa_id` bisa menunjuk siswa yang tak ada | seluruh skema |
| T-19 | `uks_digital.sql` melakukan `DROP TABLE` tanpa peringatan di file | `uks_digital.sql:11-14` |
| T-20 | Kolom `waktu_keluar` ada di skema tapi tak pernah ditulis/dibaca | skema vs seluruh kode |
| T-21 | File `.db`, `.db-shm`, `.db-wal` tertinggal di `db/` | `db/` |

### Frontend

| # | Temuan | Lokasi |
|---|---|---|
| T-22 | Tren mingguan Dashboard salah karena `toISOString()` (UTC vs WIB) | `Dashboard.jsx:62` |
| T-23 | Perhitungan keluhan berbeda antara Dashboard (`split`) dan Laporan (tanpa `split`) | `Dashboard.jsx:46` vs `LaporanAnalitik.jsx:67` |
| T-24 | Angka Dashboard adalah total sepanjang masa, judulnya "Bulan Ini" | `Dashboard.jsx:43-56` |
| T-25 | Ekspor CSV: kutip di dalam data tidak di-*escape* | `RiwayatKunjungan.jsx:83-88` |
| T-26 | Ekspor CSV: tanpa BOM UTF-8 → `°C` jadi `Â°C` di Excel | `RiwayatKunjungan.jsx:92` |
| T-27 | Ekspor CSV: `encodeURI` tidak meng-*encode* `#` → file terpotong | `RiwayatKunjungan.jsx:93` |
| T-28 | `periodeLabel="Tahun 2026"` di-*hardcode* pada laporan cetak | `RiwayatKunjungan.jsx:222` |
| T-29 | Kop surat & NIP kepala sekolah di-*hardcode*, mengabaikan `pengaturan_sekolah` | `PrintReportTemplate.jsx:103-107,14` |
| T-30 | `Pengaturan` memanggil `updateUser()` saat memuat → bisa menimpa sesi dengan identitas orang lain | `Pengaturan.jsx:52` |
| T-31 | `res.json()` dipanggil tanpa syarat → `SyntaxError` untuk respons HTML | `utils/api.js:35` |
| T-32 | CSS cetak `visibility:hidden` pada `body *` berisiko halaman kosong di PDF | `PrintReportTemplate.jsx:230` |
| T-33 | Tabel PDF tanpa batas baris → browser membeku pada ribuan data | `PrintReportTemplate.jsx:169` |

---

## 8.4 🟡 SEDANG — 34 temuan

| # | Temuan | Lokasi |
|---|---|---|
| S-01 | `BrowserRouter` di lapisan terdalam → context tak bisa `useNavigate` | `App.jsx:38` |
| S-02 | Tidak ada indikator `loading`/`error` di `DataContext` | `DataContext.jsx` |
| S-03 | Tidak ada pemuatan ulang setelah mutasi | `DataContext.jsx` |
| S-04 | `hooks/useApi.js` menyediakan `loading`/`error` tapi tak dipakai | `hooks/useApi.js` |
| S-05 | Tidak ada *timeout*/`AbortController` pada `fetch` | `utils/api.js:34` |
| S-06 | `sessionStorage.setItem` tanpa `try/catch`, di dalam updater `setState` | `AuthContext.jsx:29-35` |
| S-07 | `validateUsername` diduplikasi di 3 tempat dengan aturan berbeda | `authController.js:7`, `AuthContext.jsx:7`, `Pengaturan.jsx:185` |
| S-08 | `useEffect` dengan `[]` memakai `user` & `updateUser` (*stale closure*) | `Pengaturan.jsx:66` |
| S-09 | Error saat memuat Pengaturan sengaja disembunyikan | `Pengaturan.jsx:59-61` |
| S-10 | `sekolah` diinisialisasi dari mock → bisa menimpa DB dengan data palsu | `Pengaturan.jsx:30` |
| S-11 | Validasi `DataSiswa` hanya memeriksa `nis` & `nama` | `DataSiswa.jsx:97` |
| S-12 | NIS duplikat → notifikasi "berhasil" lalu data hilang setelah refresh | `DataSiswa.jsx:106` + `DataContext.jsx:83` |
| S-13 | Modal hapus tidak memperingatkan riwayat kunjungan yang akan yatim | `DataSiswa.jsx:388` |
| S-14 | Tidak ada filter tanggal di Riwayat (diminta spesifikasi) | `RiwayatKunjungan.jsx` |
| S-15 | Tidak ada aksi Edit di Riwayat (diminta spesifikasi) | `RiwayatKunjungan.jsx:171-186` |
| S-16 | Pencarian NIS *case-sensitive* (tak konsisten dengan kolom lain) | `RiwayatKunjungan.jsx:57` |
| S-17 | Tidak ada sapaan "Selamat Datang [nama]" (diminta spesifikasi) | `Dashboard.jsx` |
| S-18 | `getGreeting()` sudah ditulis tapi tak pernah dipanggil | `formatters.js:38` |
| S-19 | Tidak ada kartu "kunjungan hari ini" / "istirahat di UKS" / "darurat minggu ini" | `Dashboard.jsx` |
| S-20 | `variant="success"` tidak ada di `StatCard` → jatuh ke default diam-diam | `Dashboard.jsx:120` vs `StatCard.jsx:1-14` |
| S-21 | `recentVisits` bergantung pada urutan server, tidak diurutkan eksplisit | `Dashboard.jsx:40` |
| S-22 | `keluhan_utama` bisa terisi keterangan panjang > 255 karakter | `PendaftaranKunjungan.jsx:61` |
| S-23 | `waktu_masuk` bisa diisi tanggal masa depan | `PendaftaranKunjungan.jsx` (via `DatePicker`) |
| S-24 | `TagSelector` tanpa batas jumlah pilihan | `TagSelector.jsx` |
| S-25 | `DataTable` tanpa pagination — merender semua baris | `DataTable.jsx:34` |
| S-26 | `DataTable` memakai `key={row.id \|\| idx}` — indeks bisa salah pasang | `DataTable.jsx:36` |
| S-27 | `SearchAutocomplete` menyaring di klien, tanpa *debounce*, tanpa Portal | `SearchAutocomplete.jsx:28-36` |
| S-28 | `DatePicker` menandai hari terpilih berdasarkan `currentDate`, bukan bulan terpilih | `DatePicker.jsx:205-208` |
| S-29 | `Modal` tanpa *focus trap* | `Modal.jsx` |
| S-30 | `CustomSelect` tanpa penanganan `Escape` dan atribut ARIA | `CustomSelect.jsx` |
| S-31 | Aturan cache PWA tidak pernah cocok (dan sebaiknya dihapus, bukan diperbaiki) | `vite.config.js:30` |
| S-32 | PWA `autoUpdate` bisa memuat ulang halaman saat form sedang diisi | `vite.config.js:11` |
| S-33 | `<Route path="*">` berada di dalam route terlindungi; tak ada halaman 404 | `App.jsx:73` |
| S-34 | Tabel PDF tanpa `page-break-inside: avoid` → baris terpotong antar halaman | `PrintReportTemplate.jsx:227-259` |

---

## 8.5 🔵 RENDAH — 21 temuan

| # | Temuan | Lokasi |
|---|---|---|
| R-01 | Typo **"SDN 05 Prambahan"** (kurang huruf 'a') di halaman pertama | `Login.jsx:42` |
| R-02 | Tidak ada tautan ke `/register` dari halaman Login | `Login.jsx` |
| R-03 | Tema Login (terang) vs Register (gelap) bertabrakan | `Login.jsx` vs `Register.jsx` |
| R-04 | `index.css` menetapkan `body` gelap yang selalu ditimpa `AppLayout` | `index.css:11` |
| R-05 | `font-display` bukan kelas Tailwind valid (tak ada `@theme`) | seluruh komponen |
| R-06 | `shadow-lifted` tidak terdefinisi | `Toast.jsx:83` |
| R-07 | `shadow-glow` tidak terdefinisi | `PageHeader.jsx:19` |
| R-08 | `--radius-btn` tidak pernah dideklarasikan | `Toast.jsx:82` |
| R-09 | `App.css` 100% kode mati (sisa template Vite) | `frontend/src/App.css` |
| R-10 | 5 dependency terpasang tapi nol dipakai: `bcrypt`, `jsonwebtoken`, `multer`, `uuid`, `zod` | `package.json` |
| R-11 | `better-sqlite3` terpasang untuk kode mati | `package.json:18` |
| R-12 | `app.js` me-*redirect* ke `http://localhost:5173/login` yang di-*hardcode* | `app.js:24` |
| R-13 | `/api/health` ada tapi tidak pernah dipanggil frontend | `app.js:28` |
| R-14 | `README.md` masih mendokumentasikan login dengan **email** (sudah usang) | `README.md` |
| R-15 | `.gitignore` berisi `*.md` → dokumen analisis ini tidak akan masuk git | `.gitignore` |
| R-16 | `DB_PASSWORD` kosong — wajib diubah saat *deploy* | `.env` |
| R-17 | `JWT_SECRET` ada di `.env` tapi tidak pernah dipakai | `.env` |
| R-18 | Campuran gaya ekspor controller (named export vs objek) | `controllers/` |
| R-19 | `CustomSelect` dipanggil dengan dua bentuk prop berbeda antar halaman | `PendaftaranKunjungan.jsx` vs lainnya |
| R-20 | Campuran bahasa: *"**Action** ini tidak dapat dibatalkan"* | `DataSiswa.jsx:388` |
| R-21 | `role VARCHAR(50)` teks bebas → 4 variasi untuk 2 konsep | skema DB |

---

## 8.6 Diagnosis akar masalah — 109 temuan ini sebenarnya berasal dari 6 sumber

Daftar panjang di atas bisa terasa menakutkan. Tapi kalau dikelompokkan berdasarkan **penyebabnya**, semuanya berasal dari enam akar saja:

```
┌─────────────────────────────────────────────────────────────────────────┐
│ AKAR 1 — Keamanan dianggap urusan frontend                              │
│ "ProtectedRoute sudah cukup" → server dibiarkan terbuka                 │
│ ⤷ Menyebabkan: K-01, K-03, K-04, K-05, K-08, K-09, T-12                │
│ ⤷ Perbaikan: pasang SATU middleware → 7 temuan selesai sekaligus        │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ AKAR 2 — "Optimistic update" tanpa rekonsiliasi                         │
│ Tampilan diperbarui dulu, server menyusul, hasilnya tak pernah dicek    │
│ ⤷ Menyebabkan: D-01, D-02, D-03, D-05, D-06, S-02, S-03, S-12          │
│ ⤷ Perbaikan: perbaiki DataContext → 8 temuan selesai sekaligus          │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ AKAR 3 — Migrasi tema gelap→terang berhenti di tengah jalan             │
│ Layout & Dashboard sudah terang; komponen & 5 halaman masih gelap       │
│ ⤷ Menyebabkan: F-03, F-04, R-03, R-04, R-05, R-06, R-07, R-08          │
│ ⤷ Perbaikan: tambah blok @theme + samakan PageHeader → 8 temuan selesai │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ AKAR 4 — Data palsu (mock) belum dicabut sepenuhnya                     │
│ mockData.js masih dipakai 3 halaman untuk data yang seharusnya dari DB  │
│ ⤷ Menyebabkan: F-01, T-28, T-29, S-10                                   │
│ ⤷ Perbaikan: ganti impor mock → useData()/API → 4 temuan selesai        │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ AKAR 5 — Logika yang sama ditulis ulang di banyak tempat                │
│ Tidak ada "rumah" untuk aturan validasi & perhitungan statistik         │
│ ⤷ Menyebabkan: F-06, T-14, T-23, S-07, S-11, S-16, T-05                │
│ ⤷ Perbaikan: 2 file penampung logika → 7 temuan selesai                 │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ AKAR 6 — Fitur "hampir selesai" tapi tak pernah disambungkan            │
│ bcrypt, JWT, zod, getGreeting, waktu_keluar, useApi, /api/laporan       │
│ ⤷ Menyebabkan: K-02, F-05, T-01, T-02, T-20, S-04, S-17, S-18, R-10... │
│ ⤷ Perbaikan: sambungkan yang sudah ada → belasan temuan selesai         │
└─────────────────────────────────────────────────────────────────────────┘
```

> **Kesimpulan penting:** Anda **tidak perlu memperbaiki 109 hal satu per satu.** Memperbaiki **6 akar** akan menyelesaikan sekitar **50 temuan** secara otomatis. Sisanya adalah perbaikan kecil yang berdiri sendiri.
>
> Inilah alasan Bagian 9 disusun berdasarkan **akar masalah**, bukan berdasarkan daftar temuan.

## 8.7 Sebaran temuan per file

Untuk melihat file mana yang paling perlu perhatian:

| File | 🔴 | 🟠 | 🟡 | 🔵 | Total |
|---|:---:|:---:|:---:|:---:|:---:|
| `frontend/src/context/DataContext.jsx` | 4 | 0 | 2 | 0 | **6** |
| `frontend/src/pages/LaporanAnalitik.jsx` | 2 | 1 | 0 | 0 | **3** |
| `frontend/src/pages/Pengaturan.jsx` | 1 | 1 | 4 | 0 | **6** |
| `frontend/src/pages/RiwayatKunjungan.jsx` | 0 | 4 | 3 | 0 | **7** |
| `frontend/src/pages/Dashboard.jsx` | 0 | 3 | 5 | 0 | **8** |
| `controllers/pengaturanController.js` | 2 | 2 | 0 | 0 | **4** |
| `controllers/authController.js` | 2 | 2 | 1 | 0 | **5** |
| `controllers/laporanController.js` | 0 | 3 | 0 | 0 | **3** |
| `db/sqliteDB.js` | 0 | 3 | 0 | 1 | **4** |
| `db/initDB.js` | 1 | 2 | 0 | 0 | **3** |
| `components/common/PrintReportTemplate.jsx` | 0 | 3 | 1 | 0 | **4** |
| `components/common/Toast.jsx` | 1 | 0 | 0 | 3 | **4** |
| `app.js` | 2 | 0 | 0 | 2 | **4** |
| `frontend/src/utils/api.js` | 0 | 2 | 1 | 0 | **3** |
| `frontend/src/pages/DataSiswa.jsx` | 0 | 0 | 4 | 1 | **5** |
| `frontend/src/pages/PendaftaranKunjungan.jsx` | 1 | 0 | 3 | 0 | **4** |
| `frontend/src/pages/Login.jsx` | 0 | 0 | 0 | 3 | **3** |
| `frontend/src/context/AuthContext.jsx` | 1 | 0 | 2 | 0 | **3** |

**Tiga file yang paling mendesak diperbaiki:** `DataContext.jsx`, `LaporanAnalitik.jsx`, dan `pengaturanController.js`.

---

# BAGIAN 9 — SOLUSI PRAKTIS & ALASAN LOGISNYA

> **Aturan yang saya patuhi di seluruh solusi ini:** tidak ada perubahan struktur folder (sesuai `Preview, Prompt, and rules.md`). Semua file baru diletakkan **di dalam folder yang sudah ada**.

## Solusi #1 — Pasang autentikasi nyata di sisi server

**Menyelesaikan:** K-01, K-02, K-03, K-04, K-05, K-08, K-09, T-12, R-17 *(9 temuan)*

### Alasan logis mengapa ini nomor satu

Semua bug lain membuat aplikasi **tidak nyaman**. Bug ini membuat aplikasi **berbahaya**. Data yang disimpan adalah rekam kesehatan anak di bawah umur beserta nama dan nomor telepon wali — di Indonesia tergolong **data pribadi spesifik** menurut UU 27/2022.

Dan ada alasan teknis yang membuatnya harus **pertama**: memperbaiki keamanan setelah fitur lain jadi berarti Anda harus menyentuh ulang setiap controller. Memperbaikinya sekarang berarti semua kode baru otomatis terlindungi.

**Kabar baiknya: 80% pekerjaan sudah selesai.** `bcrypt` dan `jsonwebtoken` sudah terpasang, `JWT_SECRET` sudah ada di `.env`, dan kolom `password VARCHAR(255)` sudah berukuran tepat untuk hash bcrypt (60 karakter). Yang kurang hanya **menyambungkannya**.

### Langkah 1 — Buat file `middleware.js` di root (sejajar `app.js`)

```js
// middleware.js — file BARU di root, struktur folder tidak berubah
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'ubah-nilai-ini-di-env'

/** Wajib login. Menolak permintaan tanpa token yang sah. */
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null

  if (!token) {
    return res.status(401).json({ success: false, message: 'Anda harus login terlebih dahulu.' })
  }

  try {
    // Token ditandatangani server. Isinya tidak bisa diubah tanpa ketahuan.
    req.user = jwt.verify(token, JWT_SECRET)   // { id, username, role }
    next()
  } catch {
    return res.status(401).json({ success: false, message: 'Sesi Anda telah berakhir. Silakan login kembali.' })
  }
}

/** Wajib punya salah satu peran tertentu. Dipakai untuk aksi berisiko. */
export function requireRole(...rolesYangBoleh) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Anda harus login terlebih dahulu.' })
    }
    const cocok = rolesYangBoleh.some((r) => (req.user.role || '').includes(r))
    if (!cocok) {
      return res.status(403).json({ success: false, message: 'Anda tidak memiliki hak akses untuk tindakan ini.' })
    }
    next()
  }
}

/** Penangan error terpusat: catat detail di server, kirim pesan aman ke pengguna. */
export function errorHandler(err, req, res, _next) {
  console.error(`[${req.method} ${req.originalUrl}]`, err)      // detail HANYA di log server
  res.status(err.status || 500).json({
    success: false,
    message: err.publicMessage || 'Terjadi kesalahan pada server. Silakan coba lagi.'
  })
}
```

> 🧠 **Kenapa JWT, bukan sekadar menyimpan status login di server?** JWT adalah "kartu identitas bersegel". Server menandatanganinya dengan `JWT_SECRET`; kalau ada yang mengubah satu huruf di dalamnya, tanda tangannya rusak dan langsung ketahuan. Server tidak perlu mengingat siapa saja yang login — cukup memeriksa segelnya. Ini yang membuatnya **tidak bisa dipalsukan**, berbeda dengan `X-User-Id` yang sekarang.

### Langkah 2 — Ganti perbandingan password teks biasa dengan bcrypt

```js
// controllers/authController.js
import bcrypt from 'bcrypt'

// --- di loginUser, GANTI baris 45 ---
// SEBELUM:  if (user.password !== password) { ... }
// SESUDAH:
const cocok = await bcrypt.compare(password, user.password)
if (!cocok) {
  return res.status(401).json({
    success: false,
    message: 'Username/NIP atau Password yang Anda masukkan salah!'   // pesan tetap sama — bagus
  })
}

// Terbitkan token setelah login berhasil
const token = jwt.sign(
  { id: user.id, username: user.username, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: '8h' }        // 8 jam = satu hari kerja sekolah
)

const { password: _, ...userData } = user
return res.json({ success: true, message: 'Login berhasil!', data: userData, token })

// --- di registerUser, GANTI penyimpanan password ---
const hash = await bcrypt.hash(password, 10)
await pool.query(
  `INSERT INTO users (nama_lengkap, username, nip, no_telepon, password, role) VALUES (?, ?, ?, ?, ?, ?)`,
  [nama_lengkap, username.toLowerCase(), nip, no_telepon || '', hash, role]   // ← hash, bukan password
)
```

> 🧠 **Kenapa hashing tidak bisa dibalik?** Bcrypt seperti menggiling biji kopi: mudah dari biji ke bubuk, mustahil dari bubuk kembali ke biji. Saat login, server menggiling password yang diketik lalu membandingkan **bubuknya**. Kalau database dicuri, penyerang hanya dapat bubuk — password aslinya tidak bisa dipulihkan.
>
> Angka `10` adalah "berapa kali digiling". Semakin tinggi semakin aman tapi semakin lambat. 10 adalah standar yang seimbang.

### Langkah 3 — Pasang penjaga di setiap route

```js
// routes/siswaRoutes.js
import { requireAuth, requireRole } from '../middleware.js'

router.get('/',        requireAuth, getSiswa)
router.post('/',       requireAuth, createSiswa)
router.put('/:id',     requireAuth, updateSiswa)
router.delete('/:id',  requireAuth, requireRole('Petugas UKS'), deleteSiswa)   // hapus = khusus petugas
```

```js
// routes/kunjunganRoutes.js
router.get('/',        requireAuth, getKunjungan)
router.post('/',       requireAuth, createKunjungan)
router.put('/:id',     requireAuth, updateKunjungan)                            // ← lihat Solusi #6
router.delete('/:id',  requireAuth, requireRole('Petugas UKS'), deleteKunjungan)
```

```js
// routes/pengaturanRoutes.js
router.get('/',         requireAuth, pengaturanController.get)
router.put('/petugas',  requireAuth, pengaturanController.updatePetugas)
router.put('/sekolah',  requireAuth, requireRole('Petugas UKS'), pengaturanController.updateSekolah)
```

```js
// routes/laporanRoutes.js
router.get('/', requireAuth, laporanController.getMonthlyReport)
```

**Perhatikan pola `requireRole('Petugas UKS')` pada aksi hapus.** Inilah yang menyelesaikan K-08: seorang "Dokter Kecil UKS" (siswa) kini bisa mencatat kunjungan tapi **tidak bisa menghapus data**. Ini mencerminkan tanggung jawab nyata di sekolah.

### Langkah 4 — Ambil identitas dari token, bukan dari header

```js
// controllers/pengaturanController.js
get: async (req, res) => {
  const userId = req.user.id          // ← dari token yang sudah diverifikasi. Tidak bisa dipalsukan.

  const [sekolahRows] = await pool.query('SELECT * FROM pengaturan_sekolah WHERE id = 1')
  const [userRows] = await pool.query(
    'SELECT id, nama_lengkap, username, nip, no_telepon, role FROM users WHERE id = ?',
    [userId]
  )

  // 🔴 HAPUS TOTAL blok fallback "SELECT ... LIMIT 1" — itulah sumber kebocoran K-04
  if (!userRows[0]) {
    return res.status(401).json({ success: false, message: 'Sesi tidak valid. Silakan login kembali.' })
  }

  res.json({ success: true, data: { petugas: userRows[0], sekolah: sekolahRows[0] || {} } })
}
```

### Langkah 5 — Batasi CORS & tambahkan rate limit login

```js
// app.js
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',   // hanya frontend kita
  credentials: true
}))
```

```js
// middleware.js — pembatas percobaan login sederhana, tanpa dependency baru
const percobaan = new Map()

export function rateLimitLogin(req, res, next) {
  const kunci = req.ip
  const sekarang = Date.now()
  const data = percobaan.get(kunci) || { jumlah: 0, reset: sekarang + 15 * 60_000 }

  if (sekarang > data.reset) { data.jumlah = 0; data.reset = sekarang + 15 * 60_000 }
  data.jumlah++
  percobaan.set(kunci, data)

  if (data.jumlah > 10) {
    return res.status(429).json({
      success: false,
      message: 'Terlalu banyak percobaan login. Silakan tunggu 15 menit.'
    })
  }
  next()
}
```

```js
// routes/authRoutes.js
import { rateLimitLogin, requireAuth, requireRole } from '../middleware.js'

router.post('/login', rateLimitLogin, loginUser)
router.post('/register', requireAuth, requireRole('Petugas UKS'), registerUser)   // ← tutup K-05
```

> **Alasan menutup pendaftaran umum:** ini aplikasi internal satu sekolah dengan 2–5 pengguna. Akun seharusnya dibuat oleh petugas utama, bukan didaftarkan sendiri oleh siapa pun yang bisa menjangkau server.

### Langkah 6 — Frontend menyimpan & mengirim token

```js
// frontend/src/utils/api.js
function getHeaders(extra = {}) {
  const token = sessionStorage.getItem('uks_token')
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),   // ← ganti X-User-Id
    ...extra
  }
}
```

```js
// frontend/src/context/AuthContext.jsx
const login = async (username, password) => {
  const res = await api.post('/auth/login', { username, password })
  if (res?.success && res.data) {
    setUser(res.data)
    sessionStorage.setItem('uks_user', JSON.stringify(res.data))
    if (res.token) sessionStorage.setItem('uks_token', res.token)     // ← simpan token
    return res.data
  }
  throw new Error(res.message || 'Login gagal')
}

const logout = () => {
  setUser(null)
  sessionStorage.removeItem('uks_user')
  sessionStorage.removeItem('uks_token')
  // 🔴 PENTING — tutup K-06: bersihkan juga data pasien
  localStorage.removeItem('uks_siswa_data_clean')
  localStorage.removeItem('uks_kunjungan_data_clean')
  localStorage.removeItem('uks_user')
}
```

### Langkah 7 — Perbarui password yang sudah tersimpan

Password lama masih teks biasa. Jalankan sekali:

```js
// db/rehashPasswords.js — file BARU di folder db/ yang sudah ada
import bcrypt from 'bcrypt'
import pool from './db.js'

const [users] = await pool.query('SELECT id, password FROM users')
for (const u of users) {
  if (u.password.startsWith('$2b$')) continue          // sudah ter-hash, lewati
  const hash = await bcrypt.hash(u.password, 10)
  await pool.query('UPDATE users SET password = ? WHERE id = ?', [hash, u.id])
  console.log(`✅ Password user #${u.id} berhasil di-hash`)
}
console.log('Selesai. Password lama sudah tidak tersimpan dalam bentuk teks.')
process.exit(0)
```

Jalankan: `node db/rehashPasswords.js`

Lalu ubah *seed* di `initDB.js` dan `uks_digital.sql` agar tidak lagi menanam `'admin'` polos:

```sql
-- uks_digital.sql — ganti baris seed
-- Password: 'admin' (WAJIB DIGANTI SETELAH LOGIN PERTAMA)
INSERT INTO users (id, nama_lengkap, username, nip, no_telepon, password, role)
VALUES (1, 'Ibu Siti Rahmawati', 'siti_rahmawati', '198507152010012003', '081234567890',
        '$2b$10$GANTI.DENGAN.HASH.HASIL.BCRYPT.ANDA.SENDIRI', 'Petugas UKS Utama');
```

### Hasil setelah Solusi #1

| Sebelum | Sesudah |
|---|---|
| `curl /api/siswa` → seluruh data siswa | `401 Anda harus login terlebih dahulu` |
| `curl /api/pengaturan` → NIP petugas | `401` |
| `curl -X DELETE /api/siswa/5` → terhapus | `401` |
| `-H "X-User-Id: 1"` → menyamar jadi user 1 | Tidak berlaku; token tidak bisa dipalsukan |
| Database bocor → semua password terbaca | Hanya hash — tidak bisa dibalik |
| Dokter Kecil bisa hapus semua data | `403 Tidak memiliki hak akses` |
| Logout → data pasien tetap di disk | Bersih |

---

## Solusi #2 — Jangan pernah menelan error; tampilkan dan tandai

**Menyelesaikan:** D-01, D-02, D-03, D-05, D-06, S-02, S-03, S-12 *(8 temuan — AKAR 2)*

### Alasan logis

Ini bukan sekadar "bug yang mengganggu" — ini masalah **kepercayaan**. Sistem yang mengatakan "Berhasil disimpan!" padahal gagal lebih buruk daripada sistem yang jujur mengatakan "Gagal". Petugas mengambil keputusan berdasarkan asumsi bahwa datanya tercatat.

Dan karena `localStorage` **tidak pernah dibaca** (D-02), komentar `// Saved in local state` adalah janji yang tidak dipenuhi. Data itu benar-benar hilang.

### Kode pengganti untuk `DataContext.jsx`

```jsx
// frontend/src/context/DataContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { api } from '../utils/api'

const DataContext = createContext(null)

export function DataProvider({ children }) {
  const [siswaList, setSiswaList] = useState([])
  const [kunjunganList, setKunjunganList] = useState([])
  const [loading, setLoading] = useState(true)      // ← BARU: tutup S-02
  const [error, setError] = useState(null)          // ← BARU: tutup S-02

  /** Ambil ulang dari server. Dipanggil saat mount DAN setelah setiap mutasi. */
  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [s, k] = await Promise.all([api.siswa.getAll(), api.kunjungan.getAll()])
      setSiswaList(Array.isArray(s?.data) ? s.data : [])
      setKunjunganList(Array.isArray(k?.data) ? k.data : [])
    } catch (err) {
      setError('Tidak dapat terhubung ke server. Data yang tampil mungkin tidak terbaru.')
      console.error('Gagal memuat data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  // ---- SISWA ----
  const addSiswa = async (data) => {
    const res = await api.siswa.create(data)     // ← TANPA try/catch: error MENGALIR ke pemanggil
    await refresh()                              // ← tutup S-03 & D-03: id asli dari server
    return res.data
  }

  const updateSiswa = async (id, data) => {
    await api.siswa.update(id, data)
    await refresh()
  }

  const deleteSiswa = async (id) => {
    await api.siswa.delete(id)                   // ← tutup D-05: hapus dari layar HANYA jika server setuju
    await refresh()
  }

  // ---- KUNJUNGAN ----
  const addKunjungan = async (data) => {
    const res = await api.kunjungan.create(data)
    await refresh()
    return res.data
  }

  const updateKunjungan = async (id, data) => {   // ← BARU, pasangan Solusi #6
    await api.kunjungan.update(id, data)
    await refresh()
  }

  const deleteKunjungan = async (id) => {
    await api.kunjungan.delete(id)
    await refresh()
  }

  return (
    <DataContext.Provider value={{
      siswaList, kunjunganList, loading, error, refresh,
      addSiswa, updateSiswa, deleteSiswa,
      addKunjungan, updateKunjungan, deleteKunjungan
    }}>
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData harus dipakai di dalam DataProvider')
  return ctx
}
```

**Empat perubahan kunci dan alasannya:**

| Perubahan | Alasan |
|---|---|
| **Hapus semua `try/catch` di fungsi mutasi** | Error harus **mengalir** ke halaman pemanggil supaya bisa ditampilkan ke pengguna |
| **`await refresh()` setelah setiap mutasi** | Menyelesaikan masalah id `Date.now()` sekaligus — data selalu memakai id asli dari MySQL |
| **Hapus semua `localStorage`** | Ia tidak pernah dibaca (D-02), jadi hanya menyimpan data sensitif ke disk tanpa manfaat |
| **Tambah `loading` & `error`** | Halaman bisa membedakan "belum ada data" dan "server mati" |

### Halaman pemanggil harus menangani error

```jsx
// frontend/src/pages/PendaftaranKunjungan.jsx
const [saving, setSaving] = useState(false)          // ← tutup D-06

const handleSubmit = async (e) => {
  e.preventDefault()
  if (saving) return                                  // ← cegah klik ganda
  if (!selectedSiswa) { toast.error('Silakan pilih siswa terlebih dahulu!'); return }

  setSaving(true)
  try {
    const tersimpan = await addKunjungan(newRecord)
    setSuccessData(tersimpan)
    toast.success(`Kunjungan ${selectedSiswa.nama} berhasil disimpan!`)   // hanya jika BENAR berhasil
  } catch (err) {
    toast.error(err.message || 'Gagal menyimpan. Periksa koneksi server & MySQL.')
  } finally {
    setSaving(false)
  }
}
```

```jsx
<button type="submit" disabled={saving}>
  {saving ? 'Menyimpan...' : 'Simpan Data Kunjungan'}
</button>
```

### Tampilkan spanduk peringatan saat server bermasalah

```jsx
// frontend/src/components/layout/AppLayout.jsx
const { error } = useData()

{error && (
  <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 text-xs text-amber-800 font-semibold">
    ⚠️ {error}
  </div>
)}
```

**Ini menutup D-04 dari sisi pengguna:** kalau MySQL mati, petugas melihat peringatan **sebelum** ia mulai mencatat, bukan setelah kehilangan data sepagian.

### Perkuat juga di sisi server (D-04)

```js
// server.js
const dbSiap = await initDatabase()
if (!dbSiap) {
  console.error('❌ Tidak dapat terhubung ke MySQL. Server TIDAK dijalankan.')
  console.error('   Pastikan MySQL di Laragon/XAMPP sudah aktif, lalu jalankan ulang.')
  process.exit(1)      // ← berhenti, jangan berpura-pura sehat
}
app.listen(PORT, () => { /* banner */ })
```

> **Alasan `process.exit(1)`:** lebih baik server **tidak menyala sama sekali** (petugas langsung tahu ada yang salah) daripada menyala tapi tidak bisa menyimpan apa pun (petugas baru tahu setelah data hilang). Gagal cepat dan berisik selalu lebih baik daripada gagal diam-diam.

---

## Solusi #3 — Perbaiki halaman Laporan yang selalu kosong

**Menyelesaikan:** F-01, F-02, T-23, T-28, S-10 *(5 temuan — AKAR 4)*

### Alasan logis

Ini bug dengan **rasio dampak-terhadap-usaha tertinggi** di seluruh dokumen. Perbaikan intinya hanya 3 baris, tapi menghidupkan kembali seluruh halaman yang menjadi tujuan akhir aplikasi ini — laporan untuk kepala sekolah.

### Perbaikan inti (3 baris)

```jsx
// frontend/src/pages/LaporanAnalitik.jsx

// HAPUS baris 31:
// import { kunjunganList, dataSekolah, petugasUks } from '../data/mockData'

// GANTI dengan:
import { useData } from '../context/DataContext'

export default function LaporanAnalitik() {
  const { user } = useAuth()
  const { kunjunganList } = useData()        // ← data ASLI dari database
  ...
```

### Sekaligus perbaiki filter periode yang tidak berfungsi (F-02)

```jsx
// Saring data berdasarkan bulan & tahun yang dipilih
const dataPeriode = kunjunganList.filter((k) => {
  if (!k.waktu_masuk) return false
  const d = new Date(k.waktu_masuk)
  return d.getMonth() + 1 === Number(selectedBulan) && d.getFullYear() === Number(selectedTahun)
})

// Lalu GANTI SEMUA `kunjunganList` di bawah ini dengan `dataPeriode`:
const totalKunjungan = dataPeriode.length
const totalDarurat   = dataPeriode.filter((k) => k.is_darurat).length
// ...dan seterusnya, termasuk:
<PrintReportTemplate dataKunjungan={dataPeriode} ... />
```

**Alasan mengapa ini penting:** tanpa perbaikan ini, laporan cetak akan berjudul "Periode: Maret 2026" tapi berisi data seluruh tahun. Dokumen resmi yang diserahkan ke kepala sekolah **salah secara faktual** — jauh lebih buruk daripada halaman kosong yang jelas-jelas kosong.

### Sekaligus samakan perhitungan keluhan dengan Dashboard (T-23)

```jsx
// SEBELUM (salah — "Pusing, Demam" dihitung sebagai 1 jenis):
keluhanCount[k.keluhan_utama] = (keluhanCount[k.keluhan_utama] || 0) + 1

// SESUDAH (benar — sama dengan Dashboard):
if (k.keluhan_utama) {
  k.keluhan_utama.split(',').forEach((raw) => {
    const keluhan = raw.trim()
    if (keluhan) keluhanCount[keluhan] = (keluhanCount[keluhan] || 0) + 1
  })
}
```

### Ambil data sekolah dari database, bukan mock (S-10, T-29)

```jsx
const [sekolah, setSekolah] = useState(null)

useEffect(() => {
  api.get('/pengaturan')
    .then((res) => { if (res?.data?.sekolah) setSekolah(res.data.sekolah) })
    .catch(() => {})
}, [])

<PrintReportTemplate
  dataKunjungan={dataPeriode}
  periodeLabel={periodeText}                        // ← sekarang jujur
  namaSekolah={sekolah?.nama_sekolah}
  alamatSekolah={sekolah?.alamat}
  kepalaSekolah={sekolah?.kepala_sekolah}
  petugasName={user?.nama_lengkap}
  petugasNip={user?.nip}
/>
```

Dan buat `PrintReportTemplate` memakainya, bukan teks mati:

```jsx
// frontend/src/components/common/PrintReportTemplate.jsx
export default function PrintReportTemplate({
  namaSekolah = 'SD NEGERI 05 PARAMBAHAN',
  alamatSekolah = '',
  kepalaSekolah = '',
  kepalaNip = '',
  ...
}) {
  ...
  <h1 className="text-xl font-black uppercase">{namaSekolah}</h1>
  <p className="text-[11px] italic">Alamat: {alamatSekolah}</p>
  ...
  <p className="font-bold underline">{kepalaSekolah}</p>
  {kepalaNip && <p className="text-[11px] font-mono">NIP. {kepalaNip}</p>}
```

> **Alasan:** halaman Pengaturan menjanjikan *"Informasi identitas sekolah yang dicetak pada kepala surat laporan"*. Saat ini janji itu tidak ditepati. Memperbaikinya membuat fitur Pengaturan menjadi **benar-benar berfungsi**, bukan sekadar formulir yang datanya tidak ke mana-mana.

---

## Solusi #4 — Selesaikan migrasi tema yang berhenti di tengah

**Menyelesaikan:** F-03, F-04, R-03, R-04, R-05, R-06, R-07, R-08 *(8 temuan — AKAR 3)*

### Alasan logis

Ini bukan delapan bug terpisah — ini **satu pekerjaan yang belum selesai**. Menanganinya sebagai satu keputusan jauh lebih efisien daripada menambal satu per satu.

**Keputusan yang harus diambil: tema terang atau gelap?**

Saya **merekomendasikan tema terang**, dengan tiga alasan:

1. **Kerangka aplikasi sudah terang** — `AppLayout`, `Sidebar`, `Topbar` adalah bagian yang paling sulit diubah, dan ketiganya sudah terang.
2. **Konteks pemakaian** — ruang UKS umumnya terang, dan dokumen cetak berlatar putih. Tema terang lebih konsisten dengan hasil akhirnya.
3. **Keterbacaan untuk pengguna non-teknis** — guru SD lebih terbiasa dengan antarmuka terang seperti Word/Excel.

### Langkah 1 — Definisikan token yang hilang (menutup 4 temuan sekaligus)

Tailwind v4 memakai blok `@theme` untuk mendaftarkan token kustom. Saat ini `index.css` **tidak punya blok ini sama sekali** — itulah sebabnya `bg-coral-500`, `shadow-lifted`, `shadow-glow`, dan `font-display` semuanya tidak menghasilkan CSS apa pun.

```css
/* frontend/src/index.css — TAMBAHKAN di bawah @import "tailwindcss"; */
@theme {
  /* Warna coral — menutup F-04: toast error akhirnya punya latar */
  --color-coral-50:  #FFF1F2;
  --color-coral-400: #FB7185;
  --color-coral-500: #F43F5E;
  --color-coral-600: #E11D48;

  /* Font — menutup R-05: menyambungkan font yang SUDAH dimuat di index.html */
  --font-display: 'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif;
  --font-body:    'DM Sans', ui-sans-serif, system-ui, sans-serif;

  /* Bayangan — menutup R-06, R-07 */
  --shadow-lifted: 0 10px 30px -8px rgb(0 0 0 / 0.18);
  --shadow-glow:   0 0 12px rgb(16 185 129 / 0.55);

  /* Radius — menutup R-08 */
  --radius-btn: 0.75rem;
}
```

Lalu ubah `body` agar tidak lagi bertabrakan dengan layout (R-04):

```css
@layer base {
  body {
    font-family: var(--font-body);
    background-color: #F8FAFC;      /* ← terang, selaras dengan AppLayout */
    color: #0F172A;
    min-height: 100vh;
    -webkit-font-smoothing: antialiased;
  }
}
```

> 🧠 **Kenapa satu blok `@theme` bisa memperbaiki 4 bug sekaligus?** Karena semua bug itu bergejala sama: kelas Tailwind yang ditulis di komponen tapi tidak punya definisi. Tailwind hanya menghasilkan CSS untuk token yang **terdaftar**. Sekali didaftarkan, seluruh kelas yang sudah tertulis di komponen langsung hidup — **tanpa mengubah satu baris pun di komponen**.

### Langkah 2 — Ubah `PageHeader` ke tema terang (menutup F-03)

```jsx
// frontend/src/components/layout/PageHeader.jsx
export default function PageHeader({ title, subtitle, children }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-200">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          {title}
        </h1>
        {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}
```

Perubahan: `text-white` → `text-slate-900`, `border-slate-800/60` → `border-slate-200`, hapus `font-display` & `shadow-glow` yang tidak perlu di sini.

**Satu perubahan file ini langsung membuat judul di 5 halaman terlihat kembali.**

### Langkah 3 — Tambahkan varian `success` ke `StatCard` (S-20)

```js
// frontend/src/components/common/StatCard.jsx
const VARIANTS = {
  default: { iconBg: 'bg-emerald-50 border-emerald-100 text-emerald-600' },
  success: { iconBg: 'bg-teal-50 border-teal-100 text-teal-600' },      // ← BARU
  warning: { iconBg: 'bg-red-50 border-red-100 text-red-600' },
  info:    { iconBg: 'bg-sky-50 border-sky-100 text-sky-600' },
  alert:   { iconBg: 'bg-amber-50 border-amber-100 text-amber-600' }
}
```

### Langkah 4 — Samakan tema halaman yang tersisa

| File | Yang perlu diganti |
|---|---|
| `Register.jsx` | Samakan dengan `Login.jsx` (terang) — menutup R-03 |
| `RiwayatKunjungan.jsx` | `bg-slate-900/70` → `bg-white`, `border-slate-800` → `border-slate-200`, `text-white` → `text-slate-900` |
| `LaporanAnalitik.jsx` | idem |
| `PendaftaranKunjungan.jsx` | idem |
| `Pengaturan.jsx` | idem |
| `DataTable.jsx`, `Modal.jsx`, `CustomSelect.jsx`, `TagSelector.jsx`, `SearchAutocomplete.jsx`, `DatePicker.jsx`, `Badge.jsx` | idem |

Pola penggantiannya konsisten:

```
bg-slate-900/70   →  bg-white
bg-slate-950/80   →  bg-slate-50
border-slate-800  →  border-slate-200
text-white        →  text-slate-900
text-slate-300    →  text-slate-600
text-slate-400    →  text-slate-500
```

**Kerjakan ini terakhir**, setelah semua bug fungsional selesai. Ini pekerjaan yang banyak tapi berisiko rendah — dan hasilnya bisa dilihat langsung.

---

## Solusi #5 — Satukan cara menghitung statistik di satu tempat

**Menyelesaikan:** T-23, T-24, T-22, S-17, S-18, S-19, S-21 *(7 temuan)*

### Alasan logis

Saat ini perhitungan statistik ditulis ulang di `Dashboard.jsx` dan `LaporanAnalitik.jsx` dengan **hasil yang berbeda**. Ini bukan sekadar duplikasi kode — ini berarti sistem bisa mengeluarkan **dua angka berbeda untuk pertanyaan yang sama**. Kepala sekolah bisa menerima dua laporan yang bertentangan.

Solusinya: satu file penampung. Semua halaman memanggilnya. Kalau rumusnya perlu diubah, cukup satu tempat.

### Buat `frontend/src/utils/statistik.js` (file baru, folder yang sudah ada)

```js
// frontend/src/utils/statistik.js

/**
 * Mengubah tanggal menjadi 'YYYY-MM-DD' menurut waktu LOKAL (WIB).
 * ⚠️ JANGAN pakai toISOString() — itu UTC, dan menggeser tanggal 7 jam untuk Indonesia.
 * Inilah perbaikan untuk T-22.
 */
export function tanggalLokal(date) {
  const d = date instanceof Date ? date : new Date(date)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Kunjungan HARI INI (waktu lokal). Untuk kartu Dashboard yang diminta spesifikasi. */
export function kunjunganHariIni(list) {
  const hariIni = tanggalLokal(new Date())
  return list.filter((k) => k.waktu_masuk && tanggalLokal(k.waktu_masuk) === hariIni)
}

/** Kunjungan dalam 7 hari terakhir. Untuk "kasus darurat minggu ini". */
export function kunjunganMingguIni(list) {
  const batas = new Date()
  batas.setDate(batas.getDate() - 6)
  batas.setHours(0, 0, 0, 0)
  return list.filter((k) => k.waktu_masuk && new Date(k.waktu_masuk) >= batas)
}

/** Kunjungan pada bulan & tahun tertentu. Untuk filter Laporan (F-02). */
export function kunjunganPeriode(list, bulan, tahun) {
  return list.filter((k) => {
    if (!k.waktu_masuk) return false
    const d = new Date(k.waktu_masuk)
    return d.getMonth() + 1 === Number(bulan) && d.getFullYear() === Number(tahun)
  })
}

/** Siswa yang MASIH ada di UKS: status 'Istirahat di UKS' DAN belum keluar. */
export function sedangDiUKS(list) {
  return list.filter((k) => k.status === 'Istirahat di UKS' && !k.waktu_keluar)
}

/**
 * Peringkat keluhan. SELALU memecah teks per koma.
 * Ini SATU-SATUNYA implementasi — dipakai Dashboard DAN Laporan (menutup T-23).
 */
export function peringkatKeluhan(list, batas = 5) {
  const hitung = {}
  list.forEach((k) => {
    if (!k.keluhan_utama) return
    k.keluhan_utama.split(',').forEach((raw) => {
      const nama = raw.trim()
      if (nama) hitung[nama] = (hitung[nama] || 0) + 1
    })
  })
  return Object.entries(hitung)
    .map(([nama, total]) => ({ nama, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, batas)
}

/** Sebaran per kelas. */
export function sebaranKelas(list) {
  const hitung = {}
  list.forEach((k) => { if (k.kelas) hitung[k.kelas] = (hitung[k.kelas] || 0) + 1 })
  return Object.entries(hitung)
    .map(([kelas, total]) => ({ nama: `Kelas ${kelas}`, total }))
    .sort((a, b) => a.nama.localeCompare(b.nama))
}

/** Sebaran 4 status penanganan. */
export function sebaranStatus(list) {
  const hasil = {
    'Kembali ke Kelas': 0, 'Istirahat di UKS': 0,
    'Dijemput Wali': 0, 'Dirujuk ke Klinik': 0
  }
  list.forEach((k) => { if (k.status in hasil) hasil[k.status]++ })
  return hasil
}

/** Tren 7 hari terakhir — memakai tanggalLokal, jadi BEBAS dari bug UTC (T-22). */
export function tren7Hari(list) {
  const hasil = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const kunci = tanggalLokal(d)
    hasil.push({
      hari: ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'][d.getDay()],
      total: list.filter((k) => k.waktu_masuk && tanggalLokal(k.waktu_masuk) === kunci).length
    })
  }
  return hasil
}

/** 5 kunjungan terbaru — diurutkan EKSPLISIT, tidak bergantung urutan server (S-21). */
export function kunjunganTerbaru(list, batas = 5) {
  return [...list]
    .sort((a, b) => new Date(b.waktu_masuk) - new Date(a.waktu_masuk))
    .slice(0, batas)
}
```

### Pakai di Dashboard — sekaligus penuhi permintaan spesifikasi

```jsx
// frontend/src/pages/Dashboard.jsx
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { getGreeting } from '../utils/formatters'          // ← akhirnya dipakai (S-18)
import {
  kunjunganHariIni, kunjunganMingguIni, sedangDiUKS,
  peringkatKeluhan, tren7Hari, kunjunganTerbaru, sebaranStatus
} from '../utils/statistik'

export default function Dashboard() {
  const { user } = useAuth()
  const { kunjunganList, loading, error } = useData()

  const hariIni    = kunjunganHariIni(kunjunganList)
  const mingguIni  = kunjunganMingguIni(kunjunganList)
  const diUKS      = sedangDiUKS(kunjunganList)
  const bulanIni   = kunjunganPeriode(kunjunganList, new Date().getMonth() + 1, new Date().getFullYear())

  return (
    <div className="space-y-8">
      {/* ← Menutup S-17: sapaan yang diminta spesifikasi */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {getGreeting()}, {user?.nama_lengkap || 'Petugas UKS'}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Berikut ringkasan aktivitas UKS hari ini.
        </p>
      </div>

      {/* ← Menutup S-19: 3 kartu yang diminta spesifikasi */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard icon={Users}         value={hariIni.length}   unit="siswa"  label="Kunjungan Hari Ini"          variant="default" />
        <StatCard icon={BedDouble}     value={diUKS.length}     unit="siswa"  label="Sedang Istirahat di UKS"     variant="alert" />
        <StatCard icon={AlertTriangle} value={mingguIni.filter(k => k.is_darurat).length}
                                                                unit="kasus"  label="Kasus Darurat Minggu Ini"    variant="warning" />
      </div>

      {/* ← Menutup T-24: judul "Bulan Ini" sekarang BENAR-BENAR bulan ini */}
      <h3>5 Keluhan Terbanyak Bulan Ini</h3>
      {peringkatKeluhan(bulanIni, 5).map((k) => ( ... ))}
    </div>
  )
}
```

**Perhatikan `sedangDiUKS`** — fungsi ini memerlukan `waktu_keluar` yang saat ini tidak pernah terisi. Itulah sebabnya Solusi #6 diperlukan agar kartu ini akurat.

### Pakai di Laporan — perhitungan kini identik dengan Dashboard

```jsx
// frontend/src/pages/LaporanAnalitik.jsx
import { kunjunganPeriode, peringkatKeluhan, sebaranKelas, sebaranStatus } from '../utils/statistik'

const dataPeriode = kunjunganPeriode(kunjunganList, selectedBulan, selectedTahun)
const keluhanData = peringkatKeluhan(dataPeriode, 6)     // ← rumus SAMA dengan Dashboard
const kelasData   = sebaranKelas(dataPeriode)
const statusCount = sebaranStatus(dataPeriode)
```

> **Hasilnya:** Dashboard dan Laporan sekarang **mustahil** memberi angka berbeda, karena keduanya memanggil fungsi yang sama persis. Ini keuntungan struktural, bukan sekadar perbaikan bug — bug serupa tidak bisa muncul lagi di masa depan.

---

## Solusi #6 — Lengkapi CRUD kunjungan (endpoint yang hilang)

**Menyelesaikan:** F-05, T-20, S-15 *(3 temuan, dan membuat Solusi #5 akurat)*

### Alasan logis

Satu endpoint yang hilang menyebabkan **empat** masalah berantai:
1. Petugas tidak bisa mengoreksi kesalahan pencatatan
2. Kolom `waktu_keluar` mustahil terisi
3. Kartu "sedang istirahat di UKS" tidak bisa akurat
4. Spesifikasi "Aksi (Detail/**Edit**)" tidak terpenuhi

Menambahkan satu endpoint memperbaiki keempatnya.

### Langkah 1 — Controller

```js
// controllers/kunjunganController.js — TAMBAHKAN fungsi baru
export async function updateKunjungan(req, res, next) {
  const { id } = req.params
  const { keluhan_utama, keterangan, is_darurat, tindakan, status, waktu_keluar } = req.body

  try {
    // Aturan cerdas: jika status berubah menjadi "sudah tidak di UKS"
    // tapi waktu_keluar belum diisi, isi otomatis dengan waktu sekarang.
    const sudahSelesai = ['Kembali ke Kelas', 'Dijemput Wali', 'Dirujuk ke Klinik'].includes(status)
    const waktuKeluarFinal = waktu_keluar || (sudahSelesai ? new Date() : null)

    const [hasil] = await pool.query(
      `UPDATE kunjungan
       SET keluhan_utama = ?, keterangan = ?, is_darurat = ?, tindakan = ?, status = ?, waktu_keluar = ?
       WHERE id = ?`,
      [keluhan_utama, keterangan || '', is_darurat ? 1 : 0, tindakan || '', status, waktuKeluarFinal, id]
    )

    if (hasil.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Data kunjungan tidak ditemukan.' })
    }

    const [rows] = await pool.query('SELECT * FROM kunjungan WHERE id = ?', [id])
    res.json({
      success: true,
      message: 'Data kunjungan berhasil diperbarui',
      data: { ...rows[0], is_darurat: Boolean(rows[0].is_darurat) }
    })
  } catch (err) {
    next(err)      // serahkan ke errorHandler — tidak lagi membocorkan pesan SQL
  }
}
```

> **Perhatikan `affectedRows === 0` → 404.** Ini juga memperbaiki masalah "hapus/edit gagal diam-diam": kalau id tidak ada, klien mendapat pesan jelas alih-alih "berhasil" yang bohong.

**Perhatikan juga logika `waktu_keluar` otomatis.** Ini keputusan desain yang penting: petugas **tidak perlu ingat** mengisi waktu keluar. Cukup ubah status menjadi "Kembali ke Kelas", dan sistem mencatat waktunya sendiri. Ini menghormati kenyataan bahwa petugas UKS sedang mengurus anak sakit, bukan mengurus formulir.

### Langkah 2 — Route & API client

```js
// routes/kunjunganRoutes.js
import { getKunjungan, createKunjungan, updateKunjungan, deleteKunjungan } from '../controllers/kunjunganController.js'
router.put('/:id', requireAuth, updateKunjungan)          // ← BARU
```

```js
// frontend/src/utils/api.js
kunjungan: {
  getAll: () => fetchApi('/kunjungan'),
  create: (data) => fetchApi('/kunjungan', { method: 'POST', body: data }),
  update: (id, data) => fetchApi(`/kunjungan/${id}`, { method: 'PUT', body: data }),   // ← BARU
  delete: (id) => fetchApi(`/kunjungan/${id}`, { method: 'DELETE' })
},
laporan: {                                                                             // ← BARU (T-02)
  get: (bulan, tahun) => fetchApi(`/laporan?bulan=${bulan}&tahun=${tahun}`)
}
```

### Langkah 3 — Tombol cepat "Selesai" di Riwayat (nilai praktis tertinggi)

```jsx
// frontend/src/pages/RiwayatKunjungan.jsx — dalam kolom Aksi
{row.status === 'Istirahat di UKS' && !row.waktu_keluar && (
  <button
    onClick={async (e) => {
      e.stopPropagation()
      try {
        await updateKunjungan(row.id, { ...row, status: 'Kembali ke Kelas' })
        toast.success(`${row.siswa_nama} ditandai sudah kembali ke kelas.`)
      } catch (err) {
        toast.error(err.message || 'Gagal memperbarui status.')
      }
    }}
    className="p-2 rounded-lg bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700"
    title="Tandai sudah kembali ke kelas"
  >
    <CheckCircle2 className="w-4 h-4" />
  </button>
)}
```

> **Alasan mengapa tombol ini bernilai tinggi:** ia mengubah `waktu_keluar` dari kolom mati menjadi data yang benar-benar terisi — **dengan satu klik, tanpa membuka form.** Dan begitu kolom itu terisi, kartu "sedang istirahat di UKS" di Dashboard menjadi akurat. Satu tombol kecil menghidupkan satu fitur spesifikasi.

### Langkah 4 — Lengkapi juga endpoint laporan (T-01, T-03)

```js
// controllers/laporanController.js — ganti seluruh isi
export const laporanController = {
  getMonthlyReport: async (req, res, next) => {
    const bulan = Number(req.query.bulan) || new Date().getMonth() + 1
    const tahun = Number(req.query.tahun) || new Date().getFullYear()

    try {
      // Agregasi dilakukan di SQL — mengembalikan beberapa angka, bukan ribuan baris (T-03)
      const [[ringkasan]] = await pool.query(
        `SELECT COUNT(*) AS totalKunjungan,
                SUM(is_darurat = 1) AS totalDarurat,
                SUM(status = 'Kembali ke Kelas')  AS kembaliKeKelas,
                SUM(status = 'Istirahat di UKS')  AS istirahatDiUKS,
                SUM(status = 'Dijemput Wali')     AS dijemputWali,
                SUM(status = 'Dirujuk ke Klinik') AS dirujukKlinik
         FROM kunjungan
         WHERE MONTH(waktu_masuk) = ? AND YEAR(waktu_masuk) = ?`,     // ← filter BENAR-BENAR dipakai
        [bulan, tahun]
      )

      const [perKelas] = await pool.query(
        `SELECT kelas, COUNT(*) AS total FROM kunjungan
         WHERE MONTH(waktu_masuk) = ? AND YEAR(waktu_masuk) = ?
         GROUP BY kelas ORDER BY kelas`,
        [bulan, tahun]
      )

      res.json({ success: true, data: { bulan, tahun, ...ringkasan, perKelas } })
    } catch (err) {
      next(err)
    }
  }
}
```

---

## Solusi #7 — Satukan sumber skema & tambah integritas yang aman

**Menyelesaikan:** T-15, T-16, T-17, T-18, T-19, T-21, T-11, R-11, R-21 *(9 temuan)*

### Alasan logis

Tiga definisi skema yang berbeda adalah **bom waktu**. Saat ini ketiganya masih mirip, jadi belum terasa. Tapi begitu ada perubahan kolom, mereka bercabang — dan orang yang meng-*import* file `.sql` akan mendapat database yang tidak cocok dengan kode, dengan error yang sangat sulit dilacak.

### Langkah 1 — Amankan dulu, jangan langsung hapus

**Jangan hapus `db/uks_digital.db` sebelum memeriksa isinya.** File 36 KB itu bisa berisi data lama yang masih Anda butuhkan.

```bash
# Periksa dulu apakah ada data di dalamnya
node -e "const D=require('better-sqlite3');const d=new D('db/uks_digital.db',{readonly:true});['users','siswa','kunjungan'].forEach(t=>{try{console.log(t, d.prepare('SELECT COUNT(*) c FROM '+t).get().c)}catch(e){console.log(t,'(tidak ada)')}})"
```

Kalau hasilnya menunjukkan ada baris data yang Anda perlukan, ekspor dulu ke MySQL. Kalau semuanya 0 atau isinya hanya data uji, lanjut ke langkah berikut.

### Langkah 2 — Netralkan `sqliteDB.js` tanpa menghapus file

Karena aturan project melarang mengubah struktur folder, dan menghapus file bisa terasa berisiko, pendekatan paling aman: **buat file itu tidak berbahaya** dengan menonaktifkan efek sampingnya.

```js
// db/sqliteDB.js — ganti SELURUH isi dengan penanda ini
/**
 * ⚠️ FILE INI TIDAK DIPAKAI LAGI — JANGAN DIIMPOR.
 *
 * Aplikasi UKS Digital memakai MySQL/MariaDB, bukan SQLite.
 * Skema resmi ada di:
 *   • db/uks_digital.sql  (untuk import manual ke phpMyAdmin)
 *   • db/initDB.js        (dijalankan otomatis saat server menyala)
 *
 * Isi lama file ini memakai kolom `email` (aplikasi sekarang memakai `username`)
 * dan TIDAK memiliki kolom `waktu_keluar` — jadi skemanya BERTENTANGAN
 * dengan skema resmi. Memakainya akan merusak aplikasi.
 *
 * File dikosongkan (bukan dihapus) agar struktur folder tetap utuh
 * sesuai aturan project.
 */
throw new Error(
  'db/sqliteDB.js sudah tidak digunakan. Gunakan db/db.js (MySQL) sebagai satu-satunya koneksi database.'
)
```

**Alasan memakai `throw` alih-alih file kosong:** kalau suatu hari ada yang tanpa sengaja meng-*import*-nya, ia akan mendapat pesan yang **jelas dan langsung menunjuk arah yang benar** — bukannya perilaku aneh yang membingungkan. Ini juga sekaligus menghapus efek samping `initSQLiteDB()` di baris 112 (T-17).

Lalu bersihkan file fisiknya dan cabut dependency:

```bash
# Setelah dipastikan datanya tidak diperlukan
rm db/uks_digital.db db/uks_digital.db-shm db/uks_digital.db-wal
npm uninstall better-sqlite3
```

Tambahkan ke `.gitignore` agar tidak muncul lagi:

```gitignore
# File SQLite (aplikasi memakai MySQL)
db/*.db
db/*.db-shm
db/*.db-wal
```

### Langkah 3 — Jadikan `uks_digital.sql` satu-satunya sumber kebenaran

Tambahkan peringatan besar di bagian atas (T-19):

```sql
-- ============================================================================
--  ⚠️⚠️  PERINGATAN — BACA SEBELUM MENJALANKAN  ⚠️⚠️
--
--  File ini menjalankan DROP TABLE pada kunjungan, siswa, users, dan
--  pengaturan_sekolah. SELURUH DATA YANG ADA AKAN HILANG PERMANEN.
--
--  ✅ Gunakan file ini HANYA untuk instalasi baru / database kosong.
--  ❌ JANGAN jalankan pada database yang sudah berisi data kunjungan asli.
--
--  Untuk memperbarui database yang sudah berisi data, gunakan:
--      node db/initDB.js
--  (aman, memakai CREATE TABLE IF NOT EXISTS — tidak menghapus apa pun)
--
--  📌 File ini adalah SUMBER KEBENARAN skema. Setiap perubahan struktur
--     tabel WAJIB diterapkan di sini DAN di db/initDB.js secara bersamaan.
-- ============================================================================
```

### Langkah 4 — Tambah integritas referensial yang tetap fleksibel

Ini bagian yang paling penting secara desain. Ingat dua kebutuhan yang **bertentangan**:

- Kita **ingin** database mencegah `siswa_id` menunjuk siswa yang tidak ada
- Kita **tetap ingin** bisa mencatat kunjungan siswa yang belum terdaftar (kasus darurat)

Kedua-duanya bisa dipenuhi:

```sql
-- Tambahkan di uks_digital.sql pada definisi tabel kunjungan:
CREATE TABLE kunjungan (
  id INT AUTO_INCREMENT PRIMARY KEY,
  siswa_id INT NULL,                          -- tetap NULL: kasus darurat tetap bisa dicatat
  petugas_id INT NULL,                        -- ← BARU: menutup T-11 (jejak audit)
  siswa_nama VARCHAR(100) NOT NULL,           -- salinan historis (sengaja, sudah benar)
  ...

  CONSTRAINT fk_kunjungan_siswa
    FOREIGN KEY (siswa_id) REFERENCES siswa(id)
    ON DELETE SET NULL                        -- ← kunci solusinya
    ON UPDATE CASCADE,

  CONSTRAINT fk_kunjungan_petugas
    FOREIGN KEY (petugas_id) REFERENCES users(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

> 🧠 **Mengapa `ON DELETE SET NULL` adalah jawaban yang tepat di sini?**
>
> Ada tiga pilihan saat siswa dihapus:
>
> | Pilihan | Yang terjadi | Cocok? |
> |---|---|---|
> | `CASCADE` | **Semua riwayat kunjungan siswa itu ikut terhapus** | ❌ **Berbahaya!** Rekam kesehatan lenyap. Untuk data medis, ini tidak bisa diterima. |
> | `RESTRICT` | Siswa **tidak bisa dihapus** selama punya riwayat | ⚠️ Terlalu kaku — siswa salah input jadi mustahil dibersihkan |
> | `SET NULL` | Riwayat **tetap ada**, hanya tautannya dilepas | ✅ **Tepat** |
>
> Dengan `SET NULL`, riwayat kunjungan tetap terbaca sepenuhnya — karena `siswa_nama`, `siswa_nis`, dan `kelas` sudah **disalin** ke tabel `kunjungan` (ingat Keputusan A di Bagian 1.5). **Inilah momen di mana denormalisasi yang tadinya tampak "salah" terbukti sebagai keputusan yang menyelamatkan.**
>
> Jadi: database kini mencegah id ngawur, kasus darurat tetap bisa dicatat, dan rekam kesehatan tidak pernah hilang. Ketiga kebutuhan terpenuhi sekaligus.

Terapkan pada database yang sudah ada:

```sql
-- Jalankan sekali di phpMyAdmin. Bersihkan dulu id yang menggantung.
UPDATE kunjungan SET siswa_id = NULL
WHERE siswa_id IS NOT NULL AND siswa_id NOT IN (SELECT id FROM siswa);

ALTER TABLE kunjungan ADD COLUMN petugas_id INT NULL AFTER siswa_id;

ALTER TABLE kunjungan
  ADD CONSTRAINT fk_kunjungan_siswa FOREIGN KEY (siswa_id) REFERENCES siswa(id)
      ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT fk_kunjungan_petugas FOREIGN KEY (petugas_id) REFERENCES users(id)
      ON DELETE SET NULL ON UPDATE CASCADE;
```

Lalu catat petugasnya saat menyimpan (kini mungkin karena Solusi #1 menyediakan `req.user`):

```js
// controllers/kunjunganController.js — di createKunjungan
`INSERT INTO kunjungan (siswa_id, petugas_id, siswa_nama, ...) VALUES (?, ?, ?, ...)`,
[siswa_id || null, req.user.id, siswa_nama, ...]      // ← jejak audit terisi otomatis
```

### Langkah 5 — Rapikan `role` menjadi nilai terbatas (R-21)

```sql
ALTER TABLE users MODIFY COLUMN role
  ENUM('Petugas UKS Utama', 'Petugas UKS', 'Dokter Kecil UKS')
  NOT NULL DEFAULT 'Petugas UKS';
```

Dan dokumentasikan keputusan denormalisasi agar tidak "diperbaiki" salah oleh programmer berikutnya:

```sql
CREATE TABLE kunjungan (
  ...
  siswa_nama VARCHAR(100) NOT NULL
    COMMENT 'SALINAN SENGAJA dari siswa.nama pada saat kunjungan. JANGAN diganti JOIN — laporan historis harus menampilkan nama & kelas SAAT ITU, bukan yang sekarang.',
  kelas VARCHAR(5) NOT NULL
    COMMENT 'SALINAN SENGAJA dari siswa.kelas saat kunjungan. Siswa naik kelas setiap tahun; laporan lama harus tetap benar.',
```

---

## Solusi #8 — Pasang lapisan validasi tunggal

**Menyelesaikan:** T-05, T-04, T-14, F-06, S-07, S-11, S-16, S-22, S-23, S-24 *(10 temuan — AKAR 5)*

### Alasan logis

Ada dua alasan validasi harus ada di server:

1. **Keamanan** — validasi frontend bisa dilewati total dengan `curl`. Ia hanya pemanis pengalaman, bukan pengaman.
2. **Pesan error yang manusiawi** — tanpa validasi, pengguna melihat `Duplicate entry '123' for key 'siswa.nis'`. Dengan validasi, ia melihat "NIS 123 sudah terdaftar untuk siswa lain."

Dan yang paling penting: **satu tempat untuk aturan** menutup jalur "terkunci dari akun sendiri" (F-06), karena backend dan frontend akhirnya memakai aturan yang sama persis.

### Buat `controllers/validators.js` (file baru, folder yang sudah ada)

```js
// controllers/validators.js — SATU-SATUNYA sumber aturan validasi

export const USERNAME_REGEX = /^[a-z][a-z0-9_]{3,19}$/
export const STATUS_SAH = ['Kembali ke Kelas', 'Istirahat di UKS', 'Dijemput Wali', 'Dirujuk ke Klinik']
export const KELAS_SAH = ['1', '2', '3', '4', '5', '6']
export const JK_SAH = ['Laki-laki', 'Perempuan']

export function validateUsername(username) {
  if (!username) return 'Username wajib diisi!'
  if (username.length < 4) return 'Username minimal 4 karakter!'
  if (username.length > 20) return 'Username maksimal 20 karakter!'
  if (/^[0-9]/.test(username)) return 'Username tidak boleh dimulai dengan angka!'
  if (!/^[a-z0-9_]+$/.test(username)) return 'Username hanya boleh huruf kecil, angka, dan underscore (_)!'
  if (!USERNAME_REGEX.test(username)) return 'Format username tidak valid.'
  return null
}

export function validateSiswa(data, { wajibLengkap = true } = {}) {
  const e = []
  const nis = String(data.nis || '').trim()
  const nama = String(data.nama || '').trim()

  if (wajibLengkap || data.nis !== undefined) {
    if (!nis) e.push('NIS wajib diisi.')
    else if (!/^[A-Za-z0-9]{4,20}$/.test(nis)) e.push('NIS harus 4–20 karakter huruf/angka tanpa spasi.')
  }
  if (wajibLengkap || data.nama !== undefined) {
    if (!nama) e.push('Nama lengkap wajib diisi.')
    else if (nama.length < 3) e.push('Nama terlalu pendek (minimal 3 karakter).')
    else if (nama.length > 100) e.push('Nama maksimal 100 karakter.')
  }
  if (data.kelas !== undefined && !KELAS_SAH.includes(String(data.kelas)))
    e.push(`Kelas harus salah satu dari: ${KELAS_SAH.join(', ')}.`)
  if (data.jenis_kelamin !== undefined && !JK_SAH.includes(data.jenis_kelamin))
    e.push('Jenis kelamin harus "Laki-laki" atau "Perempuan".')

  // ← menutup S-23 untuk siswa: tanggal lahir harus masuk akal untuk siswa SD
  if (data.tanggal_lahir) {
    const t = new Date(data.tanggal_lahir)
    if (Number.isNaN(t.getTime())) e.push('Format tanggal lahir tidak valid.')
    else {
      const umur = (Date.now() - t.getTime()) / (365.25 * 24 * 3600 * 1000)
      if (umur < 4 || umur > 16) e.push('Tanggal lahir tidak wajar untuk siswa SD (umur 4–16 tahun).')
    }
  }
  if (data.telepon_wali && !/^[0-9+\-\s()]{8,15}$/.test(data.telepon_wali))
    e.push('Nomor telepon wali tidak valid (8–15 digit).')

  return e.length ? e : null
}

export function validateKunjungan(data) {
  const e = []
  if (!String(data.siswa_nama || '').trim()) e.push('Nama siswa wajib diisi.')
  if (!String(data.keluhan_utama || '').trim()) e.push('Keluhan utama wajib diisi.')

  // ← menutup S-22: cegah keterangan panjang meluber ke VARCHAR(255)
  if (String(data.keluhan_utama || '').length > 255)
    e.push('Keluhan terlalu panjang (maks 255 karakter). Pindahkan detailnya ke kolom Keterangan.')
  if (String(data.tindakan || '').length > 255)
    e.push('Tindakan terlalu panjang (maks 255 karakter).')

  if (data.status && !STATUS_SAH.includes(data.status))
    e.push(`Status harus salah satu dari: ${STATUS_SAH.join(', ')}.`)
  if (data.kelas && !KELAS_SAH.includes(String(data.kelas)))
    e.push(`Kelas tidak valid.`)

  // ← menutup S-23: waktu kunjungan tidak boleh di masa depan
  if (data.waktu_masuk) {
    const w = new Date(data.waktu_masuk)
    if (Number.isNaN(w.getTime())) e.push('Format waktu masuk tidak valid.')
    else if (w.getTime() > Date.now() + 60_000) e.push('Waktu masuk tidak boleh di masa depan.')
  }
  if (data.waktu_keluar && data.waktu_masuk && new Date(data.waktu_keluar) < new Date(data.waktu_masuk))
    e.push('Waktu keluar tidak boleh lebih awal dari waktu masuk.')

  return e.length ? e : null
}
```

### Pakai di controller — sekaligus perbaiki pesan error (T-04)

```js
// controllers/siswaController.js
import { validateSiswa } from './validators.js'

export async function createSiswa(req, res, next) {
  const errors = validateSiswa(req.body)
  if (errors) {
    return res.status(400).json({ success: false, message: errors.join(' '), errors })
  }

  try {
    const [ada] = await pool.query('SELECT id FROM siswa WHERE nis = ?', [req.body.nis])
    if (ada.length) {
      // ← pesan manusiawi, bukan "Duplicate entry ... for key 'siswa.nis'"
      return res.status(409).json({ success: false, message: `NIS ${req.body.nis} sudah terdaftar untuk siswa lain.` })
    }

    const [hasil] = await pool.query(
      `INSERT INTO siswa (nis, nama, kelas, jenis_kelamin, tanggal_lahir, nama_wali, telepon_wali)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.body.nis, req.body.nama, req.body.kelas, req.body.jenis_kelamin,
       req.body.tanggal_lahir || null, req.body.nama_wali || '', req.body.telepon_wali || '']
    )
    res.status(201).json({ success: true, data: { id: hasil.insertId, ...req.body } })
  } catch (err) {
    next(err)      // ← errorHandler mencatat detail di server, mengirim pesan aman ke klien
  }
}
```

### Tutup jalur "terkunci dari akun" (F-06)

```js
// controllers/pengaturanController.js
import { validateUsername } from './validators.js'

updatePetugas: async (req, res, next) => {
  const { nama_lengkap, username, nip, no_telepon } = req.body

  if (username !== undefined) {
    const err = validateUsername(username.toLowerCase())
    if (err) return res.status(400).json({ success: false, message: err })   // ← TIDAK BISA lagi simpan 'ab'

    const [bentrok] = await pool.query(
      'SELECT id FROM users WHERE username = ? AND id != ?',
      [username.toLowerCase(), req.user.id]
    )
    if (bentrok.length) {
      return res.status(409).json({ success: false, message: 'Username tersebut sudah dipakai akun lain.' })
    }
  }
  ...
}
```

Dan di frontend, tampilkan aturan yang **benar-benar ditegakkan**:

```jsx
// frontend/src/pages/Pengaturan.jsx
const usernameError = petugas.username ? validateUsername(petugas.username) : null

<input
  value={petugas.username}
  onChange={(e) => setPetugas({
    ...petugas,
    username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')
  })}
/>
{usernameError && <p className="text-[11px] text-coral-600 font-semibold">{usernameError}</p>}

<button type="submit" disabled={loadingPetugas || !!usernameError}>
  Simpan Profil
</button>
```

**Sekarang mustahil menyimpan username yang tidak bisa dipakai login** — dijaga di frontend (nyaman) **dan** di backend (aman).

### Pasang `errorHandler` di `app.js`

```js
// app.js — HARUS diletakkan PALING BAWAH, setelah semua route
import { errorHandler } from './middleware.js'

app.use('/api/pengaturan', pengaturanRoutes)

// 404 handler
app.use((req, res) => { ... })

// Penangan error terpusat — WAJIB terakhir
app.use(errorHandler)
```

> **Alasan urutannya harus terakhir:** Express memproses middleware dari atas ke bawah. `errorHandler` punya 4 parameter (`err, req, res, next`), yang menandainya sebagai penangan error. Ia hanya dipanggil ketika ada `next(err)` di suatu tempat di atasnya. Kalau diletakkan di atas, ia tidak akan pernah menangkap apa pun.

---

## Solusi #9 — Lengkapi kekurangan terhadap spesifikasi

**Menyelesaikan:** S-14, S-15, S-17, S-19, T-28, R-01, R-02 *(7 temuan)*

### Alasan logis

Temuan-temuan ini bukan "bug" dalam arti kode yang rusak — semuanya berjalan tanpa error. Tapi ini adalah **janji yang belum ditepati** terhadap spesifikasi di `Preview, Prompt, and rules.md`. Untuk project yang akan dinilai atau diserahkan, kesesuaian dengan spesifikasi sama pentingnya dengan tidak adanya error.

### Tabel kesesuaian spesifikasi

| Permintaan di spesifikasi | Status | Perbaikan |
|---|---|---|
| "Selamat Datang [Nama akun yang login]" | 🔴 Tidak ada | Solusi #5 Langkah Dashboard |
| Kartu "kunjungan hari ini" | 🔴 Tidak ada | `kunjunganHariIni()` |
| Kartu "siswa sedang istirahat di UKS" | 🔴 Tidak ada | `sedangDiUKS()` + Solusi #6 |
| Kartu "kasus darurat minggu ini" | 🔴 Tidak ada | `kunjunganMingguIni()` |
| Top-5 penyakit **bulan ini** | 🟠 Ada tapi menghitung sepanjang masa | `peringkatKeluhan(bulanIni)` |
| Riwayat: filter **by Tanggal** | 🔴 Tidak ada | Lihat kode di bawah |
| Riwayat: **Aksi (Detail/Edit)** | 🟠 Hanya Detail | Solusi #6 |
| Autocomplete "Andi Putra - 4A" | 🟡 Berfungsi, tapi kelas hanya 1–6 | Lihat catatan rombel |

### Tambahkan filter tanggal di Riwayat (S-14)

```jsx
// frontend/src/pages/RiwayatKunjungan.jsx
const [dariTanggal, setDariTanggal] = useState('')
const [sampaiTanggal, setSampaiTanggal] = useState('')

const filteredData = kunjunganList.filter((k) => {
  // ... filter yang sudah ada (cari, kelas, status, darurat) ...

  // ← BARU: filter rentang tanggal
  let cocokTanggal = true
  if (dariTanggal || sampaiTanggal) {
    const tgl = tanggalLokal(k.waktu_masuk)        // dari utils/statistik.js — bebas bug UTC
    if (dariTanggal && tgl < dariTanggal) cocokTanggal = false
    if (sampaiTanggal && tgl > sampaiTanggal) cocokTanggal = false
  }

  return matchSearch && matchKelas && matchStatus && matchDarurat && cocokTanggal
})
```

```jsx
{/* Baris filter tanggal */}
<div className="flex items-center gap-2">
  <label className="text-xs font-semibold text-slate-600">Dari</label>
  <input type="date" value={dariTanggal} onChange={(e) => setDariTanggal(e.target.value)}
    className="px-3 py-2 rounded-lg border border-slate-200 text-xs" />
  <label className="text-xs font-semibold text-slate-600">s/d</label>
  <input type="date" value={sampaiTanggal} onChange={(e) => setSampaiTanggal(e.target.value)}
    className="px-3 py-2 rounded-lg border border-slate-200 text-xs" />
  {(dariTanggal || sampaiTanggal) && (
    <button onClick={() => { setDariTanggal(''); setSampaiTanggal('') }}
      className="text-xs text-emerald-600 font-semibold">Reset tanggal</button>
  )}
</div>
```

### Buat label periode laporan jujur (T-28)

```jsx
// Ganti periodeLabel="Tahun 2026" yang di-hardcode dengan label dinamis
const labelPeriode = dariTanggal && sampaiTanggal
  ? `${formatTanggalPendek(dariTanggal)} – ${formatTanggalPendek(sampaiTanggal)}`
  : dariTanggal  ? `Sejak ${formatTanggalPendek(dariTanggal)}`
  : sampaiTanggal ? `Sampai ${formatTanggalPendek(sampaiTanggal)}`
  : 'Seluruh Periode'

<PrintReportTemplate periodeLabel={labelPeriode} dataKunjungan={filteredData} ... />
```

> **Alasan ini penting:** dokumen resmi yang diserahkan ke kepala sekolah harus **menyatakan dengan benar** data apa yang dikandungnya. Label "Tahun 2026" di atas data yang sudah difilter hanya kelas 3 adalah kesalahan faktual pada dokumen resmi.

### Perbaiki typo & tambah tautan Register (R-01, R-02)

```jsx
// frontend/src/pages/Login.jsx
<p className="text-[11px] font-bold text-emerald-600 tracking-[0.15em] uppercase mb-2">
  SDN 05 Parambahan          {/* ← perbaiki dari "Prambahan" */}
</p>
```

```jsx
{/* Tambahkan di bawah tombol Masuk */}
<p className="text-center text-xs text-slate-500 mt-5">
  Belum punya akun?{' '}
  <Link to="/register" className="text-emerald-600 font-semibold hover:text-emerald-700">
    Daftar di sini
  </Link>
</p>
```

> **Catatan:** kalau Anda menerapkan Solusi #1 Langkah 5 (menutup pendaftaran umum), tautan ini sebaiknya diganti menjadi teks *"Hubungi Petugas UKS Utama untuk pembuatan akun."* Pilih sesuai kebutuhan sekolah — yang penting halaman `/register` tidak lagi menjadi halaman tersembunyi yang mustahil ditemukan.

### Catatan tentang rombel ("4A", "4B")

Spesifikasi memberi contoh **"Andi Putra - 4A"**, yang menyiratkan adanya rombel. Kabar baiknya: **database sudah siap** karena `kelas VARCHAR(5)` cukup untuk menampung `"4A"`. Yang perlu diubah hanya daftar pilihan di frontend:

```js
// frontend/src/data/mockData.js
export const kelasOptions = [
  '1A', '1B', '2A', '2B', '3A', '3B',
  '4A', '4B', '5A', '5B', '6A', '6B'
]
```

Dan sesuaikan `KELAS_SAH` di `controllers/validators.js`. **Tanyakan dulu ke sekolah** apakah mereka memakai rombel — kalau setiap tingkat hanya punya satu kelas, `'1'`–`'6'` yang sekarang justru lebih tepat.

---

## Solusi #10 — Rapikan konfigurasi yang di-*hardcode*

**Menyelesaikan:** T-07, R-12, R-16, S-31, S-32 *(5 temuan)*

### Perbaiki `initDB.js` yang mengabaikan `host` (T-07)

```js
// db/initDB.js — perbaikan 2 baris
console.log(`🔄 Menghubungkan ke MySQL di ${host}:${port}...`)                    // ← pakai variabel
const rootConnection = await mysql.createConnection({ host, port, user, password }) // ← bukan '127.0.0.1'
```

**Alasan:** bug ini menghasilkan gejala yang **sangat membingungkan** — koneksi biasa berhasil (karena `db.js` memakai host yang benar) tapi pembuatan skema gagal. Setengah sistem bekerja, setengahnya tidak, dan tidak ada petunjuk mengapa. Perbaikan 2 baris ini menghilangkan jam-jam debugging di masa depan.

### Beri suara pada blok migrasi yang bisu (T-08)

```js
} catch (migErr) {
  // Kemungkinan besar kolom sudah benar — tapi JANGAN sembunyikan error nyata
  if (!/duplicate|exists|unknown column/i.test(migErr.message)) {
    console.warn(`⚠️ Migrasi kolom email→username gagal: ${migErr.message}`)
  }
}
```

### Pindahkan alamat frontend ke `.env` (R-12)

```env
# .env
FRONTEND_URL=http://localhost:5173
```

```js
// app.js
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'
app.get('/', (req, res) => res.redirect(`${FRONTEND_URL}/login`))
```

### Amankan konfigurasi database untuk produksi (R-16)

```env
# .env — WAJIB diubah sebelum dipasang di komputer server sekolah
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=uks_app                        # ← JANGAN pakai root
DB_PASSWORD=GantiDenganPasswordKuat    # ← JANGAN biarkan kosong
DB_NAME=uks_digital
JWT_SECRET=ganti-dengan-teks-acak-panjang-minimal-32-karakter
PORT=3000
FRONTEND_URL=http://localhost:5173
```

Buat pengguna MySQL khusus dengan hak terbatas:

```sql
CREATE USER 'uks_app'@'localhost' IDENTIFIED BY 'GantiDenganPasswordKuat';
GRANT SELECT, INSERT, UPDATE, DELETE ON uks_digital.* TO 'uks_app'@'localhost';
FLUSH PRIVILEGES;
```

> **Alasan tidak memakai `root`:** kalau ada celah SQL Injection yang belum ketahuan, penyerang dengan akses `root` bisa membaca **semua database** di server itu dan bahkan menjalankan perintah sistem. Dengan pengguna terbatas, kerusakan maksimalnya hanya sebatas database UKS — dan ia tidak bisa `DROP DATABASE` atau membuat pengguna baru.

Tambahkan pemeriksaan `JWT_SECRET` saat startup:

```js
// server.js
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error('❌ JWT_SECRET belum diatur atau terlalu pendek (minimal 32 karakter).')
  console.error('   Tambahkan di file .env, lalu jalankan ulang server.')
  process.exit(1)
}
```

### Hapus cache API pada PWA (S-31) — jangan diperbaiki

```js
// frontend/vite.config.js
workbox: {
  globPatterns: ['**/*.{js,css,html,png,svg,woff2}']
  // runtimeCaching DIHAPUS SEPENUHNYA — lihat alasan di bawah
}
```

> **Alasan menghapus alih-alih memperbaiki:** aturan `urlPattern` saat ini tidak pernah cocok, jadi cache API sebenarnya **tidak aktif**. Kalau polanya "diperbaiki", service worker akan mulai menyimpan respons berisi **data kesehatan siswa** ke disk pengguna selama 5 menit.
>
> Untuk data medis anak, men-*cache* respons API ke disk adalah risiko yang tidak sebanding dengan manfaatnya (menghemat beberapa milidetik pada aplikasi yang berjalan di jaringan lokal). **Kebetulan yang menguntungkan ini sebaiknya dijadikan keputusan yang sengaja.**
>
> Cache aset statis (`globPatterns`) tetap dipertahankan — itu aman dan berguna, karena hanya berisi kode aplikasi, bukan data.

### Cegah pembaruan PWA mengganggu form yang sedang diisi (S-32)

```js
// frontend/vite.config.js
VitePWA({
  registerType: 'prompt',      // ← ganti dari 'autoUpdate'
  ...
})
```

Lalu tampilkan tombol pembaruan alih-alih memuat ulang paksa:

```jsx
// frontend/src/main.jsx
import { registerSW } from 'virtual:pwa-register'

const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('Versi baru UKS Digital tersedia. Muat ulang sekarang?')) updateSW(true)
  }
})
```

> **Alasan:** dengan `autoUpdate`, halaman bisa dimuat ulang **saat petugas sedang mengisi form kunjungan** — dan seluruh isian hilang. Dengan `prompt`, petugas memutuskan sendiri kapan waktunya aman.

---

## Solusi #11 — Perbaiki ekspor CSV & PDF

**Menyelesaikan:** T-25, T-26, T-27, T-32, T-33, S-34 *(6 temuan)*

### Alasan logis

Ekspor adalah **titik serah** aplikasi ini ke dunia luar — file yang dibuka di Excel dan dokumen yang diserahkan ke kepala sekolah. Kalau bagian ini rusak, seluruh pekerjaan pencatatan yang rapi menjadi tidak berguna di mata penerima.

### CSV yang benar untuk Excel Indonesia

```js
// frontend/src/pages/RiwayatKunjungan.jsx

/** Membungkus satu sel sesuai standar CSV (RFC 4180). */
function selCSV(nilai) {
  const teks = nilai === null || nilai === undefined ? '' : String(nilai)
  // Kutip di dalam data digandakan — INILAH perbaikan T-25
  return `"${teks.replace(/"/g, '""')}"`
}

const handleExportCSV = () => {
  if (filteredData.length === 0) {
    toast.error('Tidak ada data untuk diekspor.')
    return
  }

  const headers = ['No', 'NIS', 'Nama Siswa', 'Kelas', 'Waktu Masuk', 'Waktu Keluar',
                   'Keluhan', 'Tindakan', 'Status', 'Darurat', 'Keterangan']

  const baris = filteredData.map((k, i) => [
    i + 1, k.siswa_nis, k.siswa_nama, k.kelas,
    formatTanggalWaktu(k.waktu_masuk),
    k.waktu_keluar ? formatTanggalWaktu(k.waktu_keluar) : '-',
    k.keluhan_utama, k.tindakan || '-', k.status,
    k.is_darurat ? 'Ya' : 'Tidak', k.keterangan || ''
  ].map(selCSV).join(';'))          // ← titik-koma: Excel Indonesia memakai ini sebagai pemisah

  // ﻿ adalah BOM UTF-8 — INILAH perbaikan T-26 (agar °C tidak jadi Â°C)
  const isi = '﻿' + [headers.map(selCSV).join(';'), ...baris].join('\r\n')

  // Blob, bukan data: URI — INILAH perbaikan T-27 (tidak terpotong oleh '#', tanpa batas ukuran)
  const blob = new Blob([isi], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `riwayat_kunjungan_uks_${tanggalLokal(new Date())}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)          // bebaskan memori

  toast.success(`${filteredData.length} baris berhasil diekspor ke CSV.`)
}
```

**Empat perbaikan dan alasan masing-masing:**

| Perbaikan | Masalah yang diselesaikan |
|---|---|
| `replace(/"/g, '""')` | Keterangan berisi kutip tidak lagi menggeser kolom di Excel |
| `'﻿'` di awal | `°C`, `é`, dan karakter khusus tampil benar di Excel |
| `Blob` + `URL.createObjectURL` | Nama berisi `#` tidak lagi memotong file; tanpa batas ~2 MB |
| Pemisah `;` bukan `,` | Excel dengan pengaturan regional Indonesia membaca kolom dengan benar |

> 🧠 **Kenapa pemisah titik-koma?** Excel memakai pemisah daftar yang mengikuti pengaturan regional Windows. Di Indonesia, pemisah desimal adalah koma (`38,5`), sehingga pemisah daftar menjadi titik-koma. Kalau CSV memakai koma, Excel Indonesia akan menaruh semua data dalam satu kolom. Ini penyebab keluhan "file CSV-nya berantakan" yang paling umum.

### PDF yang aman untuk dokumen resmi

```jsx
// frontend/src/components/common/PrintReportTemplate.jsx

const MAKS_BARIS_PDF = 500

const handleDownloadPDF = () => {
  // ← perbaikan T-33: cegah browser membeku pada ribuan baris
  if (dataKunjungan.length > MAKS_BARIS_PDF) {
    toast.error(
      `Data terlalu banyak (${dataKunjungan.length} baris). ` +
      `Gunakan filter tanggal untuk mempersempit maksimal ${MAKS_BARIS_PDF} baris, ` +
      `atau gunakan Ekspor CSV untuk data lengkap.`
    )
    return
  }
  toast.info('Sedang membuat file PDF...')
  html2pdf().set(opt).from(printRef.current).save()
    .then(() => toast.success('File PDF berhasil diunduh!'))
    .catch((err) => { console.error(err); toast.error('Gagal membuat PDF.') })
}
```

```css
/* Ganti CSS cetak — perbaikan T-32 & S-34 */
@media print {
  /* display:none, bukan visibility:hidden — elemen tersembunyi tidak lagi
     menyisakan ruang kosong yang menghasilkan halaman blank */
  body > *:not(.print-root) { display: none !important; }

  .print-root, .print-area { display: block !important; }
  .no-print { display: none !important; }

  .print-area {
    position: static !important;
    width: 100% !important;
    margin: 0 !important; padding: 0 !important;
    background: white !important; color: black !important;
    border: none !important; box-shadow: none !important;
  }

  /* Baris tabel tidak terpotong antar halaman — perbaikan S-34 */
  table { page-break-inside: auto; }
  tr    { page-break-inside: avoid; page-break-after: auto; }
  thead { display: table-header-group; }    /* header berulang di setiap halaman */
  tfoot { display: table-footer-group; }

  /* Blok tanda tangan tidak terbelah dua halaman */
  .signature-block { page-break-inside: avoid; }

  @page { size: A4 portrait; margin: 15mm; }
}
```

> **Alasan `display: none` lebih baik daripada `visibility: hidden`:** `visibility: hidden` menyembunyikan elemen **tapi tetap menyisakan ruangnya**. Untuk aplikasi sepanjang satu layar penuh, ruang kosong itu bisa memakan satu halaman A4 utuh — sehingga PDF dimulai dengan halaman kosong. `display: none` menghapus elemen dari alur tata letak sepenuhnya.
>
> `thead { display: table-header-group }` adalah bonus penting: pada laporan multi-halaman, judul kolom akan **berulang di setiap halaman** — persyaratan standar untuk dokumen resmi.

---

## Solusi #12 — Siapkan jalur produksi satu port

**Menyelesaikan:** kesiapan *deploy* (bukan bug, tapi penghalang saat dipakai sungguhan)

### Alasan logis

Saat ini aplikasi **hanya bisa jalan dalam mode pengembangan**, karena frontend bergantung pada proxy Vite yang tidak ada di produksi. Kalau Anda menjalankan `npm run build` lalu membuka file hasilnya, **semua panggilan `/api` akan gagal.**

Untuk dipakai di ruang UKS, aplikasi harus bisa dijalankan dengan **satu perintah** dan diakses dari **satu alamat**.

### Sajikan frontend hasil build dari Express

```js
// app.js — TAMBAHKAN sebelum 404 handler
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distPath = path.join(__dirname, 'frontend', 'dist')

// Sajikan file statis hasil build
app.use(express.static(distPath))

// Semua rute non-API diserahkan ke React Router (mode SPA)
app.get(/^(?!\/api).*/, (req, res, next) => {
  res.sendFile(path.join(distPath, 'index.html'), (err) => err && next())
})
```

```json
// package.json
"scripts": {
  "dev": "nodemon server.js",
  "dev:frontend": "npm --prefix frontend run dev",
  "dev:all": "concurrently \"npm run dev\" \"npm --prefix frontend run dev\"",
  "build": "npm --prefix frontend install && npm --prefix frontend run build",
  "start": "node server.js"
}
```

**Cara pakai di komputer UKS:**

```bash
npm install
npm run build       # bangun frontend sekali
npm start           # jalankan — buka http://localhost:3000
```

**Keuntungannya:**

| Sebelum | Sesudah |
|---|---|
| Butuh 2 terminal (`:3000` + `:5173`) | Satu perintah `npm start` |
| Bergantung pada proxy Vite | Tidak ada proxy — satu asal |
| Masalah CORS mungkin muncul | CORS tidak relevan lagi |
| Redirect ke `localhost:5173` yang salah | Semua di satu alamat |
| Sulit dijelaskan ke petugas sekolah | Cukup: "buka localhost:3000" |

Dan sebagai bonus, ini menghilangkan sepenuhnya kelas masalah CORS (K-09) karena frontend dan backend berada di asal yang sama.

### Buat cadangan otomatis (sangat disarankan untuk data kesehatan)

```js
// db/backup.js — file BARU di folder db/ yang sudah ada
import { exec } from 'child_process'
import path from 'path'
import dotenv from 'dotenv'
dotenv.config()

const stamp = new Date().toISOString().slice(0, 10)
const target = path.join('backups', `uks_digital_${stamp}.sql`)

const cmd = `mysqldump -h ${process.env.DB_HOST} -P ${process.env.DB_PORT} ` +
            `-u ${process.env.DB_USER} ${process.env.DB_PASSWORD ? `-p${process.env.DB_PASSWORD}` : ''} ` +
            `${process.env.DB_NAME} > "${target}"`

exec(cmd, (err) => {
  if (err) { console.error('❌ Backup gagal:', err.message); process.exit(1) }
  console.log(`✅ Backup tersimpan: ${target}`)
})
```

Jalankan mingguan lewat Task Scheduler Windows: `node db/backup.js`

Tambahkan `backups/` ke `.gitignore` — **file cadangan berisi data kesehatan siswa dan tidak boleh masuk git.**

> **Alasan ini penting:** aplikasi ini adalah satu-satunya tempat rekam kesehatan siswa tersimpan. Kalau hard disk komputer UKS rusak — dan hard disk **pasti** rusak pada akhirnya — seluruh riwayat hilang. Cadangan mingguan adalah biaya yang sangat kecil dibanding risikonya.

---

## Solusi #13 — Bersihkan kode mati & dependency tak terpakai

**Menyelesaikan:** R-09, R-10, R-11, R-13, R-14, R-15, R-18, R-19, R-20, S-04, S-33 *(11 temuan)*

### Alasan logis

Kode mati bukan sekadar soal kerapian — ia **menyesatkan**. Setiap file yang tidak dipakai adalah jebakan bagi orang yang membaca project ini nanti (termasuk Anda sendiri beberapa bulan kemudian). Dan setiap dependency yang tidak dipakai adalah permukaan serangan tambahan yang harus di-*update* tanpa memberi manfaat.

### Cabut dependency yang tidak dipakai

```bash
# HANYA setelah Solusi #1 & #8 diterapkan (yang justru MULAI memakai bcrypt, jwt, zod)
npm uninstall multer uuid better-sqlite3
```

| Dependency | Keputusan | Alasan |
|---|---|---|
| `bcrypt` | ✅ **Pakai** | Solusi #1 |
| `jsonwebtoken` | ✅ **Pakai** | Solusi #1 |
| `zod` | 🟡 **Opsional** | `validators.js` manual sudah cukup; pakai zod kalau ingin skema deklaratif |
| `multer` | ❌ **Cabut** | Untuk unggah file — belum ada fiturnya (folder `uploads/` kosong) |
| `uuid` | ❌ **Cabut** | Tidak perlu; MySQL `AUTO_INCREMENT` sudah menangani id |
| `better-sqlite3` | ❌ **Cabut** | Hanya untuk `sqliteDB.js` yang sudah dinetralkan (Solusi #7) |

### Bersihkan file mati

```bash
# App.css — sisa template Vite, tidak di-import siapa pun
rm frontend/src/App.css
```

**Untuk `hooks/useApi.js` (S-04):** jangan hapus — **pakai** atau **hapus**, jangan biarkan menggantung. Setelah Solusi #2, `DataContext` sudah menyediakan `loading` dan `error` sendiri, jadi file ini menjadi benar-benar redundan. Rekomendasi: hapus, karena fungsinya sudah pindah ke tempat yang lebih tepat.

### Perbarui `README.md` yang menyesatkan (R-14)

`README.md` saat ini masih mendokumentasikan login dengan **email** (`@sdn05parambahan.id`) — padahal aplikasi sudah lama memakai **username**. Ini dokumentasi yang **aktif menyesatkan**.

```markdown
## Akun Demo

| Username | Password |
|---|---|
| `siti_rahmawati` | `admin` |

⚠️ **WAJIB ganti password setelah login pertama.**

## Aturan Username
- Huruf kecil, angka, dan underscore (`_`) saja
- Minimal 4, maksimal 20 karakter
- Tidak boleh dimulai dengan angka
- Login juga bisa memakai NIP

## Cara Menjalankan

### Mode pengembangan (2 server)
```bash
npm install
npm run dev:all        # backend :3000 + frontend :5173
```

### Mode produksi (1 server)
```bash
npm install
npm run build
npm start              # buka http://localhost:3000
```

### Menyiapkan database
Pilih salah satu:
- **Otomatis:** `node db/initDB.js` (aman, tidak menghapus data)
- **Manual:** import `db/uks_digital.sql` di phpMyAdmin (⚠️ MENGHAPUS semua data)
```

### Perbaiki `.gitignore` (R-15)

Saat ini `.gitignore` berisi `*.md` dengan pengecualian `!README.md`. Artinya **dokumen analisis ini pun tidak akan masuk git.**

```gitignore
# Dokumentasi — izinkan file penting masuk git
*.md
!README.md
!ANALISIS_MENDALAM.md
!Preview, Prompt, and rules.md

# File SQLite (aplikasi memakai MySQL)
db/*.db
db/*.db-shm
db/*.db-wal

# Cadangan database — BERISI DATA KESEHATAN SISWA, JANGAN masuk git
backups/
```

> **Alasan mengecualikan `Preview, Prompt, and rules.md`:** itu adalah spesifikasi asli project. Kalau tidak masuk git, ia bisa hilang — dan bersamanya hilang juga rujukan tentang apa yang seharusnya dibangun.

### Samakan gaya ekspor controller (R-18)

Pilih satu gaya. Rekomendasi: **named export** (seperti `authController`, `siswaController`, `kunjunganController`), karena lebih mudah dilacak editor.

```js
// controllers/pengaturanController.js — ubah dari objek menjadi named export
export async function getPengaturan(req, res, next) { ... }
export async function updatePetugas(req, res, next) { ... }
export async function updateSekolah(req, res, next) { ... }
```

```js
// routes/pengaturanRoutes.js
import { getPengaturan, updatePetugas, updateSekolah } from '../controllers/pengaturanController.js'
router.get('/', requireAuth, getPengaturan)
```

Lakukan hal yang sama untuk `laporanController.js`.

### Samakan pemanggilan `CustomSelect` (R-19)

Pilih **selalu** bentuk `{value, label}`:

```jsx
// frontend/src/pages/PendaftaranKunjungan.jsx
const statusSelectOptions = statusOptions.map((s) => ({ value: s, label: s }))
<CustomSelect options={statusSelectOptions} value={status} onChange={setStatus} />
```

Setelah semua pemanggil memakai bentuk objek, blok normalisasi di `CustomSelect.jsx:19-24` bisa disederhanakan — tapi biarkan saja, ia tidak berbahaya dan berfungsi sebagai jaring pengaman.

### Perbaiki campuran bahasa (R-20)

```jsx
// frontend/src/pages/DataSiswa.jsx
Apakah Anda yakin ingin menghapus data siswa <strong>{deletingSiswa.nama}</strong> ({deletingSiswa.nis})?
Tindakan ini tidak dapat dibatalkan.        {/* ← dari "Action ini" */}
```

Sekaligus tambahkan peringatan riwayat (S-13):

```jsx
const jumlahRiwayat = kunjunganList.filter((k) => k.siswa_id === deletingSiswa.id).length

{jumlahRiwayat > 0 && (
  <p className="text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3 mt-2">
    ⚠️ Siswa ini memiliki <strong>{jumlahRiwayat} riwayat kunjungan UKS</strong>.
    Riwayat tersebut <strong>tetap tersimpan</strong> untuk keperluan laporan,
    tetapi tidak lagi tertaut ke data siswa ini.
  </p>
)}
```

> **Alasan:** petugas berhak tahu konsekuensi sebelum menghapus. Dan kalimat "tetap tersimpan" penting untuk **menenangkan** — mencegah petugas ragu menghapus data yang memang salah input karena khawatir menghilangkan rekam medis.

### Tambahkan halaman 404 yang ramah (S-33)

```jsx
// frontend/src/App.jsx — pindahkan di luar ProtectedRoute
<Route path="*" element={
  <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50">
    <h1 className="text-2xl font-bold text-slate-900">Halaman tidak ditemukan</h1>
    <p className="text-sm text-slate-500">Alamat yang Anda buka tidak tersedia.</p>
    <Link to="/" className="px-5 py-2.5 rounded-lg bg-emerald-600 text-white font-semibold text-sm">
      Kembali ke Dashboard
    </Link>
  </div>
} />
```

---

## Solusi #14 — Perbaikan kecil pada komponen

**Menyelesaikan:** S-01, S-05, S-06, S-08, S-09, S-25, S-26, S-27, S-28, S-29, S-30, T-30, T-31, T-06, T-13 *(15 temuan)*

### Perbaiki susunan Provider (S-01)

```jsx
// frontend/src/App.jsx
<ToastProvider>
  <BrowserRouter>              {/* ← pindah ke LUAR */}
    <AuthProvider>
      <DataProvider>
        <Routes> ... </Routes>
      </DataProvider>
    </AuthProvider>
  </BrowserRouter>
</ToastProvider>
```

Sekarang context bisa memakai `useNavigate()` — sehingga saat token kedaluwarsa, pengguna bisa diarahkan otomatis ke halaman login.

### Tambah timeout pada `fetch` (S-05)

```js
// frontend/src/utils/api.js
export async function fetchApi(endpoint, options = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 15000)   // 15 detik

  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      ...options, headers: getHeaders(options.headers), signal: controller.signal,
      body: options.body && typeof options.body === 'object' ? JSON.stringify(options.body) : options.body
    })

    // ← perbaikan T-31: jangan panggil res.json() secara buta
    const tipe = res.headers.get('content-type') || ''
    if (!tipe.includes('application/json')) {
      throw new Error(
        res.status === 404 ? 'Endpoint tidak ditemukan.'
        : `Server tidak mengembalikan data yang valid (HTTP ${res.status}). Pastikan backend aktif.`
      )
    }

    const data = await res.json()
    if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`)
    return data

  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Server tidak merespons dalam 15 detik. Periksa koneksi & MySQL.')
    }
    throw err
  } finally {
    clearTimeout(timer)
  }
}
```

### Pindahkan efek samping keluar dari updater `setState` (S-06)

```jsx
// frontend/src/context/AuthContext.jsx
const [user, setUser] = useState(() => { /* baca sessionStorage — sudah pakai try/catch ✅ */ })

// Simpan ke sessionStorage lewat useEffect, BUKAN di dalam updater setState
useEffect(() => {
  try {
    if (user) sessionStorage.setItem('uks_user', JSON.stringify(user))
    else sessionStorage.removeItem('uks_user')
  } catch (e) {
    console.warn('Tidak dapat menyimpan sesi:', e.message)
  }
}, [user])

const updateUser = (data) => setUser((prev) => ({ ...prev, ...data }))   // ← murni, tanpa efek samping
```

### Perbaiki `useEffect` di Pengaturan (S-08, S-09, T-30)

```jsx
// frontend/src/pages/Pengaturan.jsx
useEffect(() => {
  let dibatalkan = false

  async function muat() {
    setLoadingData(true)
    try {
      const res = await api.get('/pengaturan')
      if (dibatalkan) return

      if (res?.data?.petugas?.id) {
        setPetugas(res.data.petugas)
        // 🔴 JANGAN panggil updateUser() di sini — itulah sumber T-30
        //    (bisa menimpa sesi dengan identitas orang lain lewat fallback LIMIT 1).
        //    Setelah Solusi #1, fallback sudah hilang — tapi tetap tidak perlu
        //    menimpa sesi hanya karena membuka halaman Pengaturan.
      }
      if (res?.data?.sekolah?.id) setSekolah(res.data.sekolah)

    } catch (err) {
      if (!dibatalkan) {
        // ← perbaikan S-09: beri tahu pengguna, jangan sembunyikan
        toast.error('Gagal memuat data terbaru. Yang tampil adalah data sesi Anda.')
      }
    } finally {
      if (!dibatalkan) setLoadingData(false)
    }
  }

  muat()
  return () => { dibatalkan = true }      // cegah setState setelah unmount
}, [])       // ← sekarang benar-benar tidak memakai `user`/`updateUser`
```

Dan jangan inisialisasi `sekolah` dari mock (S-10):

```jsx
const [sekolah, setSekolah] = useState({
  nama_sekolah: '', npsn: '', telepon_sekolah: '', kepala_sekolah: '', alamat: ''
})
```

> **Alasan:** dengan nilai mock, form tampak sudah terisi data asli. Pengguna bisa menekan Simpan dan **menimpa data database dengan nilai mock**. Dengan form kosong, jelas bahwa data belum termuat.

### Tambah pagination pada `DataTable` (S-25, S-26)

```jsx
// frontend/src/components/common/DataTable.jsx
export default function DataTable({ columns, data, onRowClick, emptyMessage, perPage = 25 }) {
  const [halaman, setHalaman] = useState(1)
  const totalHalaman = Math.max(1, Math.ceil(data.length / perPage))

  useEffect(() => { setHalaman(1) }, [data.length])   // reset saat filter berubah

  const dataHalaman = data.slice((halaman - 1) * perPage, halaman * perPage)

  return (
    <>
      <table>
        <tbody>
          {dataHalaman.map((row) => (
            <tr key={row.id}>          {/* ← perbaikan S-26: hanya id, tanpa fallback idx */}
              ...
            </tr>
          ))}
        </tbody>
      </table>

      {totalHalaman > 1 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-200 text-xs">
          <span className="text-slate-500">
            Menampilkan {(halaman - 1) * perPage + 1}–{Math.min(halaman * perPage, data.length)} dari {data.length}
          </span>
          <div className="flex gap-2">
            <button disabled={halaman === 1} onClick={() => setHalaman(h => h - 1)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-40">Sebelumnya</button>
            <span className="px-3 py-1.5 font-semibold">{halaman} / {totalHalaman}</span>
            <button disabled={halaman === totalHalaman} onClick={() => setHalaman(h => h + 1)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-40">Berikutnya</button>
          </div>
        </div>
      )}
    </>
  )
}
```

**Alasan `key={row.id}` tanpa fallback:** memakai `idx` sebagai cadangan membuat React salah memasangkan baris saat data difilter atau diurutkan — bisa menyebabkan tombol Hapus pada satu baris menghapus baris lain. Semua data dari server pasti punya `id`, jadi fallback tidak diperlukan.

### Tambah pagination di sisi server juga (T-06)

```js
// controllers/kunjunganController.js
export async function getKunjungan(req, res, next) {
  const limit = Math.min(Number(req.query.limit) || 500, 2000)
  const offset = Number(req.query.offset) || 0

  try {
    const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM kunjungan')
    const [rows] = await pool.query(
      'SELECT * FROM kunjungan ORDER BY waktu_masuk DESC LIMIT ? OFFSET ?',
      [limit, offset]
    )
    res.json({
      success: true,
      data: rows.map((r) => ({ ...r, is_darurat: Boolean(r.is_darurat) })),
      meta: { total, limit, offset }
    })
  } catch (err) { next(err) }
}
```

> **Catatan urutan:** perhatikan `ORDER BY waktu_masuk DESC`, bukan `id DESC`. Ini lebih tepat secara semantik — yang dimaksud "terbaru" adalah waktu kunjungan, bukan urutan penyimpanan. Keduanya biasanya sama, tapi tidak selalu (misalnya kalau petugas mencatat kunjungan pagi pada sore hari).

### Perbaiki `updateSekolah` agar tidak gagal diam-diam (T-13)

```js
// controllers/pengaturanController.js
export async function updateSekolah(req, res, next) {
  const { nama_sekolah, npsn, telepon_sekolah, kepala_sekolah, alamat } = req.body
  if (!String(nama_sekolah || '').trim()) {
    return res.status(400).json({ success: false, message: 'Nama sekolah wajib diisi.' })
  }

  try {
    // INSERT ... ON DUPLICATE KEY UPDATE: bekerja baik untuk baris baru maupun yang sudah ada
    await pool.query(
      `INSERT INTO pengaturan_sekolah (id, nama_sekolah, npsn, telepon_sekolah, kepala_sekolah, alamat)
       VALUES (1, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         nama_sekolah = VALUES(nama_sekolah), npsn = VALUES(npsn),
         telepon_sekolah = VALUES(telepon_sekolah), kepala_sekolah = VALUES(kepala_sekolah),
         alamat = VALUES(alamat)`,
      [nama_sekolah, npsn || '', telepon_sekolah || '', kepala_sekolah || '', alamat || '']
    )
    const [rows] = await pool.query('SELECT * FROM pengaturan_sekolah WHERE id = 1')
    res.json({ success: true, message: 'Data sekolah berhasil diperbarui!', data: rows[0] })
  } catch (err) { next(err) }
}
```

**Alasan:** kalau baris id=1 pernah terhapus, `UPDATE` yang lama akan "berhasil" tanpa menyimpan apa pun. Dengan `INSERT ... ON DUPLICATE KEY UPDATE`, baris akan dibuat kalau belum ada. Penyimpanan **selalu** berhasil atau **selalu** melaporkan error — tidak ada jalan tengah yang membingungkan.

### Perbaikan aksesibilitas & UX komponen (S-27, S-28, S-29, S-30, S-16)

```jsx
// SearchAutocomplete.jsx — tambah debounce (S-27)
const [debounced, setDebounced] = useState('')
useEffect(() => {
  const t = setTimeout(() => setDebounced(query), 200)
  return () => clearTimeout(t)
}, [query])

const filtered = debounced.length >= 1 ? items.filter((item) => {
  const q = debounced.toLowerCase()
  return item[displayKey]?.toLowerCase().includes(q) ||
         String(item[subtitleKey] || '').toLowerCase().includes(q)   // ← perbaikan S-16
}).slice(0, 10) : []
```

```jsx
// CustomSelect.jsx — tambah Escape & ARIA (S-30)
useEffect(() => {
  const onKey = (e) => { if (e.key === 'Escape') setIsOpen(false) }
  if (isOpen) document.addEventListener('keydown', onKey)
  return () => document.removeEventListener('keydown', onKey)
}, [isOpen])

<button aria-haspopup="listbox" aria-expanded={isOpen} ...>
<div role="listbox" ...>
  <button role="option" aria-selected={isSelected} ...>
```

```jsx
// Modal.jsx — tutup dengan Escape + focus trap sederhana (S-29)
useEffect(() => {
  if (!isOpen) return
  const onKey = (e) => { if (e.key === 'Escape') onClose() }
  document.addEventListener('keydown', onKey)
  document.body.style.overflow = 'hidden'          // cegah scroll latar
  return () => {
    document.removeEventListener('keydown', onKey)
    document.body.style.overflow = ''
  }
}, [isOpen, onClose])
```

```jsx
// DatePicker.jsx — perbaiki penandaan hari terpilih (S-28)
const nilaiTerpilih = value ? new Date(value) : null
const isSelected =
  nilaiTerpilih &&
  dayNum === nilaiTerpilih.getDate() &&
  viewMonth === nilaiTerpilih.getMonth() &&        // ← bandingkan dengan nilai terpilih,
  viewYear === nilaiTerpilih.getFullYear()         //    bukan dengan currentDate yang dihitung ulang
```

```jsx
// TagSelector.jsx — batasi jumlah pilihan (S-24)
export default function TagSelector({ options, selected, onChange, multiple = true, maksPilihan = 8 }) {
  const toggle = (opt) => {
    if (selected.includes(opt)) {
      onChange(selected.filter((s) => s !== opt))
    } else {
      if (multiple && selected.length >= maksPilihan) return      // cegah melebihi VARCHAR(255)
      onChange(multiple ? [...selected, opt] : [opt])
    }
  }
  ...
  {selected.length >= maksPilihan && (
    <p className="text-[11px] text-amber-600 font-semibold">
      Maksimal {maksPilihan} pilihan. Gunakan kolom Keterangan untuk detail tambahan.
    </p>
  )}
```

---

# BAGIAN 10 — ROADMAP BERTAHAP

## 10.1 Prinsip penyusunan urutan

Urutan di bawah ini tidak disusun berdasarkan "mana yang paling mudah", tapi berdasarkan tiga pertimbangan:

1. **Apa yang mencegah kerugian permanen?** Data yang hilang atau bocor tidak bisa ditarik kembali. Ini selalu didahulukan.
2. **Apa yang menghalangi pekerjaan lain?** Memasang autentikasi setelah semua fitur jadi berarti menyentuh ulang setiap file. Lebih murah dikerjakan lebih awal.
3. **Apa yang memberi hasil terlihat paling cepat?** Untuk menjaga momentum, sisipkan perbaikan yang hasilnya langsung terlihat.

## 10.2 TAHAP 0 — Hentikan pendarahan (1–2 jam)

**Kerjakan ini SEBELUM aplikasi menyentuh data siswa yang sungguhan.**

| # | Tindakan | Solusi | Waktu |
|---|---|---|---|
| 1 | Buat cadangan database dulu (kalau sudah ada data) | #12 | 10 mnt |
| 2 | Hentikan server jika DB gagal (`process.exit(1)`) | #2 | 5 mnt |
| 3 | Hapus semua `catch` kosong di `DataContext` | #2 | 30 mnt |
| 4 | Tampilkan `toast.error` di semua halaman pemanggil | #2 | 30 mnt |
| 5 | Tambah `disabled={saving}` pada tombol simpan | #2 | 10 mnt |

**Mengapa ini nomor nol:** selama `catch` kosong masih ada, **setiap menit pemakaian berisiko kehilangan data tanpa jejak**. Ini satu-satunya kelompok perbaikan yang harus dikerjakan sebelum apa pun yang lain — termasuk sebelum keamanan.

**Cara memverifikasi berhasil:**
```bash
# Matikan MySQL, lalu coba simpan kunjungan dari aplikasi.
# ✅ BENAR : muncul notifikasi merah "Gagal menyimpan..."
# ❌ SALAH : muncul notifikasi hijau "berhasil disimpan"
```

## 10.3 TAHAP 1 — Keamanan (4–6 jam)

| # | Tindakan | Solusi | Waktu |
|---|---|---|---|
| 1 | Buat `middleware.js` (`requireAuth`, `requireRole`, `errorHandler`) | #1 | 45 mnt |
| 2 | Ganti perbandingan password dengan `bcrypt.compare` | #1 | 30 mnt |
| 3 | Terbitkan JWT saat login, simpan di `sessionStorage` | #1 | 45 mnt |
| 4 | Kirim `Authorization: Bearer` dari `api.js` | #1 | 15 mnt |
| 5 | Pasang `requireAuth` di **semua** route | #1 | 30 mnt |
| 6 | Ganti `X-User-Id` → `req.user.id`; **hapus fallback `LIMIT 1`** | #1 | 30 mnt |
| 7 | Jalankan `node db/rehashPasswords.js` | #1 | 10 mnt |
| 8 | Batasi CORS + rate limit login | #1 | 20 mnt |
| 9 | Bersihkan `localStorage` saat logout | #1 | 10 mnt |
| 10 | Pasang `errorHandler` di baris terakhir `app.js` | #8 | 15 mnt |

**Cara memverifikasi berhasil:**
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

Lalu cek di phpMyAdmin: kolom `password` harus berisi teks diawali `$2b$10$`, **bukan** `admin`.

## 10.4 TAHAP 2 — Hidupkan fitur yang rusak (3–4 jam)

Setelah dua tahap berat, ini tahap yang **hasilnya langsung terlihat** — bagus untuk momentum.

| # | Tindakan | Solusi | Waktu |
|---|---|---|---|
| 1 | Ganti impor `mockData` → `useData()` di Laporan | #3 | **5 mnt** ⭐ |
| 2 | Buat `frontend/src/utils/statistik.js` | #5 | 60 mnt |
| 3 | Sambungkan filter bulan/tahun agar benar-benar memfilter | #3 | 30 mnt |
| 4 | Samakan perhitungan keluhan Dashboard ↔ Laporan | #5 | 20 mnt |
| 5 | Tambah blok `@theme` di `index.css` | #4 | 15 mnt |
| 6 | Ubah `PageHeader` ke tema terang | #4 | 10 mnt |
| 7 | Tambah varian `success` di `StatCard` | #4 | 5 mnt |
| 8 | Tambah sapaan + 3 kartu Dashboard sesuai spesifikasi | #5 | 45 mnt |
| 9 | Perbaiki typo "Prambahan" + tautan Register | #9 | 10 mnt |

**Langkah #1 adalah perbaikan dengan hasil terbesar per menit di seluruh dokumen ini.** Lima menit kerja menghidupkan seluruh halaman Laporan.

**Cara memverifikasi berhasil:**
- Catat 3 kunjungan → buka Laporan → **angka & grafik muncul** (sebelumnya selalu 0)
- Ubah filter bulan → **angkanya ikut berubah**
- Judul halaman Pendaftaran/Riwayat/Siswa/Laporan/Pengaturan **terlihat**
- Picu error (matikan MySQL) → **toast merah punya latar warna dan terbaca**
- Bandingkan "Keluhan Terbanyak" di Dashboard vs Laporan → **angkanya sama**

## 10.5 TAHAP 3 — Integritas data (3–4 jam)

| # | Tindakan | Solusi | Waktu |
|---|---|---|---|
| 1 | Periksa isi `db/uks_digital.db` sebelum menghapus | #7 | 15 mnt |
| 2 | Netralkan `sqliteDB.js` dengan penanda `throw` | #7 | 10 mnt |
| 3 | Hapus file `.db`/`-shm`/`-wal`, cabut `better-sqlite3` | #7 | 10 mnt |
| 4 | Tambah peringatan `DROP TABLE` di `uks_digital.sql` | #7 | 10 mnt |
| 5 | Tambah FOREIGN KEY `ON DELETE SET NULL` | #7 | 30 mnt |
| 6 | Tambah kolom `petugas_id` + catat saat menyimpan | #7 | 30 mnt |
| 7 | Buat `controllers/validators.js` | #8 | 60 mnt |
| 8 | Pakai validator di semua controller | #8 | 45 mnt |
| 9 | Tutup jalur "terkunci dari akun" di Pengaturan | #8 | 20 mnt |
| 10 | Perbaiki `initDB.js` host yang di-*hardcode* | #10 | 5 mnt |

**Cara memverifikasi berhasil:**
```bash
# Validasi bekerja
curl -X POST http://localhost:3000/api/siswa -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" -d '{"nis":"","nama":"A"}'
# ✅ BENAR : "NIS wajib diisi. Nama terlalu pendek (minimal 3 karakter)."
# ❌ SALAH : error SQL mentah

# FOREIGN KEY bekerja
# Hapus seorang siswa yang punya riwayat → riwayatnya HARUS tetap ada di Riwayat Kunjungan
```

Coba juga simpan username `ab` di Pengaturan → **harus ditolak** dengan pesan jelas.

## 10.6 TAHAP 4 — Lengkapi fitur (4–5 jam)

| # | Tindakan | Solusi | Waktu |
|---|---|---|---|
| 1 | Tambah `PUT /api/kunjungan/:id` + `updateKunjungan` | #6 | 45 mnt |
| 2 | Tambah tombol cepat "Selesai" di Riwayat | #6 | 30 mnt |
| 3 | Tambah modal Edit kunjungan | #6 | 60 mnt |
| 4 | Lengkapi `laporanController` dengan agregasi SQL | #6 | 45 mnt |
| 5 | Tambah filter tanggal di Riwayat | #9 | 45 mnt |
| 6 | Buat label periode laporan dinamis | #9 | 20 mnt |
| 7 | Ambil kop surat & kepala sekolah dari DB | #3 | 30 mnt |

**Cara memverifikasi berhasil:**
- Catat kunjungan status "Istirahat di UKS" → Dashboard menunjukkan **1 siswa sedang di UKS**
- Klik tombol "Selesai" → angka berubah jadi **0**, dan `waktu_keluar` terisi di database
- Ubah nama kepala sekolah di Pengaturan → **cetak laporan → nama baru muncul**

## 10.7 TAHAP 5 — Ekspor & produksi (3–4 jam)

| # | Tindakan | Solusi | Waktu |
|---|---|---|---|
| 1 | Perbaiki CSV: escape kutip, BOM, Blob, pemisah `;` | #11 | 45 mnt |
| 2 | Ganti CSS cetak ke `display:none` + `page-break` | #11 | 30 mnt |
| 3 | Batasi baris PDF (maks 500) | #11 | 15 mnt |
| 4 | Sajikan `frontend/dist` dari Express | #12 | 30 mnt |
| 5 | Tambah script `build` & `start` | #12 | 15 mnt |
| 6 | Buat pengguna MySQL terbatas + isi `.env` produksi | #10 | 30 mnt |
| 7 | Buat `db/backup.js` + jadwalkan mingguan | #12 | 30 mnt |
| 8 | Hapus `runtimeCaching` PWA; ganti ke `registerType: 'prompt'` | #10 | 15 mnt |

**Cara memverifikasi berhasil:**
```bash
npm run build && npm start
# Buka http://localhost:3000 → aplikasi jalan LENGKAP tanpa port 5173
```
- Ekspor CSV → buka di Excel → kolom rapi, `°C` tampil benar
- Cetak PDF → **tidak ada halaman kosong**, header tabel berulang di setiap halaman

## 10.8 TAHAP 6 — Perapian (3–5 jam, bisa dicicil)

| # | Tindakan | Solusi |
|---|---|---|
| 1 | Samakan tema semua halaman & komponen ke terang | #4 |
| 2 | Tambah pagination `DataTable` + server-side `LIMIT` | #14 |
| 3 | Tambah timeout & pemeriksaan content-type di `api.js` | #14 |
| 4 | Perbaiki susunan Provider (`BrowserRouter` di luar) | #14 |
| 5 | Perbaiki `useEffect` Pengaturan & `AuthContext` | #14 |
| 6 | Perbaikan aksesibilitas (Escape, ARIA, focus) | #14 |
| 7 | Cabut `multer`, `uuid`; hapus `App.css`, `useApi.js` | #13 |
| 8 | Perbarui `README.md` & `.gitignore` | #13 |
| 9 | Samakan gaya ekspor controller & pemanggilan `CustomSelect` | #13 |
| 10 | Perbaiki campuran bahasa + peringatan hapus siswa | #13 |
| 11 | Tambah halaman 404 yang ramah | #13 |

## 10.9 Ringkasan waktu & hasil

| Tahap | Fokus | Waktu | Temuan selesai | Kondisi setelahnya |
|---|---|---|---|---|
| **0** | Hentikan kehilangan data | 1–2 j | 6 | Data tidak lagi hilang diam-diam |
| **1** | Keamanan | 4–6 j | 12 | **Layak dipakai dengan data asli** |
| **2** | Fitur rusak | 3–4 j | 16 | Semua halaman berfungsi & terlihat |
| **3** | Integritas data | 3–4 j | 19 | Data tidak bisa rusak/ngawur |
| **4** | Kelengkapan fitur | 4–5 j | 12 | **Sesuai spesifikasi** |
| **5** | Ekspor & produksi | 3–4 j | 14 | **Siap dipasang di sekolah** |
| **6** | Perapian | 3–5 j | 30 | Rapi & mudah dirawat |
| | **TOTAL** | **21–30 jam** | **109** | |

### Tonggak penting

```
Setelah TAHAP 1  →  ✅ AMAN. Boleh dipakai dengan data siswa sungguhan.
Setelah TAHAP 2  →  ✅ BERFUNGSI. Semua halaman menampilkan data benar.
Setelah TAHAP 4  →  ✅ SESUAI SPESIFIKASI. Siap dipresentasikan/dinilai.
Setelah TAHAP 5  →  ✅ SIAP PRODUKSI. Bisa dipasang di komputer UKS.
```

## 10.10 Kalau waktu Anda sangat terbatas

**Punya 1 jam?** Kerjakan Tahap 0 saja (hapus `catch` kosong). Ini mencegah kehilangan data — hal yang tidak bisa diperbaiki setelah terjadi.

**Punya 1 hari (8 jam)?** Tahap 0 + Tahap 1 + langkah #1 Tahap 2. Hasilnya: aplikasi aman dipakai, dan halaman Laporan hidup.

**Punya 1 minggu?** Tahap 0 sampai 4. Aplikasi sesuai spesifikasi dan siap dinilai.

**Kalau hanya boleh memilih 5 perbaikan:**

| Prioritas | Perbaikan | Waktu | Alasan |
|---|---|---|---|
| 1 | Hapus `catch` kosong di `DataContext` | 30 mnt | Mencegah kehilangan data permanen |
| 2 | `requireAuth` di semua route | 90 mnt | Mencegah kebocoran data kesehatan anak |
| 3 | `bcrypt` untuk password | 30 mnt | Melindungi akun bahkan jika DB bocor |
| 4 | `useData()` di `LaporanAnalitik` | **5 mnt** | Menghidupkan seluruh halaman Laporan |
| 5 | Blok `@theme` + `PageHeader` terang | 25 mnt | Judul 5 halaman terlihat, toast error terbaca |

**Total: ~3 jam** untuk menyelesaikan lima masalah terpenting.

---

# PENUTUP

## Penilaian akhir yang jujur

**Project ini lebih baik daripada yang disiratkan oleh 109 temuan di atas.**

Alasannya: sebagian besar temuan bukan kesalahan konsep, melainkan **pekerjaan yang berhenti sebelum selesai**. Perbedaan itu penting. Kesalahan konsep butuh pembongkaran; pekerjaan yang belum selesai hanya butuh diselesaikan.

Bukti bahwa fondasinya benar:

| Keputusan | Mengapa ini menunjukkan pemahaman yang baik |
|---|---|
| Denormalisasi `siswa_nama`/`kelas` di `kunjungan` | Melindungi kebenaran laporan historis saat siswa naik kelas — dan menjadi kunci yang memungkinkan `ON DELETE SET NULL` bekerja aman |
| `siswa_id` boleh `NULL` | Kunjungan darurat bisa dicatat tanpa menunggu pendaftaran siswa |
| Empat indeks (`nama`, `kelas`, `waktu_masuk`, `status`) | Semuanya tepat sasaran pada pola pencarian nyata aplikasi |
| `ENUM status` cocok persis dengan `statusOptions` frontend | Frontend & database sepakat — konsistensi yang sering gagal |
| `DEFAULT 'Istirahat di UKS'` | Default yang aman secara medis |
| Pesan login anti-enumerasi disamakan | Praktik keamanan yang sering dilupakan pemula |
| `utf8mb4` di semua tabel | Aman untuk emoji & karakter khusus |
| Prepared statement (`?`) konsisten di **semua** query | Nol celah SQL Injection di seluruh backend |
| `sessionStorage` untuk sesi, bukan `localStorage` | Pilihan tepat untuk komputer bersama |
| `Boolean(r.is_darurat)` eksplisit | Detail kecil yang mencegah bug sulit dilacak |
| Penanganan zona waktu benar di `PendaftaranKunjungan` | Pengembang **paham** masalah ini — hanya belum diterapkan di Dashboard |
| Pemisahan `server.js` / `app.js` | Memudahkan pengujian otomatis nanti |
| 404 handler membedakan API dan non-API | Pemikiran yang matang |

**Dan yang paling menjanjikan: semua alat untuk memperbaiki sudah tersedia di project ini.** `bcrypt`, `jsonwebtoken`, `JWT_SECRET`, kolom `password VARCHAR(255)` seukuran hash, `getGreeting()`, kolom `waktu_keluar`, `useApi.js`, endpoint `/api/laporan`, dan font yang sudah dimuat — semuanya **sudah ada, hanya belum tersambung**.

## Tiga hal yang paling penting untuk diingat

**1. Jangan pakai dengan data siswa sungguhan sebelum Tahap 1 selesai.**
Bukan karena aplikasinya buruk, tapi karena data kesehatan anak di bawah umur beserta kontak wali adalah data pribadi spesifik. Tanggung jawab hukum dan etisnya nyata. Tahap 0 dan 1 butuh sekitar 6 jam — investasi yang sangat kecil dibanding risikonya.

**2. Perbaiki akar, bukan gejalanya.**
109 temuan itu berasal dari **6 akar masalah**. Memperbaiki 6 akar menyelesaikan sekitar 50 temuan secara otomatis. Inilah sebabnya urutan di Bagian 10 penting — mengerjakannya secara acak akan terasa jauh lebih berat daripada yang sebenarnya.

**3. Perbaikan terbesar hanya butuh 5 menit.**
Mengganti satu baris impor di `LaporanAnalitik.jsx:31` menghidupkan seluruh halaman laporan — tujuan akhir dari seluruh aplikasi ini. Kalau Anda ingin merasakan kemajuan lebih dulu sebelum mengerjakan yang berat, mulailah dari situ.

## Catatan teknis tentang dokumen ini

⚠️ **File ini tidak akan masuk ke git.** `.gitignore` berisi:

```gitignore
*.md
!README.md
```

Artinya `ANALISIS_MENDALAM.md` diabaikan git. Kalau Anda ingin menyimpannya dalam riwayat versi, tambahkan `!ANALISIS_MENDALAM.md` ke `.gitignore` seperti pada [Solusi #13](#solusi-13--bersihkan-kode-mati--dependency-tak-terpakai).

✅ **Struktur folder tidak diubah.** Sesuai aturan di `Preview, Prompt, and rules.md`, semua solusi hanya menambah file di dalam folder yang sudah ada:

| File baru | Folder | Status folder |
|---|---|---|
| `middleware.js` | root (sejajar `app.js`) | sudah ada |
| `controllers/validators.js` | `controllers/` | sudah ada |
| `frontend/src/utils/statistik.js` | `frontend/src/utils/` | sudah ada |
| `db/rehashPasswords.js` | `db/` | sudah ada |
| `db/backup.js` | `db/` | sudah ada |

## Cara memverifikasi klaim di dokumen ini

Setiap temuan menyebut file dan nomor baris agar Anda bisa memeriksanya sendiri. Beberapa verifikasi cepat:

```bash
# Bukti tidak ada middleware auth (harus nol hasil)
grep -rn "requireAuth\|authMiddleware\|verifyToken" routes/ controllers/ app.js

# Bukti sqliteDB.js kode mati (hanya muncul di file itu sendiri + package.json)
grep -rn "sqliteDB\|better-sqlite3" --include="*.js" --exclude-dir=node_modules .

# Bukti 5 dependency tak terpakai (hanya muncul di package.json)
grep -rn "bcrypt\|jsonwebtoken\|multer\|uuid\|zod" --include="*.js" --exclude-dir=node_modules .

# Bukti Laporan memakai mockData
grep -n "mockData" frontend/src/pages/LaporanAnalitik.jsx

# Bukti waktu_keluar tak pernah dipakai di luar skema
grep -rn "waktu_keluar" --include="*.js" --exclude-dir=node_modules .

# Bukti localStorage ditulis tapi tak dibaca
grep -n "localStorage" frontend/src/context/DataContext.jsx
```

---

<div align="center">

**ANALISIS MENDALAM — UKS DIGITAL SDN 05 PARAMBAHAN**

Disusun setelah membaca seluruh 45+ file sumber (backend + frontend, di luar `node_modules`)
dan memverifikasi setiap klaim dengan pencarian langsung ke dalam kode.

**109 temuan** · **6 akar masalah** · **14 solusi** · **7 tahap pengerjaan**

*4 Agustus 2026*

</div>

