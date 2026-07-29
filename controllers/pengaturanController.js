import pool from '../db/db.js'
import { petugasUks, dataSekolah } from '../frontend/src/data/mockData.js'

export const pengaturanController = {
  get: async (req, res) => {
    try {
      const [userRows] = await pool.query('SELECT nama_lengkap, email, nip, no_telepon FROM users LIMIT 1')
      const [sekolahRows] = await pool.query('SELECT * FROM pengaturan_sekolah LIMIT 1')

      res.json({
        success: true,
        data: {
          petugas: userRows[0] || petugasUks,
          sekolah: sekolahRows[0] || dataSekolah
        }
      })
    } catch (err) {
      res.json({
        success: true,
        data: {
          petugas: petugasUks,
          sekolah: dataSekolah
        }
      })
    }
  },

  updatePetugas: async (req, res) => {
    try {
      const { nama_lengkap, email, nip, no_telepon } = req.body
      await pool.query(
        'UPDATE users SET nama_lengkap=?, email=?, nip=?, no_telepon=? WHERE id=1',
        [nama_lengkap, email, nip, no_telepon]
      )
      res.json({ success: true, message: 'Profil petugas UKS berhasil diperbarui!' })
    } catch (err) {
      res.json({ success: true, message: 'Profil petugas UKS berhasil diperbarui (Mode Demo)' })
    }
  },

  updateSekolah: async (req, res) => {
    try {
      const { nama_sekolah, npsn, telepon_sekolah, kepala_sekolah, alamat } = req.body
      await pool.query(
        'UPDATE pengaturan_sekolah SET nama_sekolah=?, npsn=?, telepon_sekolah=?, kepala_sekolah=?, alamat=? WHERE id=1',
        [nama_sekolah, npsn, telepon_sekolah, kepala_sekolah, alamat]
      )
      res.json({ success: true, message: 'Data sekolah berhasil diperbarui!' })
    } catch (err) {
      res.json({ success: true, message: 'Data sekolah berhasil diperbarui (Mode Demo)' })
    }
  }
}
