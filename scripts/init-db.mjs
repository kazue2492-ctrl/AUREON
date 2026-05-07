import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import mysql from 'mysql2/promise'

const __dirname = dirname(fileURLToPath(import.meta.url))

function loadDotEnvLocal() {
  try {
    const envPath = resolve(__dirname, '..', '.env.local')
    const text = readFileSync(envPath, 'utf8')
    for (const raw of text.split(/\r?\n/)) {
      const line = raw.trim()
      if (!line || line.startsWith('#')) continue
      const eq = line.indexOf('=')
      if (eq === -1) continue
      const key = line.slice(0, eq).trim()
      let val = line.slice(eq + 1).trim()
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1)
      }
      if (!(key in process.env)) process.env[key] = val
    }
  } catch {}
}

loadDotEnvLocal()

function buildConfigFromUrl(url) {
  const u = new URL(url)
  const sslMode = u.searchParams.get('ssl-mode') ?? u.searchParams.get('sslmode')
  const allowInsecure = process.env.DB_SSL_REJECT_UNAUTHORIZED === 'false'
  const ssl =
    sslMode && ['REQUIRED', 'VERIFY_CA', 'VERIFY_IDENTITY'].includes(sslMode.toUpperCase())
      ? { rejectUnauthorized: !allowInsecure }
      : undefined
  return {
    host: u.hostname,
    port: u.port ? Number(u.port) : 3306,
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    database: decodeURIComponent(u.pathname.replace(/^\//, '')),
    ssl,
    multipleStatements: true,
    charset: 'utf8mb4',
  }
}

function buildConfigFromLegacy() {
  return {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: true } : undefined,
    multipleStatements: true,
    charset: 'utf8mb4',
  }
}

const config = process.env.DATABASE_URL
  ? buildConfigFromUrl(process.env.DATABASE_URL)
  : buildConfigFromLegacy()

if (!config.host || !config.user || !config.database) {
  console.error('DATABASE_URL or DB_HOST/DB_USER/DB_NAME must be set')
  process.exit(1)
}

const schemaPath = resolve(__dirname, '..', 'db', 'schema.sql')
const sql = readFileSync(schemaPath, 'utf8')

console.log(`→ Connecting to ${config.user}@${config.host}:${config.port}/${config.database}`)

const conn = await mysql.createConnection(config)
try {
  await conn.query("SET SESSION sql_mode = 'NO_ENGINE_SUBSTITUTION'")
  await conn.query(sql)
  console.log('✓ Schema applied')

  const [tables] = await conn.query('SHOW TABLES')
  console.log(`✓ Tables in ${config.database}:`)
  for (const row of tables) console.log('  -', Object.values(row)[0])
} finally {
  await conn.end()
}
