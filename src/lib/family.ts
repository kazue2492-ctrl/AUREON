import db from './db'

export const FAMILY_MAX_MEMBERS = 4
export const COUPLE_MAX_MEMBERS = 2
export const INVITATION_TTL_DAYS = 7

export type FamilyKind = 'family' | 'couple'

export type FamilyRole =
  | 'father'
  | 'mother'
  | 'older_sister'
  | 'older_brother'
  | 'younger_sibling'
  | 'husband'
  | 'wife'
  | 'lover'

// Roles a 'family' household can choose. Couples cannot pick these.
export const FAMILY_ROLES: FamilyRole[] = [
  'father',
  'mother',
  'older_sister',
  'older_brother',
  'younger_sibling',
]

// Roles for a 'couple'. Families cannot pick these.
export const COUPLE_ROLES: FamilyRole[] = [
  'husband',
  'wife',
  'lover',
]

export function rolesForKind(kind: FamilyKind): FamilyRole[] {
  return kind === 'couple' ? COUPLE_ROLES : FAMILY_ROLES
}

export function maxMembersForKind(kind: FamilyKind): number {
  return kind === 'couple' ? COUPLE_MAX_MEMBERS : FAMILY_MAX_MEMBERS
}

// Backwards-compatible alias used by older callers.
export const maxMembersFor = maxMembersForKind

export interface FamilyMembershipRow {
  family_id: string
  family_name: string
  family_kind: FamilyKind
  owner_id: string
  role: 'owner' | 'member'
  family_role: FamilyRole | null
  joined_at: Date | string
  owner_subscription_status: 'active' | 'expired' | 'none'
  owner_subscription_expires_at: Date | string | null
}

/**
 * Returns the family membership for the given user, joined with the family
 * and the owner's subscription status (so callers can gate read access).
 */
export async function getMembershipForUser(userId: string): Promise<FamilyMembershipRow | null> {
  const [rows] = await db.query(
    `SELECT fm.family_id,
            f.name AS family_name,
            f.kind AS family_kind,
            f.owner_id,
            fm.role,
            fm.family_role,
            fm.joined_at,
            owner.subscription_status   AS owner_subscription_status,
            owner.subscription_expires_at AS owner_subscription_expires_at
       FROM family_members fm
       JOIN families f      ON fm.family_id = f.id
       JOIN users owner     ON f.owner_id   = owner.id
      WHERE fm.user_id = ?
      LIMIT 1`,
    [userId]
  ) as [FamilyMembershipRow[], unknown]

  return rows[0] ?? null
}

export interface FamilyMemberSummary {
  userId: string
  name: string
  email: string
  avatar: string | null
  role: 'owner' | 'member'
  familyRole: FamilyRole | null
  joinedAt: string
}

export async function listFamilyMembers(familyId: string): Promise<FamilyMemberSummary[]> {
  const [rows] = await db.query(
    `SELECT u.id   AS user_id,
            u.name,
            u.email,
            u.avatar,
            fm.role,
            fm.family_role,
            fm.joined_at
       FROM family_members fm
       JOIN users u ON fm.user_id = u.id
      WHERE fm.family_id = ?
      ORDER BY (fm.role = 'owner') DESC, fm.joined_at ASC`,
    [familyId]
  ) as [Array<{
    user_id: string; name: string; email: string;
    avatar: string | null; role: 'owner' | 'member';
    family_role: FamilyRole | null;
    joined_at: Date | string;
  }>, unknown]

  return rows.map(r => ({
    userId: r.user_id,
    name: r.name,
    email: r.email,
    avatar: r.avatar || '/images/default-avatar.png',
    role: r.role,
    familyRole: r.family_role ?? null,
    joinedAt: r.joined_at instanceof Date ? r.joined_at.toISOString() : String(r.joined_at),
  }))
}

export function isOwnerSubscriptionActive(m: FamilyMembershipRow): boolean {
  if (m.owner_subscription_status !== 'active') return false
  if (!m.owner_subscription_expires_at) return false
  const exp = m.owner_subscription_expires_at instanceof Date
    ? m.owner_subscription_expires_at
    : new Date(m.owner_subscription_expires_at)
  return exp.getTime() > Date.now()
}

export async function countFamilyMembers(familyId: string): Promise<number> {
  const [rows] = await db.query(
    'SELECT COUNT(*) AS n FROM family_members WHERE family_id = ?',
    [familyId]
  ) as [Array<{ n: number | string }>, unknown]
  return Number(rows[0]?.n ?? 0)
}
