import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import db from '@/lib/db'
import { signToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'email, password шаардлагатай' }, { status: 400 })
    }

    const normalizedEmail = String(email).trim().toLowerCase()

    const [rows] = await db.query(
      `SELECT id, email, name, password_hash, subscription_status, subscription_expires_at,
              setup_completed, relationship_status, age, gender
         FROM users WHERE email = ? LIMIT 1`,
      [normalizedEmail]
    ) as [Array<{
      id: string; email: string; name: string; password_hash: string;
      subscription_status: 'active' | 'expired' | 'none';
      subscription_expires_at: Date | string | null;
      setup_completed: number;
      relationship_status: 'individual' | 'couple' | 'family' | 'student' | null;
      age: number | null;
      gender: 'male' | 'female' | null;
    }>, unknown]

    if (rows.length === 0) {
      return NextResponse.json({ error: 'И-мэйл эсвэл нууц үг буруу байна' }, { status: 401 })
    }

    const u = rows[0]
    const ok = await bcrypt.compare(password, u.password_hash)
    if (!ok) {
      return NextResponse.json({ error: 'И-мэйл эсвэл нууц үг буруу байна' }, { status: 401 })
    }

    const token = signToken({ sub: u.id, email: u.email })
    const expiresAt = u.subscription_expires_at instanceof Date
      ? u.subscription_expires_at.toISOString()
      : u.subscription_expires_at

    return NextResponse.json({
      token,
      user: {
        id: u.id, email: u.email, name: u.name,
        subscriptionStatus: u.subscription_status,
        subscriptionExpiresAt: expiresAt,
        setupCompleted: Boolean(u.setup_completed),
        relationshipStatus: u.relationship_status,
        age: u.age,
        gender: u.gender,
      },
    })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
