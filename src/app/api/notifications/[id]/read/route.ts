import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { requireUser, isAuthUser } from '@/lib/auth'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser(req)
  if (!isAuthUser(auth)) return auth

  try {
    const { id } = await params
    const [result] = await db.query(
      'UPDATE notifications SET is_read=1 WHERE id=? AND user_id=?',
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
