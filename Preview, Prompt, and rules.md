Aplikasi yang akan dibuat dalam workspace project ini adalah aplikasi untuk digitalisasi manajemen UKS untuk SDN 05 Parambahan. 

Adapun fitur - fitur yang akan ada pada aplikasi ini adalah 

1. Dashboard:
Dashboard akan berisi tanggal hari ini, Ucapan selamat datang pada yang akan menampilkan "Selamat Datang [Nama akun yang login]", Total kunjungan bulan ini, 4 Kartu Dashboard yang akan berisi jumlah kunjungan siswa hari ini, jumlah siswa yang sedang istirahat di UKS, dan kartu jumlah kasus darurat minggu ini, kemudian juga ada bar chart yang menunjukkan top 5 penyakit yang dilaporkan bulan ini, serta history aktivitas terkini. 

Pada halaman ini, juga terdapat tombol "Kunjungan Baru" yang apabila di klik akan mengarahkan pada form "Pendafataran Kunjungan"

[Sebagai referensi dapat dilihat dalam folder Documentations dengan nama "Dashboard.png"]

2. Halaman Pendaftaran Kunjungan (Inti Aplikasi)

Didesain agar petugas UKS hanya butuh < 30 detik untuk input 1 siswa.

Langkah 1: Cari Siswa. Kolom pencarian Autocomplete. Ketik "Andi", muncul dropdown "Andi Putra - 4A". Klik langsung terpilih.

Langkah 2: Form Kunjungan (Muncul otomatis setelah siswa dipilih):
Waktu Masuk: Otomatis terisi Real-time.
Keluhan Utama: Dropdown/Tags cepat (Sakit Kepala, Demam, Sakit Perut, Luka Ringan, Luka Berat, Lelah, dll) + Kolom keterangan tambahan.
Tindakan/Terapi: Apa yang dilakukan petugas (Istirahat 15 menit, Diberi Paracetamol, Dibalut, dll).

Status Akhir: Dropdown (Kembali ke Kelas / Istirahat di UKS / Dijemput Wali / Dirujuk ke Klinik).
Tombol Aksi: "Simpan Data" (Warna Hijau mencolok).

D. Halaman Riwayat Kunjungan (Buku Kuning Digital)
Filter Pencarian: Berdasarkan Tanggal, Nama Siswa, Kelas, atau Jenis Keluhan.
Tabel Data:
Kolom: Tanggal & Waktu | Nama Siswa | Kelas | Keluhan | Tindakan | Status | Aksi (Detail/Edit).
Fitur Ekspor: Tombol "Ekspor ke Excel/PDF" untuk dicetak jika diperlukan rapor kesehatan.


F. Halaman Laporan & Analitik
Sangat berguna untuk laporan bulanan ke Dinas Pendidikan atau Puskesmas.

Tugas anda hari ini adalah membuatkan saya struktur file react, js, css, atau apapun yang disesuaikan dengan project saat ini, dan anda tidak boleh mengubah struktur folder saat ini. Anda akan mengisi file - file Frontend dan backend serta JSON saja di saat sekarang ini. Sebelum mengeksekusi, anda harus membuat implementation Plan terlebih dahulu dan gunakanlah skills yang akan menjadikan anda membuat plan secara sistematis logis beserta alasan untuk setiap file yang dibuat, bagaimana hubungan setiap file tersebut, dan juga gunakan code seefektif dan seefisien mungkin.