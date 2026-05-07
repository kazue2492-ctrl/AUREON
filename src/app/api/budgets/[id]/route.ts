import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { requireUser, isAuthUser } from '@/lib/auth'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser(req)
  if (!isAuthUser(auth)) return auth

  try {
    const { id } = await params
    const { category, amount, spent, month, year } = await req.json()
    const [result] = await db.query(
      'UPDATE budgets SET category=?,amount=?,spent=?,month=?,year=? WHERE id=? AND user_id=?',
      [category, amount, spent ?? 0, month, year, id, auth.id]
    ) as [{ affectedRows: number }, unknown]

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    return NextResponse.json({ id, category, amount, spent, month, year })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser(req)
  if (!isAuthUser(auth)) return auth

  try {
    const { id } = await params
    const [result] = await db.query(
      'DELETE FROM budgets WHERE id=? AND user_id=?',
      [id, auth.id]
    ) as [{ affectedRows: number }, unknown]

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
