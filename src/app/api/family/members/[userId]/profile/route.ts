import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { requireUser, isAuthUser } from '@/lib/auth'
import { getMembershipForUser, isOwnerSubscriptionActive } from '@/lib/family'

const DEFAULT_AVATAR = '/images/default-avatar.png'

// Headers applied to every JSON response from this route. Profile data
// includes PII (name, email, age, gender) so we must not let it sit in
// browser/proxy caches; nosniff blocks MIME-confusion attacks.
const SECURE_HEADERS: Record<string, string> = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, private',
  Pragma: 'no-cache',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
}

function secureJson(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: SECURE_HEADERS })
}

// Allow only safe avatar sources to be echoed back to the client.
// A malicious member who set their avatar to javascript:/external URL
// would otherwise have it rendered for every viewer in their family.
function sanitizeAvatar(value: unknown): string {
  if (typeof value !== 'string' || value.length === 0) return DEFAULT_AVATAR
  if (value.length > 2_000_000) return DEFAULT_AVATAR // ~2MB data-url ceiling
  if (value.startsWith('/images/')) return value
  if (value.startsWith('data:image/png;base64,')) return value
  if (value.startsWith('data:image/jpeg;base64,')) return value
  if (value.startsWith('data:image/jpg;base64,')) return value
  if (value.startsWith('data:image/webp;base64,')) return value
  if (value.startsWith('data:image/gif;base64,')) return value
  return DEFAULT_AVATAR
}

function isValidId(id: unknown): id is string {
  return typeof id === 'string' && id.length > 0 && id.length <= 64 && /^[A-Za-z0-9_-]+$/.test(id)
}

// GET /api/family/members/[userId]/profile
// Read-only profile of a family member (name, email, age, gender, avatar...).
export async function GET(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const auth = await requireUser(req)
    if (!isAuthUser(auth)) {
      // requireUser returns NextResponse on failure; rebuild it with secure headers
      const body = await auth.json().catch(() => ({ error: 'Unauthorized' }))
      return secureJson(body, auth.status)
    }

    const { userId: targetUserId } = await params
    if (!isValidId(targetUserId)) {
      return secureJson({ error: 'Invalid request' }, 400)
    }

    const myMembership = await getMembershipForUser(auth.id)
    if (!myMembership) {
      return secureJson({ error: 'Та гэр бүлд харьяалагддаггүй' }, 403)
    }

    if (!isOwnerSubscriptionActive(myMembership)) {
      return secureJson(
        { error: 'Гэр бүлийн owner-н subscription идэвхгүй байна. Харах эрх түр зогссон.' },
        402
      )
    }

    if (targetUserId !== auth.id) {
      const [memberRows] = await db.query(
        `SELECT 1 FROM family_members WHERE family_id = ? AND user_id = ? LIMIT 1`,
        [myMembership.family_id, targetUserId]
      ) as [Array<unknown>, unknown]

      if (memberRows.length === 0) {
        // Use the same status as a missing-membership case to avoid
        // letting a caller distinguish "id exists" from "id doesn't"
        return secureJson({ error: 'Энэ хэрэглэгч таны гэр бүлд байхгүй' }, 403)
      }
    }

    const [rows] = await db.query(
      `SELECT name, email, avatar, age, gender, currency, relationship_status
         FROM users WHERE id = ? LIMIT 1`,
      [targetUserId]
    ) as [Record<string, unknown>[], unknown]

    if (rows.length === 0) {
      return secureJson({ error: 'Хэрэглэгч олдсонгүй' }, 404)
    }

    const r = rows[0]
    const ageRaw = r.age == null ? null : Number(r.age)
    const age = Number.isFinite(ageRaw) && ageRaw !== null && ageRaw >= 0 && ageRaw <= 150
      ? ageRaw
      : null
    const gender = r.gender === 'male' || r.gender === 'female' ? r.gender : null

    return secureJson({
      readonly: true,
      profile: {
        name: typeof r.name === 'string' ? r.name : '',
        email: typeof r.email === 'string' ? r.email : '',
        avatar: sanitizeAvatar(r.avatar),
        age,
        gender,
        currency: typeof r.currency === 'string' ? r.currency : 'MNT',
        relationshipStatus: typeof r.relationship_status === 'string' ? r.relationship_status : null,
      },
    })
  } catch (err) {
    // Never echo raw DB / framework errors back to the client — they may
    // expose schema, file paths, or stack frames a hacker can pivot on.
    console.error('[api/family/members/profile] unhandled', err)
    return secureJson({ error: 'Серверийн алдаа' }, 500)
  }
}
