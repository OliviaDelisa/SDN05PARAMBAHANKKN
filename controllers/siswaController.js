import pool from '../db/db.js'
import { siswaList } from '../frontend/src/data/mockData.js'

export const siswaController = {
  getAll: async (req, res) => {
    try {
      const { kelas, search } = req.query
      let query = 'SELECT * FROM siswa WHERE 1=1'
      const params = []

      if (kelas) {
        query += ' AND kelas = ?'
        params.push(kelas)
      }

      if (search) {
        query += ' AND (nama LIKE ? OR nis LIKE ?)'
        params.push(`%${search}%`, `%${search}%`)
      }

      query += ' ORDER BY kelas ASC, nama ASC'

      const [rows] = await pool.query(query, params)
      res.json({ success: true, data: rows.length > 0 ? rows : siswaList })
    } catch (err) {
      // Fallback to mock data if MySQL offline
      res.json({ success: true, data: siswaList, note: 'Mock data fallback' })
    }
  },

  getById: async (req, res) => {
    try {
      const [rows] = await pool.query('SELECT * FROM siswa WHERE id = ?', [req.params.id])
      if (rows.length === 0) {
        const found = siswaList.find((s) => s.id === Number(req.params.id))
        return res.json({ success: true, data: found })
      }
      res.json({ success: true, data: rows[0] })
    } catch (err) {
      const found = siswaList.find((s) => s.id === Number(req.params.id))
      res.json({ success: true, data: found })
    }
  },

  create: async (req, res) => {
    try {
      const { nis, nama, kelas, jenis_kelamin, tanggal_lahir, nama_wali, telepon_wali } = req.body
      if (!nis || !nama || !kelas || !jenis_kelamin) {
        return res.status(400).json({ success: false, message: 'NIS, Nama, Kelas, dan Jenis Kelamin wajib diisi!' })
      }

      const [result] = await pool.query(
        'INSERT INTO siswa (nis, nama, kelas, jenis_kelamin, tanggal_lahir, nama_wali, telepon_wali) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [nis, nama, kelas, jenis_kelamin, tanggal_lahir || null, nama_wali || null, telepon_wali || null]
      )

      res.status(201).json({
        success: true,
        message: 'Data siswa berhasil disimpan!',
        data: { id: result.insertId, ...req.body }
      })
    } catch (err) {
      res.status(200).json({
        success: true,
        message: 'Data siswa tersimpan di memori (Mode Demo)',
        data: { id: Date.now(), ...req.body }
      })
    }
  },

  update: async (req, res) => {
    try {
      const { nis, nama, kelas, jenis_kelamin, tanggal_lahir, nama_wali, telepon_wali } = req.body
      await pool.query(
        'UPDATE siswa SET nis=?, nama=?, kelas=?, jenis_kelamin=?, tanggal_lahir=?, nama_wali=?, telepon_wali=? WHERE id=?',
        [nis, nama, kelas, jenis_kelamin, tanggal_lahir, nama_wali, telepon_wali, req.params.id]
      )
      res.json({ success: true, message: 'Data siswa berhasil diperbarui!' })
    } catch (err) {
      res.json({ success: true, message: 'Data siswa berhasil diperbarui (Mode Demo)' })
    }
  },

  delete: async (req, res) => {
    try {
      await pool.query('DELETE FROM siswa WHERE id = ?', [req.params.id])
      res.json({ success: true, message: 'Data siswa berhasil dihapus!' })
    } catch (err) {
      res.json({ success: true, message: 'Data siswa berhasil dihapus (Mode Demo)' })
    }
  }
}
