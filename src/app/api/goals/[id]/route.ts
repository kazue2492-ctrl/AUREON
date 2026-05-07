import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { requireUser, isAuthUser } from '@/lib/auth'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser(req)
  if (!isAuthUser(auth)) return auth

  try {
    const { id } = await params
    const { name, targetAmount, currentAmount, deadline, image } = await req.json()
    const [result] = await db.query(
      'UPDATE goals SET name=?,target_amount=?,current_amount=?,deadline=?,image=? WHERE id=? AND user_id=?',
      [name, targetAmount, currentAmount ?? 0, deadline, image ?? null, id, auth.id]
    ) as [{ affectedRows: number }, unknown]

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    return NextResponse.json({ id, name, targetAmount, currentAmount, deadline, image })
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
      'DELETE FROM goals WHERE id=? AND user_id=?',
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
