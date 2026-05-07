import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { requireUser, isAuthUser } from '@/lib/auth'

function toNum(v: unknown) { return v == null ? 0 : Number(v) }

export async function GET(req: NextRequest) {
  const auth = await requireUser(req)
  if (!isAuthUser(auth)) return auth

  try {
    const [rows] = await db.query(
      'SELECT * FROM budgets WHERE user_id = ?',
      [auth.id]
    ) as [Record<string, unknown>[], unknown]
    return NextResponse.json(rows.map((r) => ({
      id: r.id, category: r.category,
      amount: toNum(r.amount), spent: toNum(r.spent),
      month: r.month, year: Number(r.year),
    })))
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireUser(req)
  if (!isAuthUser(auth)) return auth

  try {
    const { id, category, amount, spent, month, year } = await req.json()
    await db.query(
      `INSERT INTO budgets (id,user_id,category,amount,spent,month,year)
       VALUES (?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE category=VALUES(category),amount=VALUES(amount),
       spent=VALUES(spent),month=VALUES(month),year=VALUES(year)`,
      [id, auth.id, category, amount, spent ?? 0, month, year]
    )
    return NextResponse.json({ id, category, amount, spent, month, year }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
