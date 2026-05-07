import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { requireUser, isAuthUser } from '@/lib/auth'
import {
  getMembershipForUser,
  countFamilyMembers,
  maxMembersForKind,
  INVITATION_TTL_DAYS,
} from '@/lib/family'
import { newId } from '@/lib/ids'

// POST /api/family/invite — owner invites someone by email
export async function POST(req: NextRequest) {
  const auth = await requireUser(req)
  if (!isAuthUser(auth)) return auth

  if (auth.subscriptionStatus !== 'active') {
    return NextResponse.json(
      { error: 'Гишүүн нэмэхийн тулд идэвхтэй subscription шаардлагатай' },
      { status: 402 }
    )
  }

  const m = await getMembershipForUser(auth.id)
  if (!m) return NextResponse.json({ error: 'Гэр бүл байхгүй' }, { status: 404 })
  if (m.role !== 'owner') {
    return NextResponse.json({ error: 'Зөвхөн owner гишүүн нэмж болно' }, { status: 403 })
  }

  const { email } = await req.json().catch(() => ({}))
  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'email шаардлагатай' }, { status: 400 })
  }
  const target = email.trim().toLowerCase()
  if (target === auth.email.toLowerCase()) {
    return NextResponse.json({ error: 'Өөрийгөө урих боломжгүй' }, { status: 400 })
  }

  const memberCount = await countFamilyMembers(m.family_id)
  const limit = maxMembersForKind(m.family_kind)
  if (memberCount >= limit) {
    return NextResponse.json(
      { error: `${limit} гишүүний хязгаарт хүрсэн байна` },
      { status: 409 }
    )
  }

  // If invited user already exists and is in any family — reject
  const [userRows] = await db.query(
    `SELECT u.id, fm.family_id
       FROM users u
       LEFT JOIN family_members fm ON fm.user_id = u.id
      WHERE u.email = ? LIMIT 1`,
    [target]
  ) as [Array<{ id: string; family_id: string | null }>, unknown]

  if (userRows.length > 0 && userRows[0].family_id) {
    return NextResponse.json(
      { error: 'Энэ хэрэглэгч өөр гэр бүлд харьяалагдаж байна' },
      { status: 409 }
    )
  }

  // Reject if a pending invite already exists for the same email + family
  const [invRows] = await db.query(
    `SELECT id FROM family_invitations
      WHERE family_id = ? AND invited_email = ? AND status = 'pending'
      LIMIT 1`,
    [m.family_id, target]
  ) as [Array<{ id: string }>, unknown]

  if (invRows.length > 0) {
    return NextResponse.json({ error: 'Энэ и-мэйл рүү аль хэдийн урилга илгээсэн байна' }, { status: 409 })
  }

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + INVITATION_TTL_DAYS)

  const id = newId()
  await db.query(
    `INSERT INTO family_invitations (id, family_id, invited_email, invited_by, expires_at)
     VALUES (?, ?, ?, ?, ?)`,
    [id, m.family_id, target, auth.id, expiresAt]
  )

  // Notify invitee in-app if they have an account
  if (userRows.length > 0) {
    await db.query(
      `INSERT INTO notifications (id, user_id, title, message, type, is_read, created_at)
       VALUES (?, ?, ?, ?, 'info', 0, CURDATE())`,
      [
        newId(),
        userRows[0].id,
        'Гэр бүлийн урилга',
        `${auth.name} танд гэр бүлийн урилга илгээлээ. Гэр бүл хэсгээс хариулна уу.`,
      ]
    )
  }

  return NextResponse.json({
    invitation: {
      id,
      familyId: m.family_id,
      invitedEmail: target,
      status: 'pending',
      expiresAt: expiresAt.toISOString(),
      registeredUser: userRows.length > 0,
    },
  }, { status: 201 })
}
