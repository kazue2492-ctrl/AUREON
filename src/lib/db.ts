import mysql from 'mysql2/promise'

const isProd = process.env.NODE_ENV === 'production'

function required(name: string, fallback?: string): string {
  const v = process.env[name]
  if (v && v.length > 0) return v
  if (isProd) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return fallback ?? ''
}

const pool = mysql.createPool({
  host:     required('DB_HOST', 'localhost'),
  port:     Number(process.env.DB_PORT) || 3306,
  user:     required('DB_USER', 'root'),
  password: required('DB_PASSWORD', ''),
  database: required('DB_NAME', 'wallethub'),
  waitForConnections: true,
  connectionLimit: 10,
  charset: 'utf8mb4',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: true } : undefined,
})

export default pool
