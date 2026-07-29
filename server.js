import dotenv from 'dotenv'
import app from './app.js'
import { initDatabase } from './db/initDB.js'

dotenv.config()

const PORT = process.env.PORT || 3000

// Initialize DB schema asynchronously
initDatabase().catch((err) => {
  console.warn('DB Init notice:', err.message)
})

app.listen(PORT, () => {
  console.log(`
  🏥 ========================================================
  UKS Digital Server Running!
  --------------------------------------------------------
  Server URL : http://localhost:${PORT}
  API Health : http://localhost:${PORT}/api/health
  ========================================================
  `)
})
