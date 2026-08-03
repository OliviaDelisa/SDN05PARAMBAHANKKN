import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import dotenv from 'dotenv'

// Routes
import authRoutes from './routes/authRoutes.js'
import siswaRoutes from './routes/siswaRoutes.js'
import kunjunganRoutes from './routes/kunjunganRoutes.js'
import laporanRoutes from './routes/laporanRoutes.js'
import pengaturanRoutes from './routes/pengaturanRoutes.js'

dotenv.config()

const app = express()

// Middleware
app.use(cors())
app.use(morgan('dev'))
app.use(express.json())

// Root URL handler (Redirects directly to Frontend Login page)
app.get('/', (req, res) => {
  res.redirect('http://localhost:5173/login')
})

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'OK',
    message: 'UKS Digital Backend Server API is Active and Connected',
    timestamp: new Date().toISOString()
  })
})

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/siswa', siswaRoutes)
app.use('/api/kunjungan', kunjunganRoutes)
app.use('/api/laporan', laporanRoutes)
app.use('/api/pengaturan', pengaturanRoutes)

// 404 Handler for undefined API routes
app.use((req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    return res.status(404).json({
      success: false,
      message: `Endpoint ${req.originalUrl} tidak ditemukan.`
    })
  }
  res.status(404).send('Not Found')
})

export default app
