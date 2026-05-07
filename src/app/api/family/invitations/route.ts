import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { requireUser, isAuthUser } from '@/lib/auth'
import { getMembershipForUser } from '@/lib/family'

// GET /api/family/invitations
//   ?direction=incoming → invites addressed to my email (default)
//   ?direction=outgoing → invites issued by my family (owner-visible)
export async function GET(req: NextRequest) {
  const auth = await requireUser(req)
  if (!isAuthUser(auth)) return auth

  const direction = new URL(req.url).searchParams.get('direction') ?? 'incoming'

  // Auto-expire any past-due pending rows the caller might see
  await db.query(
    `UPDATE family_invitations
        SET status = 'expired'
      WHERE status = 'pending' AND expires_at < NOW()`
  )

  if (direction === 'outgoing') {
    const m = await getMembershipForUser(auth.id)
    if (!m || m.role !== 'owner') {
      return NextResponse.json({ invitations: [] })
    }
    const [rows] = await db.query(
      `SELECT id, invited_email, status, invited_at, expires_at
         FROM family_invitations
        WHERE family_id = ?
        ORDER BY invited_at DESC`,
      [m.family_id]
    ) as [Array<{
      id: string; invited_email: string; status: string;
      invited_at: Date | string; expires_at: Date | string;
    }>, unknown]

    return NextResponse.json({
      invitations: rows.map(r => ({
        id: r.id,
        invitedEmail: r.invited_email,
        status: r.status,
        invitedAt: r.invited_at instanceof Date ? r.invited_at.toISOString() : String(r.invited_at),
        expiresAt: r.expires_at instanceof Date ? r.expires_at.toISOString() : String(r.expires_at),
      })),
    })
  }

  // incoming
  const [rows] = await db.query(
    `SELECT inv.id, inv.family_id, inv.status, inv.invited_at, inv.expires_at,
            f.name AS family_name,
            u.name AS inviter_name
       FROM family_invitations inv
       JOIN families f ON inv.family_id = f.id
       JOIN users u    ON inv.invited_by = u.id
      WHERE inv.invited_email = ? AND inv.status = 'pending'
      ORDER BY inv.invited_at DESC`,
    [auth.email]
  ) as [Array<{
    id: string; family_id: string; status: string;
    invited_at: Date | string; expires_at: Date | string;
    family_name: string; inviter_name: string;
  }>, unknown]

  return NextResponse.json({
    invitations: rows.map(r => ({
      id: r.id,
      familyId: r.family_id,
      familyName: r.family_name,
      inviterName: r.inviter_name,
      status: r.status,
      invitedAt: r.invited_at instanceof Date ? r.invited_at.toISOString() : String(r.invited_at),
      expiresAt: r.expires_at instanceof Date ? r.expires_at.toISOString() : String(r.expires_at),
    })),
  })
}
