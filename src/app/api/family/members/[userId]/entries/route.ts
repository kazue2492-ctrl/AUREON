import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { requireUser, isAuthUser } from '@/lib/auth'
import { getMembershipForUser, isOwnerSubscriptionActive } from '@/lib/family'

function toNum(v: unknown) { return v == null ? 0 : Number(v) }

// GET /api/family/members/[userId]/entries?date=YYYY-MM-DD
// Read-only access to a family member's transactions.
export async function GET(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const auth = await requireUser(req)
  if (!isAuthUser(auth)) return auth

  const { userId: targetUserId } = await params
  const url = new URL(req.url)
  const date = url.searchParams.get('date') // optional YYYY-MM-DD; if absent, returns all

  const myMembership = await getMembershipForUser(auth.id)
  if (!myMembership) {
    return NextResponse.json({ error: 'Та гэр бүлд харьяалагддаггүй' }, { status: 403 })
  }

  // Owner subscription must be active for cross-member viewing
  if (!isOwnerSubscriptionActive(myMembership)) {
    return NextResponse.json(
      { error: 'Гэр бүлийн owner-н subscription идэвхгүй байна. Харах эрх түр зогссон.' },
      { status: 402 }
    )
  }

  // Caller may view their own entries; otherwise target must be in same family
  if (targetUserId !== auth.id) {
    const [rows] = await db.query(
      `SELECT 1 FROM family_members WHERE family_id = ? AND user_id = ? LIMIT 1`,
      [myMembership.family_id, targetUserId]
    ) as [Array<unknown>, unknown]

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Энэ хэрэглэгч таны гэр бүлд байхгүй' }, { status: 403 })
    }
  }

  const sql = date
    ? 'SELECT * FROM transactions WHERE user_id = ? AND date = ? ORDER BY id DESC'
    : 'SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC'
  const args = date ? [targetUserId, date] : [targetUserId]

  const [rows] = await db.query(sql, args) as [Record<string, unknown>[], unknown]

  return NextResponse.json({
    readonly: true,
    transactions: rows.map(r => ({
      id: r.id,
      title: r.title,
      amount: toNum(r.amount),
      category: r.category,
      date: r.date instanceof Date ? r.date.toISOString().split('T')[0] : r.date,
      type: r.type,
      description: r.description ?? undefined,
    })),
  })
}
