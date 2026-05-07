import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import db from './db'

const isProd = process.env.NODE_ENV === 'production'

function resolveJwtSecret(): string {
  const v = process.env.JWT_SECRET
  if (v && v.length >= 32) return v
  if (isProd) {
    throw new Error('JWT_SECRET must be set to a string of at least 32 characters in production')
  }
  return v && v.length > 0 ? v : 'dev-only-insecure-secret-do-not-use-in-prod'
}

const JWT_SECRET = resolveJwtSecret()
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

export interface AuthUser {
  id: string
  email: string
  name: string
  subscriptionStatus: 'active' | 'expired' | 'none'
  subscriptionExpiresAt: string | null
  setupCompleted: boolean
}

export interface JwtPayload {
  sub: string
  email: string
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions)
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload
  } catch {
    return null
  }
}

function bearerFromHeader(req: NextRequest): string | null {
  const h = req.headers.get('authorization') || req.headers.get('Authorization')
  if (!h) return null
  const m = h.match(/^Bearer\s+(.+)$/i)
  return m ? m[1].trim() : null
}

export async function requireUser(req: NextRequest): Promise<AuthUser | NextResponse> {
  const token = bearerFromHeader(req)
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const payload = verifyToken(token)
  if (!payload) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })

  const [rows] = await db.query(
    `SELECT id, email, name, subscription_status, subscription_expires_at, setup_completed
       FROM users WHERE id = ? LIMIT 1`,
    [payload.sub]
  ) as [Array<{
    id: string; email: string; name: string;
    subscription_status: 'active' | 'expired' | 'none';
    subscription_expires_at: Date | string | null;
    setup_completed: number;
  }>, unknown]

  if (rows.length === 0) {
    return NextResponse.json({ error: 'User not found' }, { status: 401 })
  }

  const r = rows[0]
  const expiresAt = r.subscription_expires_at instanceof Date
    ? r.subscription_expires_at.toISOString()
    : r.subscription_expires_at

  // Auto-expire subscription if past due
  let status = r.subscription_status
  if (status === 'active' && expiresAt && new Date(expiresAt) < new Date()) {
    status = 'expired'
    await db.query('UPDATE users SET subscription_status = ? WHERE id = ?', ['expired', r.id])
  }

  return {
    id: r.id,
    email: r.email,
    name: r.name,
    subscriptionStatus: status,
    subscriptionExpiresAt: expiresAt,
    setupCompleted: Boolean(r.setup_completed),
  }
}

export function isAuthUser(x: AuthUser | NextResponse): x is AuthUser {
  return !(x instanceof NextResponse)
}
