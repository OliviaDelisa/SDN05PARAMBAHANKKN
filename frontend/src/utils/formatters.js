const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
const BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

const AVATAR_COLORS = [
  '#059669', '#0EA5E9', '#F59E0B', '#F43F5E',
  '#8B5CF6', '#14B8A6', '#EC4899', '#6366F1',
  '#D97706', '#0284C7', '#10B981', '#E11D48'
]

export function formatTanggal(dateStr) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return `${HARI[d.getDay()]}, ${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`
}

export function formatTanggalPendek(dateStr) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return `${d.getDate()} ${BULAN[d.getMonth()].substring(0, 3)} ${d.getFullYear()}`
}

export function formatWaktu(dateStr) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  const jam = String(d.getHours()).padStart(2, '0')
  const menit = String(d.getMinutes()).padStart(2, '0')
  return `${jam}.${menit}`
}

export function formatTanggalWaktu(dateStr) {
  if (!dateStr) return '-'
  return `${formatTanggalPendek(dateStr)} ${formatWaktu(dateStr)}`
}

export function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 11) return 'Selamat pagi'
  if (hour < 15) return 'Selamat siang'
  if (hour < 18) return 'Selamat sore'
  return 'Selamat malam'
}

export function getInitials(name) {
  if (!name) return '?'
  return name.charAt(0).toUpperCase()
}

export function getInitialColor(name) {
  if (!name) return AVATAR_COLORS[0]
  const code = name.charCodeAt(0)
  return AVATAR_COLORS[code % AVATAR_COLORS.length]
}

export function getBulanOptions() {
  return BULAN.map((b, i) => ({ value: i + 1, label: b }))
}

// Opsi tahun yang fleksibel untuk beberapa tahun ke depan (misal: 2024 s/d 2032)
export function getTahunOptions() {
  const currentYear = new Date().getFullYear()
  const years = []
  for (let i = currentYear - 2; i <= currentYear + 6; i++) {
    years.push(i)
  }
  return years
}

// Warna badge per status penanganan. Ditaruh di sini supaya Dashboard dan
// Riwayat memakai pemetaan yang sama persis.
export function getStatusVariant(status) {
  switch (status) {
    case 'Kembali ke Kelas': return 'success'
    case 'Istirahat di UKS': return 'warning'
    case 'Dijemput Wali': return 'info'
    case 'Dirujuk ke Klinik': return 'danger'
    default: return 'neutral'
  }
}

/**
 * Waktu sekarang dalam format yang diterima <input type="datetime-local">
 * DAN kolom DATETIME MySQL, memakai zona waktu lokal.
 *
 * Jangan pakai toISOString() untuk ini — hasilnya UTC, sehingga kunjungan
 * pukul 07.00 WIB tercatat sebagai 00.00 dan bisa jatuh ke tanggal sebelumnya.
 */
export function waktuLokalSekarang() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** Ubah nilai tanggal apa pun menjadi 'YYYY-MM-DD' menurut waktu lokal. */
export function tanggalLokal(date) {
  const d = date instanceof Date ? date : new Date(date)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Ubah nilai datetime menjadi format yang dipakai <input type="datetime-local">. */
export function keInputDatetime(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
