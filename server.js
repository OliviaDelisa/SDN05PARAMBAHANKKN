import dotenv from 'dotenv'
import app from './app.js'
import { initDatabase } from './db/initDB.js'

dotenv.config()

const PORT = process.env.PORT || 3000

// Inisialisasi schema MySQL saat server startup.
// Server TIDAK BOLEH menyala tanpa database — petugas bisa mencatat sepanjang
// pagi dan semua penyimpanan gagal tanpa peringatan apa pun.
initDatabase()
  .then((success) => {
    if (!success) {
      console.error('\n❌ GAGAL terhubung ke MySQL. Server dihentikan.')
      console.error('   Pastikan MySQL (Laragon/XAMPP) sudah aktif, lalu jalankan ulang.\n')
      process.exit(1)
    }

    console.log('🗄️  MySQL Database terhubung dan siap!')

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
  })
  .catch((err) => {
    console.error('\n❌ Database error:', err.message)
    console.error('   Server dihentikan agar data tidak hilang diam-diam.\n')
    process.exit(1)
  })
