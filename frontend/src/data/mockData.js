// Data Referensi & Master (Kosong untuk Aplikasi Baru)

export const keluhanOptions = [
  // Umum / Sistemik
  'Demam', 'Lelah', 'Lemas', 'Pingsan', 'Kejang',

  // Kepala & Saraf
  'Sakit Kepala', 'Pusing',

  // Pencernaan
  'Sakit Perut', 'Mual', 'Muntah', 'Diare', 'Maag',

  // Pernapasan
  'Batuk', 'Pilek', 'Sesak Napas', 'Asma Kambuh',

  // THT (Telinga, Hidung, Tenggorokan)
  'Sakit Tenggorokan', 'Mimisan',

  // Mata
  'Sakit Mata',

  // Gigi & Mulut
  'Sakit Gigi', 'Sariawan',

  // Kulit
  'Gatal', 'Alergi',

  // Cedera / Trauma
  'Luka Ringan', 'Luka Berat', 'Terjatuh / Terbentur', 'Keseleo', 'Memar'
]

export const tindakanOptions = [
  // Istirahat
  'Istirahat 15 menit', 'Istirahat 30 menit', 'Dibaringkan & kaki ditinggikan',

  // Suhu Tubuh & Demam
  'Diukur suhu tubuh', 'Kompres hangat', 'Kompres dingin', 'Diberi Paracetamol',

  // Pencernaan
  'Diberi oralit', 'Diberi obat maag', 'Dianjurkan sarapan', 'Diberi air putih hangat',

  // Luka & Cedera
  'Dibersihkan luka', 'Dibalut luka', 'Diberi antiseptik', 'Diberi plester',

  // Mimisan
  'Diberi tisu / kapas bersih (mimisan)', 'Posisi kepala sedikit menunduk (mimisan)',

  // Lainnya
  'Diberi salep / minyak kayu putih', 'Diberi madu / air hangat',
  'Dirujuk ke Klinik', 'Dijemput Wali'
]

export const statusOptions = [
  'Kembali ke Kelas', 'Istirahat di UKS', 'Dijemput Wali', 'Dirujuk ke Klinik'
]

// Tingkat Kelas 1 - 6
export const kelasOptions = ['1', '2', '3', '4', '5', '6']

// Data Siswa & Kunjungan Kosong (Fresh App State untuk Aplikasi Baru)
export const siswaList = []

export const kunjunganList = []

export const petugasUks = {
  nama_lengkap: 'Ibu Siti Rahmawati',
  email: 'siti.rahmawati@sdn05parambahan.id',
  nip: '198507152010012003',
  no_telepon: '081234567890',
  role: 'Petugas UKS Utama'
}

export const dataSekolah = {
  nama_sekolah: 'SDN 05 Parambahan',
  npsn: '10303456',
  telepon_sekolah: '0751234567',
  kepala_sekolah: 'Muswar Dedi, S.Pd',
  kepala_nip: '198510082010011013',
  alamat: 'Jl. Pendidikan No. 5, Nagari Parambahan, Kec. Bukit Sundi, Kab. Solok, Sumatera Barat'
}