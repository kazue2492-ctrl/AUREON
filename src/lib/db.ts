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

function poolFromDatabaseUrl(databaseUrl: string) {
  const parsed = new URL(databaseUrl)
  const sslMode = parsed.searchParams.get('ssl-mode') ?? parsed.searchParams.get('sslmode')
  const sslParam = parsed.searchParams.get('ssl')

  let ssl: mysql.ConnectionOptions['ssl'] | undefined

  if (sslParam) {
    if (sslParam === 'true') {
      ssl = { rejectUnauthorized: true }
    } else if (sslParam !== 'false') {
      try {
        ssl = JSON.parse(sslParam)
      } catch {
        ssl = { rejectUnauthorized: true }
      }
    }
  } else if (sslMode && ['REQUIRED', 'VERIFY_CA', 'VERIFY_IDENTITY'].includes(sslMode.toUpperCase())) {
    ssl = { rejectUnauthorized: true }
  }

  return mysql.createPool({
    host: parsed.hostname,
    port: parsed.port ? Number(parsed.port) : 3306,
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: decodeURIComponent(parsed.pathname.replace(/^\//, '')),
    waitForConnections: true,
    connectionLimit: 10,
    charset: 'utf8mb4',
    ssl,
  })
}

function poolFromLegacyEnv() {
  return mysql.createPool({
    host: required('DB_HOST', 'localhost'),
    port: Number(process.env.DB_PORT) || 3306,
    user: required('DB_USER', 'root'),
    password: required('DB_PASSWORD', ''),
    database: required('DB_NAME', 'wallethub'),
    waitForConnections: true,
    connectionLimit: 10,
    charset: 'utf8mb4',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: true } : undefined,
  })
}

const databaseUrl = process.env.DATABASE_URL?.trim()
const pool = databaseUrl ? poolFromDatabaseUrl(databaseUrl) : poolFromLegacyEnv()

export default pool
