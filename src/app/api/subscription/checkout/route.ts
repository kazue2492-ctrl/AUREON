import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { requireUser, isAuthUser } from '@/lib/auth'

// POST /api/subscription/checkout
// Free, self-contained "card processor" stub. Validates the payload, charges
// for the selected plan + duration, extends (or starts) the subscription
// window accordingly, and persists a payment-method receipt (last4 + brand).
// NO real card data is ever stored.
//
// To swap in a real processor (Stripe, QPay, Pumb, etc.):
//   1. Replace the validation block below with a call to the processor's API
//      using the server-side secret key from env.
//   2. Map their response → { ok: true } on success, throw with a friendly
//      message on failure.
// The client (PaymentModal) only sees ok / not-ok, so swapping is risk-free.

type Plan = 'khos' | 'gerbul'
type Duration = 1 | 3 | 12

// Per-plan, per-duration MNT prices. 3-month tier has a small discount over
// the monthly rate; the 12-month tier is exactly 12× monthly (no discount).
const PRICES_MNT: Record<Plan, Record<Duration, number>> = {
  khos:   { 1: 9900,  3: 28500, 12: 118800 },
  gerbul: { 1: 34900, 3: 99000, 12: 418800 },
}

function isPlan(v: unknown): v is Plan {
  return v === 'khos' || v === 'gerbul'
}

function isDuration(v: unknown): v is Duration {
  return v === 1 || v === 3 || v === 12
}

export async function POST(req: NextRequest) {
  const auth = await requireUser(req)
  if (!isAuthUser(auth)) return auth

  let body: {
    plan?: unknown
    last4?: unknown
    brand?: unknown
    holder?: unknown
    durationMonths?: unknown
  }
  try { body = await req.json() } catch { body = {} }

  if (!isPlan(body.plan)) {
    return NextResponse.json({ error: 'Зөв багц сонгоно уу' }, { status: 400 })
  }
  const duration: Duration = isDuration(body.durationMonths) ? body.durationMonths : 1
  const amountMnt = PRICES_MNT[body.plan][duration]

  const last4  = typeof body.last4  === 'string' ? body.last4.replace(/\D/g, '').slice(-4) : ''
  const brand  = typeof body.brand  === 'string' ? body.brand : 'unknown'
  const holder = typeof body.holder === 'string' ? body.holder.trim() : ''

  if (last4.length !== 4 || !holder) {
    return NextResponse.json({ error: 'Картын мэдээлэл буруу байна' }, { status: 400 })
  }

  // Simulate processor latency (kept short on purpose).
  await new Promise((r) => setTimeout(r, 600))

  // If the user already has an active, non-expired subscription, extend
  // from its current end date so renewals stack rather than reset.
  const [rows] = await db.query(
    `SELECT subscription_status, subscription_expires_at
       FROM users WHERE id = ? LIMIT 1`,
    [auth.id]
  ) as [Array<{
    subscription_status: 'active' | 'expired' | 'none'
    subscription_expires_at: Date | string | null
  }>, unknown]

  const row = rows[0]
  const currentExpiry = row?.subscription_expires_at
    ? (row.subscription_expires_at instanceof Date
        ? row.subscription_expires_at
        : new Date(row.subscription_expires_at))
    : null

  const base = (row?.subscription_status === 'active'
                && currentExpiry
                && currentExpiry.getTime() > Date.now())
    ? new Date(currentExpiry)
    : new Date()

  const expiresAt = new Date(base)
  expiresAt.setMonth(expiresAt.getMonth() + duration)

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
    durationMonths: duration,
    amountMnt,
    last4,
    brand,
    holder,
    subscriptionStatus: 'active',
    subscriptionExpiresAt: expiresAt.toISOString(),
  })
}
