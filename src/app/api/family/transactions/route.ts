import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { requireUser, isAuthUser } from '@/lib/auth'
import { getMembershipForUser, isOwnerSubscriptionActive } from '@/lib/family'

function toNum(v: unknown) { return v == null ? 0 : Number(v) }

// GET /api/family/transactions?month=YYYY-MM
// Combined transactions for every member of the caller's family. Each
// row carries the member's user id / name / family role so the UI can
// show "who" made which entry per category.
export async function GET(req: NextRequest) {
  const auth = await requireUser(req)
  if (!isAuthUser(auth)) return auth

  const m = await getMembershipForUser(auth.id)
  if (!m) {
    return NextResponse.json({ error: 'Та гэр бүлд харьяалагддаггүй' }, { status: 403 })
  }

  if (!isOwnerSubscriptionActive(m)) {
    return NextResponse.json(
      { error: 'Гэр бүлийн owner-н subscription идэвхгүй байна. Харах эрх түр зогссон.' },
      { status: 402 }
    )
  }

  const url = new URL(req.url)
  const month = url.searchParams.get('month')

  const args: Array<string> = [m.family_id]
  let where = 'fm.family_id = ?'
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    where += " AND DATE_FORMAT(t.date, '%Y-%m') = ?"
    args.push(month)
  }

  const [rows] = await db.query(
    `SELECT t.id, t.title, t.amount, t.category, t.date, t.type, t.description,
            u.id   AS member_id,
            u.name AS member_name,
            fm.family_role AS member_family_role
       FROM transactions t
       JOIN family_members fm ON fm.user_id = t.user_id
       JOIN users u           ON u.id       = t.user_id
      WHERE ${where}
      ORDER BY t.date DESC, t.id DESC`,
    args
  ) as [Record<string, unknown>[], unknown]

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
      memberId: r.member_id,
      memberName: r.member_name,
      memberFamilyRole: r.member_family_role ?? null,
    })),
  })
}
