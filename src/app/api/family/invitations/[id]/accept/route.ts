import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { requireUser, isAuthUser } from '@/lib/auth'
import {
  countFamilyMembers,
  getMembershipForUser,
  maxMembersForKind,
  type FamilyKind,
} from '@/lib/family'
import { newId } from '@/lib/ids'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser(req)
  if (!isAuthUser(auth)) return auth

  const { id } = await params

  const conn = await db.getConnection()
  try {
    await conn.beginTransaction()

    const [invRows] = await conn.query(
      `SELECT id, family_id, invited_email, status, expires_at
         FROM family_invitations
        WHERE id = ? FOR UPDATE`,
      [id]
    ) as [Array<{
      id: string; family_id: string; invited_email: string;
      status: string; expires_at: Date;
    }>, unknown]

    if (invRows.length === 0) {
      await conn.rollback()
      return NextResponse.json({ error: 'Урилга олдсонгүй' }, { status: 404 })
    }
    const inv = invRows[0]

    if (inv.invited_email !== auth.email) {
      await conn.rollback()
      return NextResponse.json({ error: 'Энэ урилга танд хамаарахгүй' }, { status: 403 })
    }
    if (inv.status !== 'pending') {
      await conn.rollback()
      return NextResponse.json({ error: 'Урилгын статус хүчингүй' }, { status: 409 })
    }
    if (new Date(inv.expires_at).getTime() < Date.now()) {
      await conn.query('UPDATE family_invitations SET status = ? WHERE id = ?', ['expired', id])
      await conn.commit()
      return NextResponse.json({ error: 'Урилгын хугацаа дууссан' }, { status: 410 })
    }

    const myMembership = await getMembershipForUser(auth.id)
    if (myMembership) {
      await conn.rollback()
      return NextResponse.json(
        { error: 'Та аль хэдийн нэг гэр бүлд харьяалагдаж байна' },
        { status: 409 }
      )
    }

    const memberCount = await countFamilyMembers(inv.family_id)
    const [kindRows] = await conn.query(
      'SELECT kind FROM families WHERE id = ? LIMIT 1',
      [inv.family_id]
    ) as [Array<{ kind: FamilyKind }>, unknown]
    const kind: FamilyKind = kindRows[0]?.kind ?? 'family'
    const limit = maxMembersForKind(kind)
    if (memberCount >= limit) {
      await conn.query('UPDATE family_invitations SET status = ? WHERE id = ?', ['expired', id])
      await conn.commit()
      return NextResponse.json(
        { error: 'Гишүүний хязгаарт хүрсэн байна' },
        { status: 409 }
      )
    }

    await conn.query(
      `INSERT INTO family_members (id, family_id, user_id, role)
       VALUES (?, ?, ?, 'member')`,
      [newId(), inv.family_id, auth.id]
    )
    await conn.query('UPDATE family_invitations SET status = ? WHERE id = ?', ['accepted', id])

    // Auto-decline any other pending invites addressed to this email
    await conn.query(
      `UPDATE family_invitations
          SET status = 'cancelled'
        WHERE invited_email = ? AND status = 'pending' AND id <> ?`,
      [auth.email, id]
    )

    // Notify the family owner that the invitation was accepted, so they
    // see a signal even before their next manual refresh / poll.
    const [ownerRows] = await conn.query(
      'SELECT owner_id FROM families WHERE id = ? LIMIT 1',
      [inv.family_id]
    ) as [Array<{ owner_id: string }>, unknown]
    if (ownerRows.length > 0) {
      await conn.query(
        `INSERT INTO notifications (id, user_id, title, message, type, is_read, created_at)
         VALUES (?, ?, ?, ?, 'success', 0, CURDATE())`,
        [
          newId(),
          ownerRows[0].owner_id,
          'Гишүүн нэгдлээ',
          `${auth.name} таны гэр бүлд нэгдлээ.`,
        ]
      )
    }

    await conn.commit()
    return NextResponse.json({ success: true, familyId: inv.family_id })
  } catch (err) {
    await conn.rollback()
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  } finally {
    conn.release()
  }
}
