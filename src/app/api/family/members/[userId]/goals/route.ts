import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { requireUser, isAuthUser } from '@/lib/auth'
import { getMembershipForUser, isOwnerSubscriptionActive } from '@/lib/family'

function toNum(v: unknown) { return v == null ? 0 : Number(v) }

// GET /api/family/members/[userId]/goals
// Read-only access to a family member's goals.
export async function GET(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const auth = await requireUser(req)
  if (!isAuthUser(auth)) return auth

  const { userId: targetUserId } = await params

  const myMembership = await getMembershipForUser(auth.id)
  if (!myMembership) {
    return NextResponse.json({ error: 'Та гэр бүлд харьяалагддаггүй' }, { status: 403 })
  }

  if (!isOwnerSubscriptionActive(myMembership)) {
    return NextResponse.json(
      { error: 'Гэр бүлийн owner-н subscription идэвхгүй байна. Харах эрх түр зогссон.' },
      { status: 402 },
    )
  }

  if (targetUserId !== auth.id) {
    const [rows] = await db.query(
      `SELECT 1 FROM family_members WHERE family_id = ? AND user_id = ? LIMIT 1`,
      [myMembership.family_id, targetUserId],
    ) as [Array<unknown>, unknown]

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Энэ хэрэглэгч таны гэр бүлд байхгүй' }, { status: 403 })
    }
  }

  const [rows] = await db.query(
    'SELECT * FROM goals WHERE user_id = ? ORDER BY created_at DESC',
    [targetUserId],
  ) as [Record<string, unknown>[], unknown]

  return NextResponse.json({
    readonly: true,
    goals: rows.map((r) => ({
      id: r.id,
      name: r.name,
      targetAmount: toNum(r.target_amount),
      currentAmount: toNum(r.current_amount),
      deadline: r.deadline instanceof Date ? r.deadline.toISOString().split('T')[0] : r.deadline,
      image: r.image ?? undefined,
      createdAt: r.created_at instanceof Date ? r.created_at.toISOString().split('T')[0] : r.created_at,
    })),
  })
}
