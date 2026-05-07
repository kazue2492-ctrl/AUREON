import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { requireUser, isAuthUser } from '@/lib/auth'
import {
  getMembershipForUser,
  isOwnerSubscriptionActive,
  listFamilyMembers,
  maxMembersForKind,
  type FamilyKind,
} from '@/lib/family'
import { newId } from '@/lib/ids'

// GET /api/family — current user's family (or null if not in one).
// `kind` is 'family' or 'couple' depending on how it was created.
export async function GET(req: NextRequest) {
  const auth = await requireUser(req)
  if (!isAuthUser(auth)) return auth

  const m = await getMembershipForUser(auth.id)
  if (!m) return NextResponse.json({ family: null })

  const members = await listFamilyMembers(m.family_id)
  return NextResponse.json({
    family: {
      id: m.family_id,
      name: m.family_name,
      kind: m.family_kind,
      ownerId: m.owner_id,
      myRole: m.role,
      myFamilyRole: m.family_role ?? null,
      maxMembers: maxMembersForKind(m.family_kind),
      ownerSubscriptionActive: isOwnerSubscriptionActive(m),
    },
    members,
  })
}

// POST /api/family — create a family OR a couple. The kind is derived
// from the caller's relationship_status: 'family' → family (4 members),
// 'couple' → couple (2 members). Other statuses are rejected.
export async function POST(req: NextRequest) {
  const auth = await requireUser(req)
  if (!isAuthUser(auth)) return auth

  if (auth.subscriptionStatus !== 'active') {
    return NextResponse.json(
      { error: 'Үүсгэхийн тулд идэвхтэй subscription шаардлагатай' },
      { status: 402 }
    )
  }

  const [statusRows] = await db.query(
    'SELECT relationship_status FROM users WHERE id = ? LIMIT 1',
    [auth.id]
  ) as [Array<{ relationship_status: string }>, unknown]
  const relationship = statusRows[0]?.relationship_status

  let kind: FamilyKind
  if (relationship === 'family') kind = 'family'
  else if (relationship === 'couple') kind = 'couple'
  else {
    return NextResponse.json(
      { error: 'Гэр бүл/Хос хэсэг зөвхөн "Гэр бүл" эсвэл "Хос" бүртгэлтэй хэрэглэгчдэд зориулагдсан' },
      { status: 403 }
    )
  }

  const existing = await getMembershipForUser(auth.id)
  if (existing) {
    return NextResponse.json(
      { error: 'Та аль хэдийн нэг хэсэгт харьяалагдаж байна' },
      { status: 409 }
    )
  }

  let body: { name?: string } = {}
  try { body = await req.json() } catch { /* allow empty */ }
  const fallbackName = kind === 'couple' ? `${auth.name}-н хос` : `${auth.name}-н гэр бүл`
  const name = (body.name || fallbackName).slice(0, 255)

  const conn = await db.getConnection()
  try {
    await conn.beginTransaction()
    const familyId = newId()
    await conn.query(
      'INSERT INTO families (id, owner_id, name, kind) VALUES (?, ?, ?, ?)',
      [familyId, auth.id, name, kind]
    )
    await conn.query(
      `INSERT INTO family_members (id, family_id, user_id, role) VALUES (?, ?, ?, 'owner')`,
      [newId(), familyId, auth.id]
    )
    await conn.commit()
    return NextResponse.json({
      family: {
        id: familyId,
        name,
        kind,
        ownerId: auth.id,
        myRole: 'owner',
        myFamilyRole: null,
        maxMembers: maxMembersForKind(kind),
        ownerSubscriptionActive: true,
      },
    }, { status: 201 })
  } catch (err) {
    await conn.rollback()
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  } finally {
    conn.release()
  }
}

// DELETE /api/family — disband family/couple (owner only). Members keep their data.
export async function DELETE(req: NextRequest) {
  const auth = await requireUser(req)
  if (!isAuthUser(auth)) return auth

  const m = await getMembershipForUser(auth.id)
  if (!m) return NextResponse.json({ error: 'Хэсэг байхгүй' }, { status: 404 })
  if (m.role !== 'owner') {
    return NextResponse.json({ error: 'Зөвхөн owner тараах эрхтэй' }, { status: 403 })
  }

  // ON DELETE CASCADE handles family_members and family_invitations
  await db.query('DELETE FROM families WHERE id = ?', [m.family_id])
  return NextResponse.json({ success: true })
}
