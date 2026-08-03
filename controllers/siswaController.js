import pool from '../db/db.js'

// GET /api/siswa
export async function getSiswa(req, res) {
  try {
    const [rows] = await pool.query('SELECT * FROM siswa ORDER BY id DESC')
    return res.json({ success: true, data: rows })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

// POST /api/siswa
export async function createSiswa(req, res) {
  const { nis, nama, kelas, jenis_kelamin, tanggal_lahir, nama_wali, telepon_wali } = req.body

  try {
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
    return res.status(500).json({ success: false, message: err.message })
  }
}

// PUT /api/siswa/:id
export async function updateSiswa(req, res) {
  const { id } = req.params
  const { nis, nama, kelas, jenis_kelamin, tanggal_lahir, nama_wali, telepon_wali } = req.body

  try {
    await pool.query(
      `UPDATE siswa
       SET nis = ?, nama = ?, kelas = ?, jenis_kelamin = ?, tanggal_lahir = ?, nama_wali = ?, telepon_wali = ?
       WHERE id = ?`,
      [nis, nama, kelas, jenis_kelamin, tanggal_lahir || null, nama_wali || '', telepon_wali || '', id]
    )

    return res.json({ success: true, message: 'Data siswa berhasil diperbarui' })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

// DELETE /api/siswa/:id
export async function deleteSiswa(req, res) {
  const { id } = req.params

  try {
    await pool.query('DELETE FROM siswa WHERE id = ?', [id])
    return res.json({ success: true, message: 'Data siswa berhasil dihapus' })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}
