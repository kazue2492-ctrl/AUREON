import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import db from '@/lib/db'
import { signToken } from '@/lib/auth'
import { newId } from '@/lib/ids'

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json()

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'email, password, name шаардлагатай' }, { status: 400 })
    }
    if (typeof password !== 'string' || password.length < 6) {
      return NextResponse.json({ error: 'Нууц үг хамгийн багадаа 6 тэмдэгт байна' }, { status: 400 })
    }

    const normalizedEmail = String(email).trim().toLowerCase()

    const [existing] = await db.query(
      'SELECT id FROM users WHERE email = ? LIMIT 1',
      [normalizedEmail]
    ) as [Array<{ id: string }>, unknown]

    if (existing.length > 0) {
      return NextResponse.json({ error: 'Энэ и-мэйлээр аль хэдийн бүртгүүлсэн байна' }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const id = newId()

    await db.query(
      `INSERT INTO users (id, email, password_hash, name)
       VALUES (?, ?, ?, ?)`,
      [id, normalizedEmail, passwordHash, name]
    )

    const token = signToken({ sub: id, email: normalizedEmail })

    return NextResponse.json({
      token,
      user: {
        id, email: normalizedEmail, name,
        subscriptionStatus: 'none',
        subscriptionExpiresAt: null,
        setupCompleted: false,
      },
    }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
