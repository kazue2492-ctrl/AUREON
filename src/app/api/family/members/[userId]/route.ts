import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { requireUser, isAuthUser } from '@/lib/auth'
import { getMembershipForUser } from '@/lib/family'

// DELETE /api/family/members/[userId]
//   - owner can remove any member (except themselves; use disband instead)
//   - a member can remove themselves (i.e. leave)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const auth = await requireUser(req)
  if (!isAuthUser(auth)) return auth

  const { userId: targetUserId } = await params

  const myMembership = await getMembershipForUser(auth.id)
  if (!myMembership) return NextResponse.json({ error: 'Гэр бүл байхгүй' }, { status: 404 })

  // Caller is leaving themselves
  if (targetUserId === auth.id) {
    if (myMembership.role === 'owner') {
      return NextResponse.json(
        { error: 'Owner гарах боломжгүй. Гэр бүлийг тарааж болно.' },
        { status: 400 }
      )
    }
    await db.query(
      'DELETE FROM family_members WHERE family_id = ? AND user_id = ?',
      [myMembership.family_id, auth.id]
    )
    return NextResponse.json({ success: true })
  }

  // Caller is removing someone else — must be owner
  if (myMembership.role !== 'owner') {
    return NextResponse.json({ error: 'Зөвхөн owner гишүүн хасаж болно' }, { status: 403 })
  }

  // Target must be in the same family
  const [rows] = await db.query(
    `SELECT role FROM family_members WHERE family_id = ? AND user_id = ? LIMIT 1`,
    [myMembership.family_id, targetUserId]
  ) as [Array<{ role: 'owner' | 'member' }>, unknown]

  if (rows.length === 0) {
    return NextResponse.json({ error: 'Гишүүн олдсонгүй' }, { status: 404 })
  }
  if (rows[0].role === 'owner') {
    return NextResponse.json({ error: 'Owner-г хасах боломжгүй' }, { status: 400 })
  }

  await db.query(
    'DELETE FROM family_members WHERE family_id = ? AND user_id = ?',
    [myMembership.family_id, targetUserId]
  )
  return NextResponse.json({ success: true })
}
