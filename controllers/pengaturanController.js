import pool from '../db/db.js'

export const pengaturanController = {
  // GET /api/pengaturan — ambil profil user yang login + data sekolah
  get: async (req, res) => {
    try {
      const userId = req.headers['x-user-id']
      const sekolahRes = await pool.query('SELECT * FROM pengaturan_sekolah LIMIT 1')
      const sekolah = sekolahRes[0][0] || {}

      let petugas = {}
      if (userId) {
        const [rows] = await pool.query(
          'SELECT id, nama_lengkap, username, nip, no_telepon, role FROM users WHERE id = ?',
          [userId]
        )
        petugas = rows[0] || {}
      } else {
        // Fallback: ambil user pertama
        const [rows] = await pool.query(
          'SELECT id, nama_lengkap, username, nip, no_telepon, role FROM users LIMIT 1'
        )
        petugas = rows[0] || {}
      }

      res.json({ success: true, data: { petugas, sekolah } })
    } catch (err) {
      res.status(500).json({ success: false, message: err.message })
    }
  },

  // PUT /api/pengaturan/petugas — update profil user yang login
  updatePetugas: async (req, res) => {
    try {
      const userId = req.headers['x-user-id']
      const { nama_lengkap, username, nip, no_telepon } = req.body

      if (!userId) {
        return res.status(400).json({ success: false, message: 'User ID tidak ditemukan!' })
      }

      await pool.query(
        'UPDATE users SET nama_lengkap = ?, username = ?, nip = ?, no_telepon = ? WHERE id = ?',
        [nama_lengkap, username ? username.toLowerCase() : null, nip, no_telepon, userId]
      )

      // Kembalikan data terbaru
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
      res.status(500).json({ success: false, message: err.message })
    }
  },

  // PUT /api/pengaturan/sekolah — update data sekolah
  updateSekolah: async (req, res) => {
    try {
      const { nama_sekolah, npsn, telepon_sekolah, kepala_sekolah, alamat } = req.body
      await pool.query(
        'UPDATE pengaturan_sekolah SET nama_sekolah = ?, npsn = ?, telepon_sekolah = ?, kepala_sekolah = ?, alamat = ? WHERE id = 1',
        [nama_sekolah, npsn, telepon_sekolah, kepala_sekolah, alamat]
      )
      res.json({ success: true, message: 'Data sekolah berhasil diperbarui!' })
    } catch (err) {
      res.status(500).json({ success: false, message: err.message })
    }
  }
}
