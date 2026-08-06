import pool from '../db/db.js'
import { validateUsername } from './validators.js'

export const pengaturanController = {
  // GET /api/pengaturan — ambil profil user yang login + data sekolah
  get: async (req, res, next) => {
    try {
      // Identitas diambil dari token hasil verifikasi, BUKAN dari header klien.
      const userId = req.user.id

      const [sekolahRows] = await pool.query('SELECT * FROM pengaturan_sekolah LIMIT 1')
      const sekolah = sekolahRows[0] || {}

      const [rows] = await pool.query(
        'SELECT id, nama_lengkap, username, nip, no_telepon, role FROM users WHERE id = ?',
        [userId]
      )

      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Akun tidak ditemukan.' })
      }

      res.json({ success: true, data: { petugas: rows[0], sekolah } })
    } catch (err) {
      next(err)
    }
  },

  // PUT /api/pengaturan/petugas — update profil user yang login
  updatePetugas: async (req, res, next) => {
    try {
      const userId = req.user.id
      const { nama_lengkap, username, nip, no_telepon } = req.body

      if (!nama_lengkap || !nama_lengkap.trim()) {
        return res.status(400).json({ success: false, message: 'Nama lengkap wajib diisi!' })
      }

      if (!nip || !nip.trim()) {
        return res.status(400).json({ success: false, message: 'NIP wajib diisi!' })
      }

      // Validasi format username memakai aturan yang SAMA dengan register.
      // Tanpa ini, username seperti "ab" bisa tersimpan dan pemiliknya
      // terkunci dari akun selamanya karena login menolak format itu.
      const usernameError = validateUsername(username)
      if (usernameError) {
        return res.status(400).json({ success: false, message: usernameError })
      }

      const usernameLower = username.toLowerCase()

      // Cegah tabrakan dengan akun lain sebelum menyentuh constraint MySQL.
      const [bentrok] = await pool.query(
        'SELECT id FROM users WHERE (username = ? OR nip = ?) AND id != ?',
        [usernameLower, nip, userId]
      )

      if (bentrok.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Username atau NIP tersebut sudah dipakai akun lain!'
        })
      }

      const [result] = await pool.query(
        'UPDATE users SET nama_lengkap = ?, username = ?, nip = ?, no_telepon = ? WHERE id = ?',
        [nama_lengkap.trim(), usernameLower, nip.trim(), no_telepon || '', userId]
      )

      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Akun tidak ditemukan.' })
      }

      const [rows] = await pool.query(
        'SELECT id, nama_lengkap, username, nip, no_telepon, role FROM users WHERE id = ?',
        [userId]
      )

      res.json({
        success: true,
        message: 'Profil petugas UKS berhasil diperbarui!',
        data: rows[0] || {}
      })
    } catch (err) {
      next(err)
    }
  },

  // PUT /api/pengaturan/sekolah — update data sekolah
  updateSekolah: async (req, res, next) => {
    try {
      const { nama_sekolah, npsn, telepon_sekolah, kepala_sekolah, kepala_nip, alamat } = req.body

      if (!nama_sekolah || !nama_sekolah.trim()) {
        return res.status(400).json({ success: false, message: 'Nama sekolah wajib diisi!' })
      }

      const [result] = await pool.query(
        'UPDATE pengaturan_sekolah SET nama_sekolah = ?, npsn = ?, telepon_sekolah = ?, kepala_sekolah = ?, kepala_nip = ?, alamat = ? WHERE id = 1',
        [nama_sekolah.trim(), npsn || '', telepon_sekolah || '', kepala_sekolah || '', kepala_nip || '', alamat || '']
      )

      // Baris id = 1 dibuat oleh initDB. Kalau tidak ada, ada yang salah dengan
      // inisialisasi database — jangan laporkan sukses palsu.
      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Data sekolah belum tersedia. Jalankan ulang server untuk inisialisasi.'
        })
      }

      res.json({ success: true, message: 'Data sekolah berhasil diperbarui!' })
    } catch (err) {
      next(err)
    }
  }
}
