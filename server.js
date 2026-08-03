import dotenv from 'dotenv'
import app from './app.js'
import { initDatabase } from './db/initDB.js'

dotenv.config()

const PORT = process.env.PORT || 3000

// Inisialisasi schema MySQL saat server startup
initDatabase()
  .then((success) => {
    if (success) {
      console.log('🗄️  MySQL Database terhubung dan siap!')
    } else {
      console.warn('⚠️  Gagal terhubung ke MySQL. Pastikan MySQL Laragon/XAMPP sudah aktif.')
    }
  })
  .catch((err) => {
    console.error('Database error:', err.message)
  })

app.listen(PORT, () => {
  console.log(`
  🏥 ========================================================
  UKS Digital Server Running!
  --------------------------------------------------------
  Server URL : http://localhost:${PORT}
  API Health : http://localhost:${PORT}/api/health
  DB Host    : ${process.env.DB_HOST || '127.0.0.1'}:${process.env.DB_PORT || 3306}
  DB Name    : ${process.env.DB_NAME || 'uks_digital'}
  ========================================================
  `)
})
