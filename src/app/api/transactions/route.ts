import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { requireUser, isAuthUser } from '@/lib/auth'

function toNum(v: unknown) { return v == null ? 0 : Number(v) }

export async function GET(req: NextRequest) {
  const auth = await requireUser(req)
  if (!isAuthUser(auth)) return auth

  try {
    const [rows] = await db.query(
      'SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC',
      [auth.id]
    ) as [Record<string, unknown>[], unknown]
    return NextResponse.json(rows.map((r) => ({
      id: r.id, title: r.title, amount: toNum(r.amount),
      category: r.category,
      date: r.date instanceof Date ? r.date.toISOString().split('T')[0] : r.date,
      type: r.type, description: r.description ?? undefined,
    })))
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireUser(req)
  if (!isAuthUser(auth)) return auth

  try {
    const { id, title, amount, category, date, type, description } = await req.json()
    await db.query(
      `INSERT INTO transactions (id,user_id,title,amount,category,date,type,description)
       VALUES (?,?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE title=VALUES(title),amount=VALUES(amount),
       category=VALUES(category),date=VALUES(date),type=VALUES(type),description=VALUES(description)`,
      [id, auth.id, title, amount, category, date, type, description ?? null]
    )
    return NextResponse.json({ id, title, amount, category, date, type, description }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
