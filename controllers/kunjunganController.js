import pool from '../db/db.js'
import { kunjunganSchema, validate } from './validators.js'

/**
 * Normalkan nilai waktu menjadi format 'YYYY-MM-DD HH:MM:SS' yang diterima
 * kolom DATETIME MySQL.
 *
 * Perlu karena mysql2 mengembalikan DATETIME sebagai objek Date; saat klien
 * mengirimnya balik (mis. tombol "Selesai" yang menyertakan seluruh baris),
 * nilainya sudah berbentuk ISO dengan akhiran 'Z' dan MySQL menolaknya
 * dengan ER_TRUNCATED_WRONG_VALUE.
 *
 * Waktu ISO ber-'Z' dikonversi ke waktu lokal server lebih dulu supaya
 * kunjungan pukul 07.15 WIB tidak bergeser menjadi 00.15.
 */
function keDatetimeMySQL(nilai) {
  if (!nilai) return null

  if (typeof nilai === 'string') {
    // Sudah dalam format MySQL: 'YYYY-MM-DD HH:MM[:SS]'
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(:\d{2})?$/.test(nilai)) {
      return nilai.length === 16 ? `${nilai}:00` : nilai
    }
    // Format <input type="datetime-local">: 'YYYY-MM-DDTHH:MM'
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(nilai)) {
      return `${nilai.replace('T', ' ')}:00`
    }
  }

  const d = nilai instanceof Date ? nilai : new Date(nilai)
  if (Number.isNaN(d.getTime())) return null

  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

// GET /api/kunjungan
export async function getKunjungan(req, res, next) {
  try {
    const [rows] = await pool.query('SELECT * FROM kunjungan ORDER BY id DESC')
    const formatted = rows.map((r) => ({ ...r, is_darurat: Boolean(r.is_darurat) }))
    return res.json({ success: true, data: formatted })
  } catch (err) {
    next(err)
  }
}

// POST /api/kunjungan
export async function createKunjungan(req, res, next) {
  const hasil = validate(kunjunganSchema, req.body)
  if (!hasil.ok) {
    return res.status(400).json({ success: false, message: hasil.message })
  }

  const {
    siswa_id,
    siswa_nama,
    siswa_nis,
    kelas,
    waktu_masuk,
    keluhan_utama,
    keterangan,
    is_darurat,
    tindakan,
    status
  } = hasil.data

  try {
    const [result] = await pool.query(
      `INSERT INTO kunjungan (siswa_id, petugas_id, siswa_nama, siswa_nis, kelas, waktu_masuk, keluhan_utama, keterangan, is_darurat, tindakan, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        siswa_id || null,
        // Jejak audit: diambil dari token hasil verifikasi, BUKAN dari body —
        // kalau dari body, siapa pun bisa mencatat atas nama orang lain.
        req.user.id,
        siswa_nama,
        siswa_nis,
        kelas,
        keDatetimeMySQL(waktu_masuk),
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
      petugas_id: req.user.id,
      siswa_nama,
      siswa_nis,
      kelas,
      waktu_masuk,
      keluhan_utama,
      keterangan,
      is_darurat: Boolean(is_darurat),
      tindakan,
      status: status || 'Istirahat di UKS'
    }

    return res.status(201).json({ success: true, message: 'Rekam kunjungan berhasil disimpan', data: newKunjungan })
  } catch (err) {
    next(err)
  }
}

// PUT /api/kunjungan/:id
export async function updateKunjungan(req, res, next) {
  const { id } = req.params

  const hasil = validate(kunjunganSchema, req.body)
  if (!hasil.ok) {
    return res.status(400).json({ success: false, message: hasil.message })
  }

  const {
    siswa_nama,
    siswa_nis,
    kelas,
    waktu_masuk,
    waktu_keluar,
    keluhan_utama,
    keterangan,
    is_darurat,
    tindakan,
    status
  } = hasil.data

  try {
    const [result] = await pool.query(
      `UPDATE kunjungan
       SET siswa_nama = ?, siswa_nis = ?, kelas = ?, waktu_masuk = ?, waktu_keluar = ?,
           keluhan_utama = ?, keterangan = ?, is_darurat = ?, tindakan = ?, status = ?
       WHERE id = ?`,
      [
        siswa_nama,
        siswa_nis,
        kelas,
        keDatetimeMySQL(waktu_masuk),
        keDatetimeMySQL(waktu_keluar),
        keluhan_utama,
        keterangan || '',
        is_darurat ? 1 : 0,
        tindakan || '',
        status || 'Istirahat di UKS',
        id
      ]
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Data kunjungan tidak ditemukan.' })
    }

    return res.json({ success: true, message: 'Data kunjungan berhasil diperbarui' })
  } catch (err) {
    next(err)
  }
}

// DELETE /api/kunjungan/:id
export async function deleteKunjungan(req, res, next) {
  const { id } = req.params

  try {
    const [result] = await pool.query('DELETE FROM kunjungan WHERE id = ?', [id])

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Data kunjungan tidak ditemukan.' })
    }

    return res.json({ success: true, message: 'Data kunjungan berhasil dihapus' })
  } catch (err) {
    next(err)
  }
}
