/**
 * Cadangan database UKS Digital.
 *
 *   npm run backup
 *
 * Berkas hasil disimpan di folder `backups/` dengan nama bertanggal.
 * Folder itu sudah diabaikan .gitignore — isinya data kesehatan siswa dan
 * TIDAK BOLEH masuk repositori.
 *
 * Cara kerja: menulis ulang seluruh isi tabel sebagai perintah SQL biasa,
 * memakai koneksi mysql2 yang sudah ada. Tidak bergantung pada `mysqldump`
 * sehingga tetap jalan di komputer sekolah tanpa MySQL client tools.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import pool from './db.js'

dotenv.config()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const BACKUP_DIR = path.join(__dirname, '..', 'backups')

// Urutan penting: tabel induk lebih dulu supaya FOREIGN KEY tidak menolak
// saat cadangan dipulihkan.
const TABEL = ['users', 'siswa', 'kunjungan', 'pengaturan_sekolah']

/** Ubah satu nilai menjadi literal SQL yang aman. */
function keLiteral(nilai) {
  if (nilai === null || nilai === undefined) return 'NULL'
  if (typeof nilai === 'number') return String(nilai)
  if (typeof nilai === 'boolean') return nilai ? '1' : '0'
  if (nilai instanceof Date) return `'${nilai.toISOString().slice(0, 19).replace('T', ' ')}'`
  if (Buffer.isBuffer(nilai)) return `X'${nilai.toString('hex')}'`

  const teks = String(nilai)
    .split('\\')
    .join('\\\\')
    .split("'")
    .join("\\'")
    .split('\n')
    .join('\\n')
    .split('\r')
    .join('\\r')

  return `'${teks}'`
}

function stempelWaktu() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`
}

async function backup() {
  console.log('🔄 Membuat cadangan database...\n')

  try {
    fs.mkdirSync(BACKUP_DIR, { recursive: true })

    const dbName = process.env.DB_NAME || 'uks_digital'
    const baris = [
      '-- Cadangan UKS Digital',
      `-- Dibuat: ${new Date().toISOString()}`,
      `-- Database: ${dbName}`,
      '--',
      '-- PERINGATAN: berkas ini berisi DATA KESEHATAN SISWA.',
      '-- Simpan di tempat aman, jangan dibagikan, jangan masuk repositori.',
      '',
      'SET FOREIGN_KEY_CHECKS = 0;',
      'SET NAMES utf8mb4;',
      ''
    ]

    let totalBaris = 0

    for (const tabel of TABEL) {
      const [rows] = await pool.query(`SELECT * FROM \`${tabel}\``)

      baris.push(`-- Tabel: ${tabel} (${rows.length} baris)`)
      baris.push(`DELETE FROM \`${tabel}\`;`)

      if (rows.length > 0) {
        const kolom = Object.keys(rows[0])
        const daftarKolom = kolom.map((k) => `\`${k}\``).join(', ')

        for (const row of rows) {
          const nilai = kolom.map((k) => keLiteral(row[k])).join(', ')
          baris.push(`INSERT INTO \`${tabel}\` (${daftarKolom}) VALUES (${nilai});`)
        }
      }

      baris.push('')
      totalBaris += rows.length
      console.log(`  OK  ${tabel}: ${rows.length} baris`)
    }

    baris.push('SET FOREIGN_KEY_CHECKS = 1;')

    const namaBerkas = `uks_backup_${stempelWaktu()}.sql`
    const tujuan = path.join(BACKUP_DIR, namaBerkas)
    fs.writeFileSync(tujuan, baris.join('\n'), 'utf8')

    const ukuranKb = (fs.statSync(tujuan).size / 1024).toFixed(1)
    console.log(`\nCadangan tersimpan: backups/${namaBerkas} (${ukuranKb} KB, ${totalBaris} baris)`)
    console.log('Salin berkas ini ke penyimpanan terpisah — flashdisk atau drive cadangan.')
  } catch (err) {
    console.error('\nGagal membuat cadangan:', err.message)
    process.exitCode = 1
  } finally {
    await pool.end()
  }
}

backup()
