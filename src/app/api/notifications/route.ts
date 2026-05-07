import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { requireUser, isAuthUser } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const auth = await requireUser(req)
  if (!isAuthUser(auth)) return auth

  try {
    const [rows] = await db.query(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
      [auth.id]
    ) as [Record<string, unknown>[], unknown]
    return NextResponse.json(rows.map((r) => ({
      id: r.id, title: r.title, message: r.message,
      type: r.type, read: Boolean(r.is_read),
      createdAt: r.created_at instanceof Date ? r.created_at.toISOString().split('T')[0] : r.created_at,
    })))
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireUser(req)
  if (!isAuthUser(auth)) return auth

  try {
    const { id, title, message, type, read, createdAt } = await req.json()
    await db.query(
      `INSERT INTO notifications (id,user_id,title,message,type,is_read,created_at)
       VALUES (?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE title=VALUES(title),message=VALUES(message),
       type=VALUES(type),is_read=VALUES(is_read)`,
      [id, auth.id, title, message, type, read ? 1 : 0, createdAt]
    )
    return NextResponse.json({ id, title, message, type, read, createdAt }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
