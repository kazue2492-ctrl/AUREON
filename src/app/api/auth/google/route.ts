import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import db from '@/lib/db'
import { signToken } from '@/lib/auth'
import { newId } from '@/lib/ids'

interface GoogleTokenInfo {
  iss?: string
  aud?: string
  sub?: string
  email?: string
  email_verified?: string | boolean
  name?: string
  given_name?: string
  family_name?: string
  picture?: string
  exp?: string
  error?: string
  error_description?: string
}

const VALID_ISSUERS = new Set(['accounts.google.com', 'https://accounts.google.com'])

async function verifyGoogleIdToken(idToken: string): Promise<GoogleTokenInfo | null> {
  const url = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
  const res = await fetch(url)
  if (!res.ok) return null
  const info = (await res.json()) as GoogleTokenInfo
  if (info.error) return null
  return info
}

export async function POST(req: NextRequest) {
  try {
    const { credential } = await req.json()
    if (!credential || typeof credential !== 'string') {
      return NextResponse.json({ error: 'credential шаардлагатай' }, { status: 400 })
    }

    const expectedAud = process.env.GOOGLE_CLIENT_ID
    if (!expectedAud) {
      return NextResponse.json(
        { error: 'GOOGLE_CLIENT_ID тохируулаагүй байна. .env.local-д нэмнэ үү.' },
        { status: 500 },
      )
    }

    const info = await verifyGoogleIdToken(credential)
    if (!info || !info.sub || !info.email) {
      return NextResponse.json({ error: 'Google токен буруу байна' }, { status: 401 })
    }
    if (!info.iss || !VALID_ISSUERS.has(info.iss)) {
      return NextResponse.json({ error: 'Google токенын эх үүсвэр буруу' }, { status: 401 })
    }
    if (info.aud !== expectedAud) {
      return NextResponse.json({ error: 'Google client ID таарахгүй байна' }, { status: 401 })
    }
    if (info.email_verified !== true && info.email_verified !== 'true') {
      return NextResponse.json({ error: 'Google и-мэйл баталгаажаагүй' }, { status: 401 })
    }
    if (info.exp && Number(info.exp) * 1000 < Date.now()) {
      return NextResponse.json({ error: 'Google токены хугацаа дууссан' }, { status: 401 })
    }

    const normalizedEmail = info.email.trim().toLowerCase()
    const displayName =
      info.name ||
      [info.given_name, info.family_name].filter(Boolean).join(' ').trim() ||
      normalizedEmail.split('@')[0]

    const [rows] = await db.query(
      `SELECT id, email, name, subscription_status, subscription_expires_at,
              setup_completed, relationship_status, age, gender
         FROM users WHERE email = ? LIMIT 1`,
      [normalizedEmail],
    ) as [Array<{
      id: string; email: string; name: string;
      subscription_status: 'active' | 'expired' | 'none';
      subscription_expires_at: Date | string | null;
      setup_completed: number;
      relationship_status: 'individual' | 'couple' | 'family' | 'student' | null;
      age: number | null;
      gender: 'male' | 'female' | null;
    }>, unknown]

    let user: {
      id: string; email: string; name: string;
      subscription_status: 'active' | 'expired' | 'none';
      subscription_expires_at: Date | string | null;
      setup_completed: number;
      relationship_status: 'individual' | 'couple' | 'family' | 'student' | null;
      age: number | null;
      gender: 'male' | 'female' | null;
    }

    if (rows.length === 0) {
      const id = newId()
      const placeholderHash = await bcrypt.hash(`google:${info.sub}:${Date.now()}`, 10)
      await db.query(
        `INSERT INTO users (id, email, password_hash, name)
         VALUES (?, ?, ?, ?)`,
        [id, normalizedEmail, placeholderHash, displayName],
      )
      user = {
        id,
        email: normalizedEmail,
        name: displayName,
        subscription_status: 'none',
        subscription_expires_at: null,
        setup_completed: 0,
        relationship_status: null,
        age: null,
        gender: null,
      }
    } else {
      user = rows[0]
    }

    const token = signToken({ sub: user.id, email: user.email })
    const expiresAt = user.subscription_expires_at instanceof Date
      ? user.subscription_expires_at.toISOString()
      : user.subscription_expires_at

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        subscriptionStatus: user.subscription_status,
        subscriptionExpiresAt: expiresAt,
        setupCompleted: Boolean(user.setup_completed),
        relationshipStatus: user.relationship_status,
        age: user.age,
        gender: user.gender,
      },
    })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
