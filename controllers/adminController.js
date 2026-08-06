import pool from '../db/db.js'
import bcrypt from 'bcrypt'
import { validateUsername, ROLE_VALID } from './validators.js'

const BCRYPT_ROUNDS = 10

// Kolom yang boleh dikirim ke klien. Password TIDAK PERNAH termasuk —
// bahkan bentuk hash-nya sekalipun.
const KOLOM_AMAN = 'id, nama_lengkap, username, nip, no_telepon, role, created_at'

/** Hitung jumlah admin selain id tertentu. Dipakai untuk menjaga admin terakhir. */
async function jumlahAdminLain(kecualiId) {
  const [rows] = await pool.query(
    "SELECT COUNT(*) AS total FROM users WHERE role = 'Admin' AND id != ?",
    [kecualiId]
  )
  return rows[0].total
}

/** Validasi bersama untuk buat & ubah akun. Mengembalikan pesan error atau null. */
function periksaMasukan({ nama_lengkap, username, nip, role }) {
  if (!nama_lengkap || !nama_lengkap.trim()) return 'Nama lengkap wajib diisi!'
  if (nama_lengkap.trim().length < 3) return 'Nama lengkap terlalu pendek (minimal 3 karakter).'
  if (!nip || !String(nip).trim()) return 'NIP/NIS wajib diisi!'

  const usernameError = validateUsername(username)
  if (usernameError) return usernameError

  if (role && !ROLE_VALID.includes(role)) {
    return `Peran harus salah satu dari: ${ROLE_VALID.join(', ')}.`
  }

  return null
}

export const adminController = {
  // GET /api/admin/users
  listUsers: async (req, res, next) => {
    try {
      const [rows] = await pool.query(`SELECT ${KOLOM_AMAN} FROM users ORDER BY id`)
      res.json({ success: true, data: rows })
    } catch (err) {
      next(err)
    }
  },

  // POST /api/admin/users
  createUser: async (req, res, next) => {
    try {
      const { nama_lengkap, username, nip, no_telepon, password, role } = req.body

      const pesanError = periksaMasukan({ nama_lengkap, username, nip, role })
      if (pesanError) {
        return res.status(400).json({ success: false, message: pesanError })
      }

      if (!password || password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password wajib diisi, minimal 6 karakter.'
        })
      }

      const usernameLower = username.toLowerCase()

      const [bentrok] = await pool.query(
        'SELECT id FROM users WHERE username = ? OR nip = ?',
        [usernameLower, String(nip).trim()]
      )
      if (bentrok.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Username atau NIP/NIS tersebut sudah dipakai akun lain!'
        })
      }

      const hashed = await bcrypt.hash(password, BCRYPT_ROUNDS)

      const [hasil] = await pool.query(
        `INSERT INTO users (nama_lengkap, username, nip, no_telepon, password, role)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          nama_lengkap.trim(),
          usernameLower,
          String(nip).trim(),
          no_telepon || '',
          hashed,
          role || 'Dokter Kecil UKS'
        ]
      )

      const [baru] = await pool.query(`SELECT ${KOLOM_AMAN} FROM users WHERE id = ?`, [hasil.insertId])

      res.status(201).json({
        success: true,
        message: `Akun ${usernameLower} berhasil dibuat.`,
        data: baru[0]
      })
    } catch (err) {
      next(err)
    }
  },

  // PUT /api/admin/users/:id
  updateUser: async (req, res, next) => {
    try {
      const id = Number(req.params.id)
      const { nama_lengkap, username, nip, no_telepon, role } = req.body

      const pesanError = periksaMasukan({ nama_lengkap, username, nip, role })
      if (pesanError) {
        return res.status(400).json({ success: false, message: pesanError })
      }

      const [target] = await pool.query('SELECT id, role FROM users WHERE id = ?', [id])
      if (target.length === 0) {
        return res.status(404).json({ success: false, message: 'Akun tidak ditemukan.' })
      }

      // Pengaman: jangan sampai admin terakhir kehilangan perannya —
      // sistem akan terkunci tanpa siapa pun yang bisa mengelolanya.
      if (target[0].role === 'Admin' && role && role !== 'Admin') {
        if ((await jumlahAdminLain(id)) === 0) {
          return res.status(400).json({
            success: false,
            message: 'Ini satu-satunya akun Admin. Angkat admin lain terlebih dahulu sebelum menurunkan perannya.'
          })
        }
      }

      const usernameLower = username.toLowerCase()

      const [bentrok] = await pool.query(
        'SELECT id FROM users WHERE (username = ? OR nip = ?) AND id != ?',
        [usernameLower, String(nip).trim(), id]
      )
      if (bentrok.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Username atau NIP/NIS tersebut sudah dipakai akun lain!'
        })
      }

      const [hasil] = await pool.query(
        `UPDATE users SET nama_lengkap = ?, username = ?, nip = ?, no_telepon = ?, role = ?
         WHERE id = ?`,
        [
          nama_lengkap.trim(),
          usernameLower,
          String(nip).trim(),
          no_telepon || '',
          role || target[0].role,
          id
        ]
      )

      if (hasil.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Akun tidak ditemukan.' })
      }

      const [terbaru] = await pool.query(`SELECT ${KOLOM_AMAN} FROM users WHERE id = ?`, [id])

      res.json({
        success: true,
        message: 'Akun berhasil diperbarui.',
        data: terbaru[0],
        // Peran ikut di dalam token yang berlaku 8 jam, jadi perubahan peran
        // baru terasa setelah orangnya login ulang.
        catatan:
          role && role !== target[0].role
            ? 'Perubahan peran baru berlaku setelah pengguna tersebut login ulang.'
            : undefined
      })
    } catch (err) {
      next(err)
    }
  },

  // PUT /api/admin/users/:id/password
  resetPassword: async (req, res, next) => {
    try {
      const id = Number(req.params.id)
      const { password } = req.body

      if (!password || password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password baru wajib diisi, minimal 6 karakter.'
        })
      }

      const hashed = await bcrypt.hash(password, BCRYPT_ROUNDS)
      const [hasil] = await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashed, id])

      if (hasil.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Akun tidak ditemukan.' })
      }

      res.json({ success: true, message: 'Password berhasil diatur ulang.' })
    } catch (err) {
      next(err)
    }
  },

  // DELETE /api/admin/users/:id
  deleteUser: async (req, res, next) => {
    try {
      const id = Number(req.params.id)

      // Pengaman: jangan menghapus akun sendiri — admin bisa mengunci
      // dirinya keluar di tengah pekerjaan.
      if (id === req.user.id) {
        return res.status(400).json({
          success: false,
          message: 'Anda tidak dapat menghapus akun Anda sendiri.'
        })
      }

      const [target] = await pool.query('SELECT id, username, role FROM users WHERE id = ?', [id])
      if (target.length === 0) {
        return res.status(404).json({ success: false, message: 'Akun tidak ditemukan.' })
      }

      // Pengaman: admin terakhir tidak boleh hilang.
      if (target[0].role === 'Admin' && (await jumlahAdminLain(id)) === 0) {
        return res.status(400).json({
          success: false,
          message: 'Ini satu-satunya akun Admin. Buat admin lain terlebih dahulu sebelum menghapusnya.'
        })
      }

      const [hasil] = await pool.query('DELETE FROM users WHERE id = ?', [id])
      if (hasil.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Akun tidak ditemukan.' })
      }

      res.json({
        success: true,
        message: `Akun ${target[0].username} berhasil dihapus. Riwayat kunjungan yang pernah dicatatnya tetap tersimpan.`
      })
    } catch (err) {
      next(err)
    }
  }
}
