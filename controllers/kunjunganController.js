import pool from '../db/db.js'

// GET /api/kunjungan
export async function getKunjungan(req, res) {
  try {
    const [rows] = await pool.query('SELECT * FROM kunjungan ORDER BY id DESC')
    const formatted = rows.map((r) => ({ ...r, is_darurat: Boolean(r.is_darurat) }))
    return res.json({ success: true, data: formatted })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

// POST /api/kunjungan
export async function createKunjungan(req, res) {
  const { siswa_id, siswa_nama, siswa_nis, kelas, waktu_masuk, keluhan_utama, keterangan, is_darurat, tindakan, status } = req.body

  try {
    const [result] = await pool.query(
      `INSERT INTO kunjungan (siswa_id, siswa_nama, siswa_nis, kelas, waktu_masuk, keluhan_utama, keterangan, is_darurat, tindakan, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        siswa_id || null,
        siswa_nama,
        siswa_nis,
        kelas,
        waktu_masuk,
        keluhan_utama,
        keterangan || '',
        is_darurat ? 1 : 0,
        tindakan || '',
        status || 'Istirahat di UKS'
      ]
    )

    const newKunjungan = {
      id: result.insertId,
      siswa_id,
      siswa_nama,
      siswa_nis,
      kelas,
      waktu_masuk,
      keluhan_utama,
      keterangan,
      is_darurat: Boolean(is_darurat),
      tindakan,
      status
    }

    return res.status(201).json({ success: true, message: 'Rekam kunjungan berhasil disimpan', data: newKunjungan })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

// DELETE /api/kunjungan/:id
export async function deleteKunjungan(req, res) {
  const { id } = req.params

  try {
    await pool.query('DELETE FROM kunjungan WHERE id = ?', [id])
    return res.json({ success: true, message: 'Data kunjungan berhasil dihapus' })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}
