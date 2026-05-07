import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { requireUser, isAuthUser } from '@/lib/auth'

const DEFAULT_AVATAR = '/images/default-avatar.png'

export async function GET(req: NextRequest) {
  const auth = await requireUser(req)
  if (!isAuthUser(auth)) return auth

  try {
    const [rows] = await db.query(
      `SELECT name, email, avatar, age, gender, currency, dark_mode, relationship_status,
              subscription_status, subscription_expires_at
         FROM users WHERE id = ? LIMIT 1`,
      [auth.id]
    ) as [Record<string, unknown>[], unknown]

    if (rows.length === 0) return NextResponse.json(null)
    const r = rows[0]
    return NextResponse.json({
      name: r.name,
      email: r.email,
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
    })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requireUser(req)
  if (!isAuthUser(auth)) return auth

  try {
    const body = await req.json() as {
      name?: unknown; avatar?: unknown; age?: unknown; gender?: unknown;
      currency?: unknown; darkMode?: unknown; relationshipStatus?: unknown;
    }
    // Treat omitted/empty fields as "no change" — partial PUTs from the
    // Profile page must NOT wipe out values set during register/setup
    // (esp. age/gender, which Profile no longer edits).
    const cleanName     = typeof body.name     === 'string' && body.name.trim()     ? body.name.trim()     : null
    const cleanCurrency = typeof body.currency === 'string' && body.currency.trim() ? body.currency.trim() : null
    const cleanStatus   = typeof body.relationshipStatus === 'string' && body.relationshipStatus.trim()
      ? body.relationshipStatus.trim()
      : null
    const cleanAvatar   = typeof body.avatar === 'string' && body.avatar.trim() ? body.avatar : null
    const ageNum = body.age == null || body.age === '' ? null : Number(body.age)
    const cleanAge      = Number.isFinite(ageNum) ? ageNum : null
    const cleanGender   = body.gender === 'male' || body.gender === 'female' ? body.gender : null
    const cleanDarkMode = typeof body.darkMode === 'boolean' ? (body.darkMode ? 1 : 0) : null

    // email immutable here — change via dedicated endpoint
    await db.query(
      `UPDATE users
          SET name=COALESCE(?, name),
              avatar=COALESCE(?, avatar),
              age=COALESCE(?, age),
              gender=COALESCE(?, gender),
              currency=COALESCE(?, currency),
              dark_mode=COALESCE(?, dark_mode),
              relationship_status=COALESCE(?, relationship_status)
        WHERE id=?`,
      [
        cleanName,
        cleanAvatar,
        cleanAge,
        cleanGender,
        cleanCurrency,
        cleanDarkMode,
        cleanStatus,
        auth.id,
      ]
    )
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
