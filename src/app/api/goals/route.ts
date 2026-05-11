import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { requireUser, isAuthUser } from '@/lib/auth'

function toNum(v: unknown) { return v == null ? 0 : Number(v) }

export async function GET(req: NextRequest) {
  const auth = await requireUser(req)
  if (!isAuthUser(auth)) return auth

  try {
    // Return the caller's own goals plus the goals of anyone in the same
    // family. Falls back to just the caller's own goals when they are not
    // in a family. ownerId/ownerName let the UI label whose goal it is.
    const [rows] = await db.query(
      `SELECT g.*, u.name AS owner_name
         FROM goals g
         JOIN users u ON u.id = g.user_id
        WHERE g.user_id = ?
           OR g.user_id IN (
             SELECT fm.user_id
               FROM family_members fm
              WHERE fm.family_id = (
                SELECT family_id FROM family_members WHERE user_id = ? LIMIT 1
              )
           )
        ORDER BY g.created_at DESC, g.id DESC`,
      [auth.id, auth.id]
    ) as [Record<string, unknown>[], unknown]

    return NextResponse.json(rows.map((r) => ({
      id: r.id, name: r.name,
      targetAmount: toNum(r.target_amount),
      currentAmount: toNum(r.current_amount),
      deadline: r.deadline instanceof Date ? r.deadline.toISOString().split('T')[0] : r.deadline,
      image: r.image ?? undefined,
      createdAt: r.created_at instanceof Date ? r.created_at.toISOString().split('T')[0] : r.created_at,
      ownerId: r.user_id,
      ownerName: r.owner_name,
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
