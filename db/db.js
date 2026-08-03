import mysql from 'mysql2/promise'
import dotenv from 'dotenv'

dotenv.config()

let host = process.env.DB_HOST || 'localhost'
let port = parseInt(process.env.DB_PORT || '3306', 10)

if (host.includes(':')) {
  const parts = host.split(':')
  host = parts[0]
  port = parseInt(parts[1], 10) || 3306
}

const pool = mysql.createPool({
  host,
  port,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'uks_digital',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
})

export default pool
