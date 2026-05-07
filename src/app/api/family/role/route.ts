import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { requireUser, isAuthUser } from '@/lib/auth'
import { getMembershipForUser, rolesForKind, type FamilyRole } from '@/lib/family'

// PUT /api/family/role  body: { familyRole: FamilyRole | null }
// Set the caller's relationship within their family/couple. The allowed
// set depends on the family's kind: families pick aav/eej/...; couples
// pick husband/wife/lover. Pass null to clear the selection. Uniqueness
// within a family is enforced by the DB via UNIQUE (family_id, family_role).
export async function PUT(req: NextRequest) {
  const auth = await requireUser(req)
  if (!isAuthUser(auth)) return auth

  const m = await getMembershipForUser(auth.id)
  if (!m) {
    return NextResponse.json({ error: 'Та хэсэгт харьяалагддаггүй' }, { status: 404 })
  }

  const body = await req.json().catch(() => ({})) as { familyRole?: unknown }
  const value = body.familyRole

  let next: FamilyRole | null
  if (value === null || value === undefined || value === '') {
    next = null
  } else if (
    typeof value === 'string' &&
    (rolesForKind(m.family_kind) as string[]).includes(value)
  ) {
    next = value as FamilyRole
  } else {
    return NextResponse.json(
      { error: 'Энэ үүрэг таны хэсэгт тохирохгүй байна' },
      { status: 400 }
    )
  }

  try {
    await db.query(
      'UPDATE family_members SET family_role = ? WHERE family_id = ? AND user_id = ?',
      [next, m.family_id, auth.id]
    )
    return NextResponse.json({ familyRole: next })
  } catch (err) {
    const e = err as { code?: string; message?: string }
    if (e.code === 'ER_DUP_ENTRY') {
      return NextResponse.json(
        { error: 'Энэ үүрэг аль хэдийн сонгогдсон байна' },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: e.message ?? 'Серверийн алдаа' }, { status: 500 })
  }
}
