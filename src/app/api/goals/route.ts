import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { requireUser, isAuthUser } from '@/lib/auth'

function toNum(v: unknown) { return v == null ? 0 : Number(v) }

export async function GET(req: NextRequest) {
  const auth = await requireUser(req)
  if (!isAuthUser(auth)) return auth

  try {
    const [rows] = await db.query(
      'SELECT * FROM goals WHERE user_id = ?',
      [auth.id]
    ) as [Record<string, unknown>[], unknown]
    return NextResponse.json(rows.map((r) => ({
      id: r.id, name: r.name,
      targetAmount: toNum(r.target_amount),
      currentAmount: toNum(r.current_amount),
      deadline: r.deadline instanceof Date ? r.deadline.toISOString().split('T')[0] : r.deadline,
      image: r.image ?? undefined,
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
    const { id, name, targetAmount, currentAmount, deadline, image, createdAt } = await req.json()
    await db.query(
      `INSERT INTO goals (id,user_id,name,target_amount,current_amount,deadline,image,created_at)
       VALUES (?,?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE name=VALUES(name),target_amount=VALUES(target_amount),
       current_amount=VALUES(current_amount),deadline=VALUES(deadline),image=VALUES(image)`,
      [id, auth.id, name, targetAmount, currentAmount ?? 0, deadline, image ?? null, createdAt]
    )
    return NextResponse.json({ id, name, targetAmount, currentAmount, deadline, image, createdAt }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
