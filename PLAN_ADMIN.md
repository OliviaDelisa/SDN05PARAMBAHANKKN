# Rencana Eksekusi — Fitur Admin UKS Digital

**Tanggal:** 4 Agustus 2026
**Status:** ✅ **SELESAI DIEKSEKUSI** — 6 Agustus 2026
**Disinkronkan dengan:** perubahan Tahap 0, 1, dan 3 yang sudah selesai di sesi ini (lihat `PLAN_PERBAIKAN.md`)

---

## Status akhir eksekusi

| Tahap | Status | Catatan |
|---|:---:|---|
| **A** — Rapikan peran | ✅ | ENUM `('Admin','Dokter Kecil UKS')`, `db/seedAdmin.js` |
| **B.1** — Ubah/hapus siswa | ✅ | `requireRole('Admin')` di `routes/siswaRoutes.js` |
| **B.2** — Pengaturan sekolah | ✅ | `requireRole('Admin')` pada `PUT /sekolah` |
| **B.3** — API manajemen akun | ✅ | `routes/adminRoutes.js` + `/api/admin` di `app.js` |
| **B.4** — Tutup pendaftaran publik | ✅ | Route, controller, dan `Register.jsx` dihapus |
| **B.5** — Verifikasi endpoint | ✅ | 23/23 uji lulus |
| **C** — Halaman admin | ✅ | 4 halaman baru + `AdminRoute` + menu peran |
| **D** — Jejak audit | ✅ | `petugas_id` + FK `ON DELETE SET NULL` |

**Dua penyimpangan dari rencana awal, keduanya disengaja:**

1. **Dua peran, bukan tiga.** Rencana menyebut `Admin` / `Petugas UKS` / `Dokter Kecil UKS`.
   Skema yang berlaku hanya mengenal **`Admin`** dan **`Dokter Kecil UKS`** — keputusan yang
   diambil pada commit `13e9fd6`, lebih baru dari dokumen ini. Matriks hak akses di bawah
   masih menampilkan kolom "Petugas UKS"; baca kolom itu sebagai "Dokter Kecil UKS".

2. **`DataSiswa.jsx` memakai prop `mode`,** bukan dua berkas terpisah. Tabel, pencarian,
   dan filter kelasnya identik — memisahkannya berarti setiap perubahan kolom dikerjakan
   dua kali. `AdminDataSiswa.jsx` hanya pembungkus `<DataSiswa mode="admin" />`.

**Cara memakai:** jalankan `npm run seed:admin` untuk membuat akun admin pertama
(password dari `SEED_ADMIN_PASSWORD` di `.env`), lalu login dan buka **Panel Admin**.

Temuan yang tertutup: **K-05**, **K-08**, **T-11**, **R-21**.

---

## Context — Mengapa fitur ini perlu

Saat ini semua petugas yang bisa login punya hak yang sama persis. Seorang "Dokter Kecil UKS" — yang di sekolah dasar adalah **siswa** — bisa mengubah identitas sekolah yang tercetak di laporan resmi, dan bisa menghapus data siswa mana pun. Ini temuan K-08 di `ANALISIS_MENDALAM.md` yang belum tertutup.

Fitur admin memisahkan **pekerjaan harian** (mencatat siswa sakit) dari **pengelolaan sistem** (data induk siswa, identitas sekolah, akun pengguna). Dengan begitu:

- Petugas UKS fokus pada alur kerjanya tanpa risiko mengubah hal yang seharusnya stabil.
- Identitas sekolah di laporan resmi hanya bisa diubah oleh orang yang berwenang.
- Akun pengguna punya pemilik yang jelas — bukan siapa pun yang membuka halaman pendaftaran.

### Fondasi yang sudah siap dari sesi ini

Rencana ini **tidak dimulai dari nol**. Tiga hal yang dikerjakan di Tahap 1 justru dirancang untuk momen ini:

| Sudah ada | Berkasnya | Statusnya sekarang |
|---|---|---|
| `requireRole(...roles)` | `middleware.js:62` | **Sudah ditulis, belum dipakai sama sekali** — ini pintu masuk fitur admin |
| Identitas dari token | `middleware.js:31` (`req.user`) | Sudah dipakai; berisi `{ id, username, role }` |
| `validateUsername` terpusat | `controllers/validators.js` | Siap dipakai ulang untuk manajemen akun |
| Hash bcrypt | `controllers/authController.js` | Siap dipakai ulang saat admin membuat akun |
| Cek `affectedRows` | 3 controller | Pola sudah konsisten, ikuti untuk endpoint baru |

Artinya pekerjaan utamanya adalah **menyambungkan** `requireRole` ke route dan membangun UI-nya — bukan membangun sistem izin dari awal.

---

## Keputusan yang sudah ditetapkan

| Pertanyaan | Keputusan |
|---|---|
| Hak petugas biasa setelah pemindahan | Tetap bisa **lihat & tambah** siswa (dibutuhkan saat mencatat kunjungan). Ubah/hapus siswa, pengaturan sekolah, dan manajemen akun jadi hak admin. |
| Akun admin | **Buat akun admin baru** lewat script seed. Akun `siti_rahmawati` tetap petugas. |
| Manajemen akun | Masuk ke halaman admin. |

Alasan petugas tetap boleh menambah siswa: kalau tidak, saat ada siswa sakit yang belum terdaftar, petugas harus menghubungi admin dulu sebelum bisa mencatat. Di ruang UKS itu tidak praktis.

---

## Matriks hak akses

Ini acuan tunggal untuk seluruh implementasi. Setiap endpoint dan setiap menu harus cocok dengan tabel ini.

| Aksi | Admin | Petugas UKS | Dokter Kecil UKS |
|---|:---:|:---:|:---:|
| Dashboard | ✓ | ✓ | ✓ |
| Pendaftaran kunjungan | ✓ | ✓ | ✓ |
| Riwayat kunjungan | ✓ | ✓ | ✓ |
| Ubah / tutup kunjungan | ✓ | ✓ | ✓ |
| **Lihat** data siswa | ✓ | ✓ | ✓ |
| **Tambah** siswa | ✓ | ✓ | ✓ |
| **Ubah** siswa | ✓ | ✗ | ✗ |
| **Hapus** siswa | ✓ | ✗ | ✗ |
| Pengaturan sekolah | ✓ | ✗ | ✗ |
| Manajemen akun | ✓ | ✗ | ✗ |
| Ubah profil sendiri | ✓ | ✓ | ✓ |

---

## TAHAP A — Rapikan peran (1–2 jam)

Fondasi. Tanpa ini, `requireRole` tidak punya nilai yang bisa dipercaya.

### A.1 Tetapkan nilai peran yang terbatas

**Berkas:** `db/initDB.js` · `db/uks_digital.sql`

Kolom `role` sekarang `VARCHAR(50)` bebas, dan database berisi **tiga nilai berbeda** yang tumbuh tanpa aturan:

```
'Petugas UKS Utama'   ← akun id 1
'Dokter Kecil UKS'    ← akun id 2, 3, 4
'Petugas UKS'         ← default di skema
```

Normalkan menjadi tiga nilai resmi:

```sql
role ENUM('Admin', 'Petugas UKS', 'Dokter Kecil UKS') NOT NULL DEFAULT 'Petugas UKS'
```

Migrasi idempoten di `initDB.js` (pola sama dengan blok FOREIGN KEY yang sudah ada):
1. Petakan `'Petugas UKS Utama'` → `'Petugas UKS'`
2. Nilai lain yang tak dikenal → `'Petugas UKS'`
3. Baru `ALTER TABLE ... MODIFY COLUMN role ENUM(...)`

Urutannya penting: `ALTER` ke ENUM akan gagal kalau masih ada nilai di luar daftar.

### A.2 Buat akun admin lewat script seed

**Berkas baru:** `db/seedAdmin.js`

Ikuti pola `db/rehashPasswords.js` yang sudah ada — script sekali jalan, aman diulang:

```
node db/seedAdmin.js
```

Isinya: buat akun `role = 'Admin'` dengan password dari `process.env.SEED_ADMIN_PASSWORD` (variabel ini **sudah ada** di `.env.example`), di-hash bcrypt. Kalau akun admin sudah ada, lewati dan beri tahu.

Script harus mencetak peringatan agar password default segera diganti.

### A.3 Sertakan peran di token

**Berkas:** `middleware.js:24` — **sudah benar, tidak perlu diubah.**

`generateToken` sudah menyertakan `role`. Ini yang membuat `requireRole` bisa bekerja tanpa query tambahan ke database di setiap permintaan.

> ⚠️ **Catatan penting:** peran ikut di dalam token. Kalau admin mengubah peran seseorang, perubahan itu **baru berlaku setelah orang tersebut login ulang** (token lama masih membawa peran lama, berlaku 8 jam). Ini perlu ditulis di UI manajemen akun supaya tidak membingungkan.

---

## TAHAP B — Tutup endpoint dengan `requireRole` (2–3 jam)

Keamanan dipasang **sebelum** UI dibuat. Kalau dibalik, UI-nya sudah jadi tapi datanya masih bisa diubah lewat `curl`.

### B.1 Batasi ubah/hapus siswa

**Berkas:** `routes/siswaRoutes.js`

Sekarang seluruh berkas dijaga `router.use(requireAuth)`. Tambahkan lapisan peran hanya pada dua route:

```js
router.get('/', getSiswa)                                  // semua yang login
router.post('/', createSiswa)                              // semua yang login
router.put('/:id', requireRole('Admin'), updateSiswa)      // admin saja
router.delete('/:id', requireRole('Admin'), deleteSiswa)   // admin saja
```

### B.2 Batasi pengaturan sekolah

**Berkas:** `routes/pengaturanRoutes.js`

```js
router.get('/', pengaturanController.get)                                          // profil sendiri + data sekolah
router.put('/petugas', pengaturanController.updatePetugas)                         // profil sendiri
router.put('/sekolah', requireRole('Admin'), pengaturanController.updateSekolah)   // admin saja
```

`GET` tetap terbuka untuk semua yang login karena kop surat sekolah dibutuhkan saat mencetak laporan dari halaman Riwayat.

### B.3 Endpoint manajemen akun

**Berkas baru:** `controllers/adminController.js` · `routes/adminRoutes.js`
**Berkas diubah:** `app.js` (daftarkan `/api/admin`)

| Endpoint | Fungsi |
|---|---|
| `GET /api/admin/users` | Daftar akun (**tanpa kolom password**) |
| `POST /api/admin/users` | Buat akun + tentukan perannya |
| `PUT /api/admin/users/:id` | Ubah nama, username, NIP, telepon, peran |
| `PUT /api/admin/users/:id/password` | Reset password akun |
| `DELETE /api/admin/users/:id` | Hapus akun |

Seluruh berkas dijaga `router.use(requireAuth, requireRole('Admin'))`.

**Empat pengaman yang wajib ada** — masing-masing menutup jalan menuju sistem yang tidak bisa dipulihkan:

1. **Admin tidak boleh menghapus akunnya sendiri.** Bandingkan `req.user.id` dengan `:id`.
2. **Admin terakhir tidak boleh dihapus atau diturunkan perannya.** Hitung dulu jumlah admin; kalau tinggal satu, tolak. Tanpa ini, sistem bisa terkunci tanpa admin sama sekali.
3. **Validasi username & cek duplikat** — pakai `validateUsername` dari `controllers/validators.js`, jangan tulis ulang. Ini pelajaran dari temuan #19: aturan yang diduplikasi akan menyimpang.
4. **Password baru di-hash bcrypt** dan **tidak pernah dikembalikan** dalam respons.

Tambahkan skema `userSchema` di `controllers/validators.js` supaya validasinya sekelas dengan `siswaSchema` dan `kunjunganSchema` yang sudah ada.

### B.4 Tutup pendaftaran publik

**Berkas:** `routes/authRoutes.js`

Ini menutup temuan **K-05** yang masih terbuka: `POST /api/auth/register` sekarang bisa dipakai siapa saja untuk membuat akun dan langsung mendapat akses ke data kesehatan siswa.

Setelah admin bisa membuat akun, pendaftaran publik tidak lagi dibutuhkan. Dua pilihan:

- **Disarankan:** hapus route `register`, dan hapus juga halaman `Register.jsx` beserta tautannya.
- **Alternatif:** pertahankan tapi akun baru masuk sebagai belum aktif, dan harus disetujui admin. Ini butuh kolom `is_aktif` dan pemeriksaan tambahan saat login — lebih banyak pekerjaan.

Apa pun pilihannya, `frontend/src/context/AuthContext.jsx` punya fungsi `register` yang perlu ikut disesuaikan.

### B.5 Verifikasi sebelum lanjut ke UI

```bash
# Login sebagai petugas biasa, simpan tokennya
TOKEN_PETUGAS=<token dari siti_rahmawati>

curl -X DELETE http://localhost:3000/api/siswa/1 -H "Authorization: Bearer $TOKEN_PETUGAS"
# ✅ BENAR : 403 "Anda tidak memiliki hak akses untuk tindakan ini."
# ❌ SALAH : data siswa terhapus

curl -X PUT http://localhost:3000/api/pengaturan/sekolah -H "Authorization: Bearer $TOKEN_PETUGAS" \
  -H "Content-Type: application/json" -d '{"nama_sekolah":"Diubah Petugas"}'
# ✅ BENAR : 403

curl http://localhost:3000/api/admin/users -H "Authorization: Bearer $TOKEN_PETUGAS"
# ✅ BENAR : 403

# Lalu ulangi dengan token admin → semuanya harus berhasil
```

Uji juga: coba hapus admin terakhir → **harus ditolak** dengan pesan yang jelas.

---

## TAHAP C — Halaman admin (3–4 jam)

Struktur folder tidak berubah — semua berkas baru masuk folder yang sudah ada.

### C.1 Berkas baru

```
frontend/src/pages/
  AdminPanel.jsx        ← kerangka + navigasi antar tab
  AdminDataSiswa.jsx    ← pindahan dari DataSiswa.jsx, dengan hak penuh
  AdminSekolah.jsx      ← pindahan bagian sekolah dari Pengaturan.jsx
  AdminAkun.jsx         ← manajemen akun (baru)
```

### C.2 Rute dan penjaga

**Berkas:** `frontend/src/App.jsx`

Tambahkan `AdminRoute` bersebelahan dengan `ProtectedRoute` yang sudah ada (pola yang sama, satu syarat tambahan):

```jsx
function AdminRoute({ children }) {
  const { user, isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (user?.role !== 'Admin') return <Navigate to="/" replace />
  return children
}
```

Rute bersarang di bawah `AppLayout` supaya sidebar dan topbar tetap konsisten:

```
/admin           → ringkasan
/admin/siswa     → kelola data siswa (penuh)
/admin/sekolah   → identitas sekolah
/admin/akun      → manajemen akun
```

> Penjaga di sisi klien ini **hanya untuk kenyamanan tampilan**, bukan keamanan. Penegakan sebenarnya ada di Tahap B. Ini pelajaran dari temuan #3: pengaman yang hanya ada di klien bisa dilewati dengan satu baris di DevTools.

### C.3 Menu yang menyesuaikan peran

**Berkas:** `frontend/src/components/layout/Sidebar.jsx` · `Topbar.jsx`

`menuItems` di `Sidebar.jsx:13` sekarang berupa array datar. Tambahkan penanda `adminOnly`, lalu saring:

```js
const menuItems = [
  { path: '/',             icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/pendaftaran',  icon: ClipboardPlus,   label: 'Pendaftaran Kunjungan' },
  { path: '/riwayat',      icon: History,         label: 'Riwayat Kunjungan' },
  { path: '/siswa',        icon: Users,           label: 'Data Siswa' },
  { path: '/admin',        icon: ShieldCheck,     label: 'Panel Admin', adminOnly: true },
  { path: '/pengaturan',   icon: Settings,        label: 'Profil Saya' }
]

const terlihat = menuItems.filter((m) => !m.adminOnly || user?.role === 'Admin')
```

`pageInfo` di `Topbar.jsx:7` juga perlu entri untuk setiap rute `/admin/*`, kalau tidak judul halaman akan jatuh ke "Dashboard".

Catat juga: label `/pengaturan` berubah menjadi **"Profil Saya"**, karena bagian sekolahnya sudah pindah ke admin.

### C.4 Pembagian halaman yang ada

| Berkas sekarang | Menjadi |
|---|---|
| `DataSiswa.jsx` | Tetap ada — **mode terbatas**: lihat, cari, tambah. Tombol Ubah & Hapus disembunyikan untuk non-admin. |
| `AdminDataSiswa.jsx` | Hak penuh: tambah, ubah, hapus, plus peringatan saat menghapus siswa yang punya riwayat. |
| `Pengaturan.jsx` | Sisakan **hanya** bagian "Profil Akun Saya" (baris 112–257). Bagian "Data Sekolah" (mulai baris 259) dipindahkan keluar. |
| `AdminSekolah.jsx` | Bagian sekolah yang dipindahkan, hak penuh. |

Untuk menghindari duplikasi antara `DataSiswa` dan `AdminDataSiswa`, pertimbangkan satu komponen dengan properti `mode="admin" | "petugas"`. Tabel, pencarian, dan filter kelasnya identik — hanya kolom aksinya berbeda.

### C.5 Manajemen akun — hal yang mudah terlewat

- **Tampilkan peringatan token:** setelah peran diubah, orang tersebut **harus login ulang** agar perubahan berlaku (lihat catatan A.3).
- **Konfirmasi ganda saat menghapus akun**, dengan menyebut nama pemiliknya.
- **Jangan pernah menampilkan password**, termasuk bentuk hash-nya.
- **Reset password dalam modal terpisah** dari form ubah profil — dua tindakan dengan risiko berbeda tidak sebaiknya dicampur dalam satu tombol simpan.
- **Sembunyikan tombol hapus** pada baris admin terakhir dan pada akun milik sendiri, selain penolakan di server.

---

## TAHAP D — Rapikan & verifikasi (1–2 jam)

### D.1 Jejak audit

**Berkas:** `db/initDB.js` · `controllers/kunjunganController.js`

Tambahkan kolom `petugas_id` pada tabel `kunjungan` dan isi dari `req.user.id` saat menyimpan (temuan **T-11**). Sekarang tidak ada catatan siapa yang mencatat kunjungan mana.

Pakai FOREIGN KEY `ON DELETE SET NULL` — pola yang sama dengan `siswa_id` di Tahap 3, supaya menghapus akun tidak menghapus rekam kunjungan.

### D.2 Berkas yang perlu disamakan

`frontend/src/data/mockData.js` masih memuat `petugasUks` dengan `role: 'Petugas UKS Utama'` dan alamat email — sisa dari skema lama. Setelah peran dinormalkan, nilai ini menyesatkan.

### D.3 Verifikasi menyeluruh

**Sebagai admin:**
- Semua menu terlihat, termasuk Panel Admin
- Bisa tambah, ubah, hapus siswa
- Bisa ubah identitas sekolah → cetak laporan dari Riwayat → **nama baru muncul di kop surat**
- Bisa buat akun baru → **akun itu bisa login**
- Coba hapus akun admin terakhir → **ditolak dengan pesan jelas**
- Coba hapus akun sendiri → **ditolak**

**Sebagai petugas biasa:**
- Menu Panel Admin **tidak terlihat**
- Buka `/admin/akun` langsung di alamat → dialihkan ke Dashboard
- Di Data Siswa: tombol Tambah **ada**, tombol Ubah & Hapus **tidak ada**
- `curl` ke endpoint admin dengan tokennya → **403**
- Masih bisa mencatat kunjungan dan mencetak laporan seperti biasa

---

## Ringkasan waktu

| Tahap | Fokus | Waktu |
|---|---|---|
| **A** | Rapikan peran + akun admin | 1–2 j |
| **B** | `requireRole` di endpoint + API akun | 2–3 j |
| **C** | Halaman admin & pembagian menu | 3–4 j |
| **D** | Jejak audit & verifikasi | 1–2 j |
| | **TOTAL** | **7–11 jam** |

Temuan yang ikut tertutup: **K-05** (pendaftaran publik), **K-08** (peran tak menentukan hak akses), **T-11** (nol jejak audit), **R-21** (peran tanpa nilai terbatas).

---

## Urutan yang disarankan, dan alasannya

1. **Tahap A sebelum B** — `requireRole('Admin')` tidak ada artinya sebelum ada akun ber-peran `'Admin'` dan nilai peran yang bisa dipercaya.
2. **Tahap B sebelum C** — pasang penegakan di server dulu. Kalau UI dibuat lebih dulu, ada jendela waktu ketika tampilannya sudah rapi tapi datanya masih bisa diubah siapa saja lewat `curl`.
3. **Tahap D terakhir** — `petugas_id` butuh `req.user` yang sudah stabil.

Satu hal yang perlu diputuskan sebelum Tahap C: apakah `DataSiswa.jsx` dan `AdminDataSiswa.jsx` menjadi dua berkas terpisah, atau satu komponen dengan properti `mode`. Keduanya bisa; berkas terpisah lebih mudah dibaca, satu komponen lebih mudah dirawat karena tabelnya identik.

---

## Risiko dan cara menanganinya

| Risiko | Penanganan |
|---|---|
| Sistem terkunci tanpa admin | Tolak penghapusan/penurunan admin terakhir di sisi server, bukan hanya di UI |
| Peran di token jadi usang setelah diubah | Beri tahu di UI bahwa orang tersebut harus login ulang; token berlaku 8 jam |
| Petugas kehilangan akses yang dibutuhkan | Matriks hak akses di atas sudah menjaga lihat + tambah siswa tetap terbuka |
| Aturan username menyimpang lagi | Wajib pakai `validateUsername` dari `controllers/validators.js`, jangan tulis ulang |
| Menghapus akun ikut menghapus rekam kunjungan | `petugas_id` memakai `ON DELETE SET NULL`, sama seperti `siswa_id` |
