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
  const sslParam = parsed.searchParams.get('ssl')
  const allowInsecure = process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'true'
  const rejectUnauthorized = !allowInsecure

  let ssl: mysql.ConnectionOptions['ssl'] = { rejectUnauthorized: false }

  if (sslParam && sslParam !== 'true' && sslParam !== 'false') {
    try {
      ssl = JSON.parse(sslParam)
    } catch {
      ssl = { rejectUnauthorized }
    }
  } else if (sslParam === 'true') {
    ssl = { rejectUnauthorized }
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
    ssl: {
      rejectUnauthorized: false,
    },
  })
}

const databaseUrl = process.env.DATABASE_URL?.trim()
const pool = databaseUrl ? poolFromDatabaseUrl(databaseUrl) : poolFromLegacyEnv()

export default pool
