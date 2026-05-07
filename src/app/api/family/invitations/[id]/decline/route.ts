import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { requireUser, isAuthUser } from '@/lib/auth'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser(req)
  if (!isAuthUser(auth)) return auth

  const { id } = await params
  const [rows] = await db.query(
    `SELECT invited_email, status FROM family_invitations WHERE id = ? LIMIT 1`,
    [id]
  ) as [Array<{ invited_email: string; status: string }>, unknown]

  if (rows.length === 0) {
    return NextResponse.json({ error: 'Урилга олдсонгүй' }, { status: 404 })
  }
  if (rows[0].invited_email !== auth.email) {
    return NextResponse.json({ error: 'Энэ урилга танд хамаарахгүй' }, { status: 403 })
  }
  if (rows[0].status !== 'pending') {
    return NextResponse.json({ error: 'Урилгын статус хүчингүй' }, { status: 409 })
  }

  await db.query('UPDATE family_invitations SET status = ? WHERE id = ?', ['declined', id])
  return NextResponse.json({ success: true })
}
