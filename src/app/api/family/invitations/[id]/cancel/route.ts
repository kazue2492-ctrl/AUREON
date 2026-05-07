import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { requireUser, isAuthUser } from '@/lib/auth'
import { getMembershipForUser } from '@/lib/family'

// Cancel a pending invitation (owner only)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser(req)
  if (!isAuthUser(auth)) return auth

  const m = await getMembershipForUser(auth.id)
  if (!m || m.role !== 'owner') {
    return NextResponse.json({ error: 'Зөвхөн owner урилгыг цуцалж болно' }, { status: 403 })
  }

  const { id } = await params
  const [rows] = await db.query(
    `SELECT family_id, status FROM family_invitations WHERE id = ? LIMIT 1`,
    [id]
  ) as [Array<{ family_id: string; status: string }>, unknown]

  if (rows.length === 0) {
    return NextResponse.json({ error: 'Урилга олдсонгүй' }, { status: 404 })
  }
  if (rows[0].family_id !== m.family_id) {
    return NextResponse.json({ error: 'Энэ урилга таны гэр бүлийнх биш' }, { status: 403 })
  }
  if (rows[0].status !== 'pending') {
    return NextResponse.json({ error: 'Урилгын статус хүчингүй' }, { status: 409 })
  }

  await db.query('UPDATE family_invitations SET status = ? WHERE id = ?', ['cancelled', id])
  return NextResponse.json({ success: true })
}
