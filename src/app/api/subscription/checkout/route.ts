import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { requireUser, isAuthUser } from '@/lib/auth'

// POST /api/subscription/checkout
// Free, self-contained "card processor" stub. Validates the payload, marks the
// subscription active for 30 days, and persists a payment-method receipt
// (last4 + brand) on the user record. NO real card data is ever stored.
//
// To swap in a real processor (Stripe, QPay, Pumb, etc.):
//   1. Replace the validation block below with a call to the processor's API
//      using the server-side secret key from env.
//   2. Map their response → { ok: true } on success, throw with a friendly
//      message on failure.
// The client (PaymentModal) only sees ok / not-ok, so swapping is risk-free.

const PRICES_MNT: Record<string, number> = {
  khos:   9900,
  gerbul: 34900,
}

function isPlan(v: unknown): v is keyof typeof PRICES_MNT {
  return v === 'khos' || v === 'gerbul'
}

export async function POST(req: NextRequest) {
  const auth = await requireUser(req)
  if (!isAuthUser(auth)) return auth

  let body: { plan?: unknown; last4?: unknown; brand?: unknown; holder?: unknown }
  try { body = await req.json() } catch { body = {} }

  if (!isPlan(body.plan)) {
    return NextResponse.json({ error: 'Зөв багц сонгоно уу' }, { status: 400 })
  }
  const last4  = typeof body.last4  === 'string' ? body.last4.replace(/\D/g, '').slice(-4) : ''
  const brand  = typeof body.brand  === 'string' ? body.brand : 'unknown'
  const holder = typeof body.holder === 'string' ? body.holder.trim() : ''

  if (last4.length !== 4 || !holder) {
    return NextResponse.json({ error: 'Картын мэдээлэл буруу байна' }, { status: 400 })
  }

  // Simulate processor latency (kept short on purpose).
  await new Promise((r) => setTimeout(r, 600))

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 30)

  await db.query(
    `UPDATE users
        SET subscription_status     = 'active',
            subscription_expires_at = ?
      WHERE id = ?`,
    [expiresAt, auth.id]
  )

  return NextResponse.json({
    ok: true,
    plan: body.plan,
    amountMnt: PRICES_MNT[body.plan],
    last4,
    brand,
    holder,
    subscriptionStatus: 'active',
    subscriptionExpiresAt: expiresAt.toISOString(),
  })
}
