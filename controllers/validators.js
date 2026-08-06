/**
 * Lapisan validasi tunggal untuk seluruh controller.
 *
 * Sebelumnya aturan username ditulis di 3 tempat dengan isi yang sudah
 * menyimpang satu sama lain. File ini menjadi satu-satunya sumber kebenaran
 * di sisi server.
 */
import { z } from 'zod'

// Huruf kecil, angka, underscore. Min 4, maks 20, tidak boleh diawali angka.
const USERNAME_REGEX = /^[a-z][a-z0-9_]{3,19}$/

/**
 * Validasi username dengan pesan spesifik per pelanggaran, supaya petugas
 * tahu persis apa yang harus diperbaiki.
 */
export function validateUsername(username) {
  if (!username) return 'Username wajib diisi!'
  if (username.length < 4) return 'Username minimal 4 karakter!'
  if (username.length > 20) return 'Username maksimal 20 karakter!'
  if (/^[0-9]/.test(username)) return 'Username tidak boleh dimulai dengan angka!'
  if (!/^[a-z0-9_]+$/.test(username)) {
    return 'Username hanya boleh berisi huruf kecil, angka, dan underscore (_)!'
  }
  if (!USERNAME_REGEX.test(username)) {
    return 'Format username tidak valid! Gunakan huruf kecil, angka, dan underscore saja.'
  }
  return null
}

const KELAS_VALID = ['1', '2', '3', '4', '5', '6']
const STATUS_VALID = ['Kembali ke Kelas', 'Istirahat di UKS', 'Dijemput Wali', 'Dirujuk ke Klinik']

// Dua peran resmi. Harus sama persis dengan ENUM kolom `users.role`
// di db/initDB.js dan db/uks_digital.sql.
export const ROLE_VALID = ['Admin', 'Dokter Kecil UKS']

export const siswaSchema = z.object({
  nis: z
    .string({ error: 'NIS wajib diisi.' })
    .trim()
    .min(1, 'NIS wajib diisi.')
    .max(20, 'NIS maksimal 20 karakter.'),
  nama: z
    .string({ error: 'Nama wajib diisi.' })
    .trim()
    .min(3, 'Nama terlalu pendek (minimal 3 karakter).')
    .max(100, 'Nama maksimal 100 karakter.'),
  kelas: z
    .string({ error: 'Kelas wajib diisi.' })
    .refine((v) => KELAS_VALID.includes(String(v)), 'Kelas harus antara 1 sampai 6.'),
  jenis_kelamin: z
    .string({ error: 'Jenis kelamin wajib diisi.' })
    .refine(
      (v) => v === 'Laki-laki' || v === 'Perempuan',
      'Jenis kelamin harus "Laki-laki" atau "Perempuan".'
    ),
  tanggal_lahir: z.string().trim().optional().nullable(),
  nama_wali: z.string().trim().max(100, 'Nama wali maksimal 100 karakter.').optional().nullable(),
  telepon_wali: z.string().trim().max(15, 'Telepon wali maksimal 15 karakter.').optional().nullable()
})

// Waktu diterima sebagai string ('YYYY-MM-DD HH:MM:SS' atau ISO) maupun
// objek Date — klien sering mengirim balik baris hasil GET apa adanya,
// dan mysql2 mengembalikan kolom DATETIME sebagai Date.
const waktuWajib = z
  .union([z.string(), z.date()], { error: 'Waktu masuk wajib diisi.' })
  .refine((v) => (v instanceof Date ? !Number.isNaN(v.getTime()) : v.trim().length > 0), {
    message: 'Waktu masuk wajib diisi.'
  })

const waktuOpsional = z.union([z.string(), z.date()]).optional().nullable()

export const kunjunganSchema = z.object({
  siswa_id: z.union([z.number(), z.string()]).optional().nullable(),
  siswa_nama: z
    .string({ error: 'Nama siswa wajib diisi.' })
    .trim()
    .min(1, 'Nama siswa wajib diisi.'),
  siswa_nis: z.string().trim().optional().nullable(),
  kelas: z.string().trim().optional().nullable(),
  waktu_masuk: waktuWajib,
  waktu_keluar: waktuOpsional,
  keluhan_utama: z
    .string({ error: 'Keluhan wajib diisi.' })
    .trim()
    .min(1, 'Keluhan wajib diisi.')
    .max(255, 'Keluhan terlalu panjang (maksimal 255 karakter).'),
  keterangan: z.string().trim().max(1000, 'Keterangan terlalu panjang.').optional().nullable(),
  is_darurat: z.union([z.boolean(), z.number()]).optional(),
  tindakan: z.string().trim().max(500, 'Tindakan terlalu panjang.').optional().nullable(),
  status: z
    .string()
    .optional()
    .refine(
      (v) => v === undefined || v === '' || STATUS_VALID.includes(v),
      `Status harus salah satu dari: ${STATUS_VALID.join(', ')}.`
    )
})

/**
 * Jalankan skema terhadap body request.
 * Mengembalikan { ok, data, message } — pesan sudah digabung agar bisa
 * langsung ditampilkan ke petugas tanpa membocorkan detail teknis.
 */
export function validate(schema, body) {
  const hasil = schema.safeParse(body)

  if (hasil.success) {
    return { ok: true, data: hasil.data }
  }

  const message = hasil.error.issues.map((i) => i.message).join(' ')
  return { ok: false, message }
}
