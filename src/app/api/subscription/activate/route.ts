import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { requireUser, isAuthUser } from '@/lib/auth'

// Stub endpoint that activates subscription for 30 days.
// In production, replace with real billing/webhook logic.
export async function POST(req: NextRequest) {
  const auth = await requireUser(req)
  if (!isAuthUser(auth)) return auth

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 30)

  await db.query(
    `UPDATE users SET subscription_status = 'active', subscription_expires_at = ? WHERE id = ?`,
    [expiresAt, auth.id]
  )

  return NextResponse.json({
    subscriptionStatus: 'active',
    subscriptionExpiresAt: expiresAt.toISOString(),
  })
}

// Cancel / expire subscription
export async function DELETE(req: NextRequest) {
  const auth = await requireUser(req)
  if (!isAuthUser(auth)) return auth

  await db.query(
    `UPDATE users SET subscription_status = 'expired' WHERE id = ?`,
    [auth.id]
  )

  return NextResponse.json({ subscriptionStatus: 'expired' })
}
