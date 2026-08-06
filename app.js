import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import dotenv from 'dotenv'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

// Routes
import authRoutes from './routes/authRoutes.js'
import siswaRoutes from './routes/siswaRoutes.js'
import kunjunganRoutes from './routes/kunjunganRoutes.js'
import pengaturanRoutes from './routes/pengaturanRoutes.js'
import adminRoutes from './routes/adminRoutes.js'
import { errorHandler } from './middleware.js'

dotenv.config()

const app = express()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DIST_DIR = path.join(__dirname, 'frontend', 'dist')
const ADA_BUILD = fs.existsSync(path.join(DIST_DIR, 'index.html'))

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'

// Middleware
// CORS dibatasi ke alamat frontend saja. Tanpa batasan, situs mana pun bisa
// memanggil API ini dari browser petugas yang sedang login.
// Saat menyajikan hasil build, frontend dan API berada di origin yang sama
// sehingga permintaan tanpa header Origin juga perlu diizinkan.
app.use(cors({ origin: ADA_BUILD ? true : FRONTEND_URL, credentials: true }))
app.use(morgan('dev'))
app.use(express.json())

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'OK',
    message: 'UKS Digital Backend Server API is Active and Connected',
    mode: ADA_BUILD ? 'produksi (satu port)' : 'pengembangan (dua server)',
    timestamp: new Date().toISOString()
  })
})

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/siswa', siswaRoutes)
app.use('/api/kunjungan', kunjunganRoutes)
app.use('/api/pengaturan', pengaturanRoutes)
app.use('/api/admin', adminRoutes)

// 404 khusus API — didaftarkan sebelum penyajian berkas statis supaya
// endpoint yang salah tidak balas halaman HTML.
app.use('/api', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Endpoint ${req.originalUrl} tidak ditemukan.`
  })
})

if (ADA_BUILD) {
  // Mode produksi: seluruh aplikasi berjalan di satu port.
  // Jalankan `npm run build` lebih dulu untuk membuat frontend/dist.
  app.use(express.static(DIST_DIR))

  // React Router menangani rute di sisi klien, jadi semua permintaan non-API
  // dikembalikan ke index.html. Tanpa ini, memuat ulang di /riwayat → 404.
  app.get(/.*/, (req, res) => {
    res.sendFile(path.join(DIST_DIR, 'index.html'))
  })
} else {
  // Mode pengembangan: frontend dijalankan terpisah oleh Vite.
  app.get('/', (req, res) => {
    res.redirect(`${FRONTEND_URL}/login`)
  })

  app.use((req, res) => {
    res.status(404).send(
      'Frontend belum di-build. Jalankan "npm run build" untuk mode satu port, ' +
        `atau buka ${FRONTEND_URL} saat mode pengembangan.`
    )
  })
}

// Penangkap error terpusat — HARUS di baris paling akhir, setelah semua route.
app.use(errorHandler)

export default app
