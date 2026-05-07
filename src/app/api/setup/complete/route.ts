import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { requireUser, isAuthUser } from '@/lib/auth'

// POST /api/setup/complete
// Marks the current user's onboarding as done and (optionally) updates
// age/gender/relationshipStatus in one shot.
export async function POST(req: NextRequest) {
  const auth = await requireUser(req)
  if (!isAuthUser(auth)) return auth

  let body: {
    age?: number | string | null
    gender?: 'male' | 'female' | null
    relationshipStatus?: 'individual' | 'couple' | 'family' | 'student' | null
  } = {}
  try { body = await req.json() } catch { /* allow empty */ }

  const ageNum = body.age == null || body.age === '' ? null : Number(body.age)

  await db.query(
    `UPDATE users
        SET setup_completed = 1,
            age = COALESCE(?, age),
            gender = COALESCE(?, gender),
            relationship_status = COALESCE(?, relationship_status)
      WHERE id = ?`,
    [
      ageNum,
      body.gender ?? null,
      body.relationshipStatus ?? null,
      auth.id,
    ]
  )

  return NextResponse.json({ setupCompleted: true })
}
