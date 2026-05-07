import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { requireUser, isAuthUser } from '@/lib/auth'

const DEFAULT_AVATAR = '/images/default-avatar.png'

export async function GET(req: NextRequest) {
  const auth = await requireUser(req)
  if (!isAuthUser(auth)) return auth

  const [rows] = await db.query(
    `SELECT id, email, name, avatar, age, gender, currency, dark_mode, relationship_status,
            subscription_status, subscription_expires_at, setup_completed
       FROM users WHERE id = ? LIMIT 1`,
    [auth.id]
  ) as [Array<Record<string, unknown>>, unknown]

  if (rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const r = rows[0]

  return NextResponse.json({
    id: r.id,
    email: r.email,
    name: r.name,
    avatar: (r.avatar as string | null) || DEFAULT_AVATAR,
    age: r.age ?? null,
    gender: r.gender ?? null,
    currency: r.currency,
    darkMode: Boolean(r.dark_mode),
    relationshipStatus: r.relationship_status,
    subscriptionStatus: r.subscription_status,
    subscriptionExpiresAt: r.subscription_expires_at instanceof Date
      ? r.subscription_expires_at.toISOString()
      : r.subscription_expires_at,
    setupCompleted: Boolean(r.setup_completed),
  })
}
