import express from 'express'
import cors from 'cors'
import morgan from 'morgan'

import siswaRoutes from './routes/siswaRoutes.js'
import kunjunganRoutes from './routes/kunjunganRoutes.js'
import laporanRoutes from './routes/laporanRoutes.js'
import pengaturanRoutes from './routes/pengaturanRoutes.js'

const app = express()

// Middleware
app.use(cors())
app.use(morgan('dev'))
app.use(express.json())

// Root URL handler (friendly info page for browser visitors)
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <title>UKS Digital API Server</title>
      <style>
        body { font-family: system-ui, sans-serif; background: #0B1426; color: #fff; display: flex; items-center: center; justify-content: center; min-height: 100vh; margin: 0; }
        .card { background: #111D35; border: 1px solid #1B2A4A; border-radius: 12px; padding: 32px; max-width: 480px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.3); }
        h1 { color: #10B981; font-size: 24px; margin-top: 0; }
        p { color: #94A3B8; font-size: 14px; line-height: 1.6; }
        .btn { display: inline-block; background: #059669; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; margin-top: 16px; }
        .btn:hover { background: #10B981; }
        .code { background: #0B1426; padding: 8px 12px; border-radius: 6px; font-family: monospace; font-size: 12px; color: #34D399; margin-top: 12px; display: inline-block; }
      </style>
    </head>
    <body>
      <div class="card">
        <h1>🏥 UKS Digital API Server Active</h1>
        <p>Ini adalah server backend API (Port 3000) untuk SDN 05 Parambahan. Untuk membuka antarmuka aplikasi utama (UI), buka tautan di bawah ini:</p>
        <a href="http://localhost:5173" class="btn">🚀 Buka Aplikasi UKS Digital (Port 5173)</a>
        <br/><br/>
        <div class="code">API Health Check: /api/health</div>
      </div>
    </body>
    </html>
  `)
})

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'UKS Digital — SDN 05 Parambahan',
    timestamp: new Date().toISOString()
  })
})

// Mount API Routes
app.use('/api/siswa', siswaRoutes)
app.use('/api/kunjungan', kunjunganRoutes)
app.use('/api/laporan', laporanRoutes)
app.use('/api/pengaturan', pengaturanRoutes)

// 404 Handler for unmatched routes
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint tidak ditemukan' })
})

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err)
  res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' })
})

export default app
