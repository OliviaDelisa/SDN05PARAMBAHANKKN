import pool from '../db/db.js'
import { siswaSchema, validate } from './validators.js'

// GET /api/siswa
export async function getSiswa(req, res, next) {
  try {
    const [rows] = await pool.query('SELECT * FROM siswa ORDER BY id DESC')
    return res.json({ success: true, data: rows })
  } catch (err) {
    next(err)
  }
}

// POST /api/siswa
export async function createSiswa(req, res, next) {
  const hasil = validate(siswaSchema, req.body)
  if (!hasil.ok) {
    return res.status(400).json({ success: false, message: hasil.message })
  }

  const { nis, nama, kelas, jenis_kelamin, tanggal_lahir, nama_wali, telepon_wali } = hasil.data

  try {
    // Cek duplikat NIS lebih dulu supaya pesannya jelas, bukan error constraint mentah.
    const [existing] = await pool.query('SELECT id FROM siswa WHERE nis = ?', [nis])
    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: `NIS ${nis} sudah terdaftar atas nama siswa lain.`
      })
    }

    const [result] = await pool.query(
      `INSERT INTO siswa (nis, nama, kelas, jenis_kelamin, tanggal_lahir, nama_wali, telepon_wali)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [nis, nama, kelas, jenis_kelamin, tanggal_lahir || null, nama_wali || '', telepon_wali || '']
    )

    const newSiswa = {
      id: result.insertId,
      nis,
      nama,
      kelas,
      jenis_kelamin,
      tanggal_lahir,
      nama_wali,
      telepon_wali
    }

    return res.status(201).json({ success: true, message: 'Siswa berhasil ditambahkan', data: newSiswa })
  } catch (err) {
    next(err)
  }
}

// PUT /api/siswa/:id
export async function updateSiswa(req, res, next) {
  const { id } = req.params

  const hasil = validate(siswaSchema, req.body)
  if (!hasil.ok) {
    return res.status(400).json({ success: false, message: hasil.message })
  }

  const { nis, nama, kelas, jenis_kelamin, tanggal_lahir, nama_wali, telepon_wali } = hasil.data

  try {
    const [bentrok] = await pool.query('SELECT id FROM siswa WHERE nis = ? AND id != ?', [nis, id])
    if (bentrok.length > 0) {
      return res.status(400).json({
        success: false,
        message: `NIS ${nis} sudah dipakai siswa lain.`
      })
    }

    const [result] = await pool.query(
      `UPDATE siswa
       SET nis = ?, nama = ?, kelas = ?, jenis_kelamin = ?, tanggal_lahir = ?, nama_wali = ?, telepon_wali = ?
       WHERE id = ?`,
      [nis, nama, kelas, jenis_kelamin, tanggal_lahir || null, nama_wali || '', telepon_wali || '', id]
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Data siswa tidak ditemukan.' })
    }

    return res.json({ success: true, message: 'Data siswa berhasil diperbarui' })
  } catch (err) {
    next(err)
  }
}

// DELETE /api/siswa/:id
export async function deleteSiswa(req, res, next) {
  const { id } = req.params

  try {
    const [result] = await pool.query('DELETE FROM siswa WHERE id = ?', [id])

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Data siswa tidak ditemukan.' })
    }

    return res.json({ success: true, message: 'Data siswa berhasil dihapus' })
  } catch (err) {
    next(err)
  }
}
