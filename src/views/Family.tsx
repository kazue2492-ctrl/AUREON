'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import {
  Users,
  UserPlus,
  Crown,
  ShieldAlert,
  X,
  Mail,
  Trash2,
  Eye,
  LogOut,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  IdCard,
  Lock,
  Target,
  Calendar,
  TrendingUp,
  TrendingDown,
  Heart,
} from 'lucide-react'
import { apiFetch, getUser, setUser as cacheUser, type AuthUser } from '@/lib/clientAuth'
import type { Transaction, Goal } from '@/types'

type FamilyRole =
  | 'father'
  | 'mother'
  | 'older_sister'
  | 'older_brother'
  | 'younger_sibling'
  | 'husband'
  | 'wife'
  | 'lover'

type FamilyKind = 'family' | 'couple'

const FAMILY_ROLE_OPTIONS: Array<{ value: FamilyRole; label: string; emoji: string }> = [
  { value: 'father',          label: 'Аав',    emoji: '👨' },
  { value: 'mother',          label: 'Ээж',    emoji: '👩' },
  { value: 'older_sister',    label: 'Эгч',    emoji: '👧' },
  { value: 'older_brother',   label: 'Ах',     emoji: '👦' },
  { value: 'younger_sibling', label: 'Дүү',    emoji: '🧒' },
  { value: 'husband',         label: 'Нөхөр',  emoji: '🤵' },
  { value: 'wife',            label: 'Эхнэр',  emoji: '👰' },
  { value: 'lover',         label: 'Хайрт',  emoji: '💖' },
]

const COUPLE_ROLE_VALUES: ReadonlyArray<FamilyRole> = ['husband', 'wife', 'lover']
const FAMILY_ROLE_VALUES: ReadonlyArray<FamilyRole> = [
  'father', 'mother', 'older_sister', 'older_brother', 'younger_sibling',
]

function familyRoleLabel(role: FamilyRole | null | undefined): string {
  if (!role) return ''
  return FAMILY_ROLE_OPTIONS.find(o => o.value === role)?.label ?? ''
}

function rolesForKind(kind: FamilyKind): ReadonlyArray<FamilyRole> {
  return kind === 'couple' ? COUPLE_ROLE_VALUES : FAMILY_ROLE_VALUES
}

interface FamilyMember {
  userId: string
  name: string
  email: string
  avatar: string | null
  role: 'owner' | 'member'
  familyRole: FamilyRole | null
  joinedAt: string
}

interface FamilyDto {
  id: string
  name: string
  ownerId: string
  myRole: 'owner' | 'member'
  myFamilyRole: FamilyRole | null
  ownerSubscriptionActive: boolean
  kind: FamilyKind
  maxMembers: number
}

interface FamilyTransaction extends Transaction {
  memberId: string
  memberName: string
  memberFamilyRole: FamilyRole | null
}

interface FamilyResponse {
  family: FamilyDto | null
  members?: FamilyMember[]
}

interface InvitationOutgoing {
  id: string
  invitedEmail: string
  status: 'pending' | 'accepted' | 'declined' | 'expired' | 'cancelled'
  invitedAt: string
  expiresAt: string
}

interface InvitationIncoming {
  id: string
  familyId: string
  familyName: string
  inviterName: string
  status: string
  invitedAt: string
  expiresAt: string
}

interface MemberEntriesResponse {
  readonly: boolean
  transactions: Transaction[]
}

interface MemberProfile {
  name: string
  email: string
  avatar: string | null
  age: number | null
  gender: 'male' | 'female' | null
  currency: string
  relationshipStatus: string | null
}

interface MemberProfileResponse {
  readonly: boolean
  profile: MemberProfile
}

interface MemberGoalsResponse {
  readonly: boolean
  goals: Goal[]
}

const FAMILY_MAX_MEMBERS = 4
const COUPLE_MAX_MEMBERS = 2

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0]
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('mn-MN').format(n) + '₮'
}

export default function FamilyPage() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [family, setFamily] = useState<FamilyDto | null>(null)
  const [members, setMembers] = useState<FamilyMember[]>([])
  const [outgoingInvites, setOutgoingInvites] = useState<InvitationOutgoing[]>([])
  const [incomingInvites, setIncomingInvites] = useState<InvitationIncoming[]>([])
  const [error, setError] = useState('')
  const [actionMsg, setActionMsg] = useState<{ kind: 'success' | 'error'; text: string } | null>(null)

  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteSubmitting, setInviteSubmitting] = useState(false)

  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null)
  const [entriesDate, setEntriesDate] = useState(todayStr())
  const [entries, setEntries] = useState<Transaction[]>([])
  const [entriesLoading, setEntriesLoading] = useState(false)
  const [entriesError, setEntriesError] = useState('')

  const [profileMember, setProfileMember] = useState<FamilyMember | null>(null)
  const [memberProfile, setMemberProfile] = useState<MemberProfile | null>(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileError, setProfileError] = useState('')

  const [goalsMember, setGoalsMember] = useState<FamilyMember | null>(null)
  const [memberGoals, setMemberGoals] = useState<Goal[]>([])
  const [goalsLoading, setGoalsLoading] = useState(false)
  const [goalsError, setGoalsError] = useState('')

  const [showRolePicker, setShowRolePicker] = useState(false)
  // The 12s poll re-runs loadAll with a stale closure, so a state flag
  // wouldn't update for it — a ref is read fresh on every poll tick.
  const rolePickerAutoShown = useRef(false)
  const [roleSubmitting, setRoleSubmitting] = useState<FamilyRole | null>(null)

  const [familyTx, setFamilyTx] = useState<FamilyTransaction[]>([])
  const [familyTxLoading, setFamilyTxLoading] = useState(false)
  const [familyTxError, setFamilyTxError] = useState('')
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null)

  const isOwner = family?.myRole === 'owner'
  // When a family/couple group already exists, that's the source of truth.
  // Otherwise the URL the user navigated to wins (/couple vs /family),
  // with relationship_status as a last-ditch fallback for the initial
  // server-rendered paint where pathname may be empty.
  const isCouple = family
    ? family.kind === 'couple'
    : pathname === '/couple'
      ? true
      : pathname === '/family'
        ? false
        : user?.relationshipStatus === 'couple'
  const memberLimit = family?.maxMembers ?? (isCouple ? COUPLE_MAX_MEMBERS : FAMILY_MAX_MEMBERS)
  const subscriptionActive = user?.subscriptionStatus === 'active'

  const totalIncome = useMemo(
    () => entries.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
    [entries]
  )
  const totalExpense = useMemo(
    () => entries.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
    [entries]
  )

  function flash(kind: 'success' | 'error', text: string) {
    setActionMsg({ kind, text })
    setTimeout(() => setActionMsg(null), 4000)
  }

  async function loadAll(opts: { silent?: boolean } = {}) {
    if (!opts.silent) setLoading(true)
    setError('')
    try {
      const [me, fam, incoming] = await Promise.all([
        apiFetch<AuthUser>('/api/auth/me'),
        apiFetch<FamilyResponse>('/api/family'),
        apiFetch<{ invitations: InvitationIncoming[] }>('/api/family/invitations?direction=incoming'),
      ])
      setUser(me)
      cacheUser(me)
      setFamily(fam.family)
      setMembers(fam.members ?? [])
      setIncomingInvites(incoming.invitations)

      // Surface family membership to the nav (Sidebar/BottomNav). A member
      // who accepted an invite has their own accountType='engiin', so the
      // Family menu would stay hidden without this flag.
      const inFamily = fam.family !== null
      const prev = window.localStorage.getItem('walletHubInFamily')
      window.localStorage.setItem('walletHubInFamily', inFamily ? 'true' : 'false')
      if (prev !== (inFamily ? 'true' : 'false')) {
        window.dispatchEvent(new Event('profileUpdated'))
      }

      if (fam.family && fam.family.myRole === 'owner') {
        const out = await apiFetch<{ invitations: InvitationOutgoing[] }>(
          '/api/family/invitations?direction=outgoing'
        )
        setOutgoingInvites(out.invitations)
      } else {
        setOutgoingInvites([])
      }

      // First time the user lands in a family, prompt them to pick which
      // family member they are (aav/eej/...). Auto-show only once per
      // page life so the 12s polling loop doesn't re-pop a dismissed
      // modal — the family-card button lets them reopen it manually.
      if (fam.family && fam.family.myFamilyRole == null && !rolePickerAutoShown.current) {
        setShowRolePicker(true)
        rolePickerAutoShown.current = true
      }

      // Pull combined family transactions in the background so the
      // "Family categories" panel populates without an extra click. We
      // only have read permission while the owner's subscription is live.
      if (fam.family && fam.family.ownerSubscriptionActive) {
        loadFamilyTransactions().catch(() => { /* surface via panel error */ })
      } else {
        setFamilyTx([])
      }
    } catch (err) {
      // Polling errors stay silent so transient network blips don't
      // overwrite the page with a red banner.
      if (!opts.silent) {
        setError(err instanceof Error ? err.message : 'Ачаалахад алдаа гарлаа')
      }
    } finally {
      if (!opts.silent) setLoading(false)
    }
  }

  useEffect(() => {
    setUser(getUser())
    loadAll()

    // Auto-refresh while the page is visible. The owner's view doesn't
    // otherwise know when an invitee accepts on their own device — without
    // this poll, members appear to "vanish" until the owner manually
    // hits Шинэчлэх. 12s is short enough to feel live but light on the API.
    const POLL_MS = 12_000
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return
      loadAll({ silent: true })
    }, POLL_MS)

    // Refresh immediately when the tab regains focus — covers the common
    // "owner switches tabs to check" flow without waiting for the next tick.
    const onVisibility = () => {
      if (document.visibilityState === 'visible') loadAll({ silent: true })
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  function handleStartSubscription() {
    // Send the user to the proper checkout flow on /subscription so they
    // pick a tier (Pro / Premium) and pay through PaymentModal. Calling
    // /api/subscription/activate directly bypasses the tier selection and
    // leaves relationship_status / accountType out of sync — that's what
    // caused the "Pro card still shows Cancel/Extend after buying
    // Premium" bug.
    router.push('/subscription')
  }

  async function handleCreateFamily() {
    try {
      await apiFetch('/api/family', { method: 'POST', body: JSON.stringify({}) })
      flash('success', 'Гэр бүл үүслээ')
      loadAll()
    } catch (err) {
      flash('error', err instanceof Error ? err.message : 'Үүсгэхэд алдаа')
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!inviteEmail.trim()) return
    setInviteSubmitting(true)
    try {
      await apiFetch('/api/family/invite', {
        method: 'POST',
        body: JSON.stringify({ email: inviteEmail.trim() }),
      })
      flash('success', 'Урилга илгээгдлээ')
      setInviteEmail('')
      setShowInvite(false)
      loadAll()
    } catch (err) {
      flash('error', err instanceof Error ? err.message : 'Илгээхэд алдаа')
    } finally {
      setInviteSubmitting(false)
    }
  }

  async function handleAcceptInvite(id: string) {
    try {
      await apiFetch(`/api/family/invitations/${id}/accept`, { method: 'POST' })
      flash('success', 'Урилгыг хүлээн авлаа')
      loadAll()
    } catch (err) {
      flash('error', err instanceof Error ? err.message : 'Алдаа')
    }
  }

  async function handleDeclineInvite(id: string) {
    try {
      await apiFetch(`/api/family/invitations/${id}/decline`, { method: 'POST' })
      flash('success', 'Урилгыг татгалзлаа')
      loadAll()
    } catch (err) {
      flash('error', err instanceof Error ? err.message : 'Алдаа')
    }
  }

  async function handleCancelInvite(id: string) {
    try {
      await apiFetch(`/api/family/invitations/${id}/cancel`, { method: 'POST' })
      flash('success', 'Урилга цуцлагдлаа')
      loadAll()
    } catch (err) {
      flash('error', err instanceof Error ? err.message : 'Алдаа')
    }
  }

  async function handleRemoveMember(userId: string) {
    if (!confirm('Энэ гишүүнийг хасах уу? Тэдний өгөгдөл устахгүй.')) return
    try {
      await apiFetch(`/api/family/members/${userId}`, { method: 'DELETE' })
      flash('success', 'Гишүүн хасагдлаа')
      loadAll()
    } catch (err) {
      flash('error', err instanceof Error ? err.message : 'Алдаа')
    }
  }

  async function handleLeave() {
    if (!confirm('Гэр бүлээс гарах уу?')) return
    try {
      await apiFetch(`/api/family/members/${user?.id}`, { method: 'DELETE' })
      flash('success', 'Та гэр бүлээс гарлаа')
      loadAll()
    } catch (err) {
      flash('error', err instanceof Error ? err.message : 'Алдаа')
    }
  }

  async function handleDisband() {
    if (!confirm('Гэр бүлийг тарах уу? Бүх гишүүдийн харах эрх таслагдана. Өгөгдөл устахгүй.')) return
    try {
      await apiFetch('/api/family', { method: 'DELETE' })
      flash('success', 'Гэр бүл тарагдлаа')
      loadAll()
    } catch (err) {
      flash('error', err instanceof Error ? err.message : 'Алдаа')
    }
  }

  async function openMemberEntries(member: FamilyMember) {
    setSelectedMember(member)
    setEntriesDate(todayStr())
    await loadMemberEntries(member.userId, todayStr())
  }

  async function loadMemberEntries(userId: string, date: string) {
    setEntriesLoading(true)
    setEntriesError('')
    try {
      const res = await apiFetch<MemberEntriesResponse>(
        `/api/family/members/${userId}/entries?date=${date}`
      )
      setEntries(res.transactions)
    } catch (err) {
      setEntriesError(err instanceof Error ? err.message : 'Алдаа')
      setEntries([])
    } finally {
      setEntriesLoading(false)
    }
  }

  function closeEntries() {
    setSelectedMember(null)
    setEntries([])
    setEntriesError('')
  }

  async function openMemberProfile(member: FamilyMember) {
    setProfileMember(member)
    setMemberProfile(null)
    setProfileError('')
    setProfileLoading(true)
    try {
      const res = await apiFetch<MemberProfileResponse>(
        `/api/family/members/${member.userId}/profile`
      )
      setMemberProfile(res.profile)
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Алдаа')
    } finally {
      setProfileLoading(false)
    }
  }

  function closeProfile() {
    setProfileMember(null)
    setMemberProfile(null)
    setProfileError('')
  }

  async function openMemberGoals(member: FamilyMember) {
    setGoalsMember(member)
    setMemberGoals([])
    setGoalsError('')
    setGoalsLoading(true)
    try {
      const res = await apiFetch<MemberGoalsResponse>(
        `/api/family/members/${member.userId}/goals`,
      )
      setMemberGoals(res.goals)
    } catch (err) {
      setGoalsError(err instanceof Error ? err.message : 'Алдаа')
    } finally {
      setGoalsLoading(false)
    }
  }

  function closeGoals() {
    setGoalsMember(null)
    setMemberGoals([])
    setGoalsError('')
  }

  async function loadFamilyTransactions() {
    setFamilyTxLoading(true)
    setFamilyTxError('')
    try {
      const res = await apiFetch<{ transactions: FamilyTransaction[] }>(
        '/api/family/transactions'
      )
      setFamilyTx(res.transactions)
    } catch (err) {
      setFamilyTxError(err instanceof Error ? err.message : 'Алдаа')
      setFamilyTx([])
    } finally {
      setFamilyTxLoading(false)
    }
  }

  async function handlePickRole(role: FamilyRole) {
    setRoleSubmitting(role)
    try {
      await apiFetch('/api/family/role', {
        method: 'PUT',
        body: JSON.stringify({ familyRole: role }),
      })
      flash('success', `${familyRoleLabel(role)} болж сонголоо`)
      setShowRolePicker(false)
      loadAll({ silent: true })
    } catch (err) {
      flash('error', err instanceof Error ? err.message : 'Алдаа')
    } finally {
      setRoleSubmitting(null)
    }
  }

  // Roles already taken by other members of this family (so the picker
  // hides them — the DB enforces uniqueness anyway, but disabling the
  // option in the UI is friendlier than a 409 after a click).
  const takenRoles = useMemo<Set<FamilyRole>>(() => {
    const s = new Set<FamilyRole>()
    members.forEach(m => {
      if (m.familyRole && m.userId !== user?.id) s.add(m.familyRole)
    })
    return s
  }, [members, user?.id])

  // Aggregate family transactions by category for the categories card.
  // We keep two parallel maps (income / expense) so the panel can show
  // both flavors and the tooltip can slice by category.
  const familyCategoryStats = useMemo(() => {
    const income = new Map<string, { total: number; entries: FamilyTransaction[] }>()
    const expense = new Map<string, { total: number; entries: FamilyTransaction[] }>()
    for (const t of familyTx) {
      const bucket = t.type === 'income' ? income : expense
      const cur = bucket.get(t.category) ?? { total: 0, entries: [] }
      cur.total += t.amount
      cur.entries.push(t)
      bucket.set(t.category, cur)
    }
    const sortByTotal = (
      a: [string, { total: number; entries: FamilyTransaction[] }],
      b: [string, { total: number; entries: FamilyTransaction[] }],
    ) => b[1].total - a[1].total
    return {
      income: Array.from(income.entries()).sort(sortByTotal),
      expense: Array.from(expense.entries()).sort(sortByTotal),
    }
  }, [familyTx])

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-mood-primary" />
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-8">
      <motion.div
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.06 } } }}
        className="space-y-6"
      >
        <motion.header variants={fadeUp} className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-mood-ink lg:text-3xl">
              {isCouple ? 'Хос' : 'Гэр бүл'}
            </h1>
            <p className="mt-0.5 text-sm text-mood-muted">
              {isCouple
                ? 'Хамтран хяналт тавих хосоо удирдах'
                : 'Хамтран хяналт тавих гэр бүлийн нөхдөө удирдах'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => loadAll()}
            className="inline-flex items-center gap-2 rounded-full border border-mood-primary/15 bg-white px-3 py-2 text-xs font-semibold text-mood-ink/80 transition hover:border-mood-primary/40 hover:text-mood-primary"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Шинэчлэх
          </button>
        </motion.header>

        <AnimatePresence>
          {actionMsg && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className={`flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm ${
                actionMsg.kind === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-rose-200 bg-rose-50 text-rose-700'
              }`}
            >
              {actionMsg.kind === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
              {actionMsg.text}
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <div className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            <AlertTriangle className="h-4 w-4" />
            {error}
          </div>
        )}

        {incomingInvites.length > 0 && (
          <motion.div
            variants={fadeUp}
            className="rounded-3xl border border-amber-200 bg-amber-50 p-5"
          >
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-amber-800">
              <Mail className="h-4 w-4" />
              Танд ирсэн урилга
            </h3>
            <div className="space-y-2">
              {incomingInvites.map(inv => (
                <div
                  key={inv.id}
                  className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="text-sm">
                    <p className="font-semibold text-mood-ink">{inv.familyName}</p>
                    <p className="text-xs text-mood-muted">{inv.inviterName} танд урилга илгээлээ</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAcceptInvite(inv.id)}
                      className="rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-600"
                    >
                      Зөвшөөрөх
                    </button>
                    <button
                      onClick={() => handleDeclineInvite(inv.id)}
                      className="rounded-full border border-mood-primary/15 bg-white px-3 py-1.5 text-xs font-semibold text-mood-ink/70 transition hover:border-mood-primary/40"
                    >
                      Татгалзах
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {!family && !subscriptionActive && incomingInvites.length === 0 && (
          <motion.div variants={fadeUp}>
            <PaywallCard onActivate={handleStartSubscription} isCouple={!!isCouple} />
          </motion.div>
        )}

        {!family && subscriptionActive && (
          <motion.div variants={fadeUp}>
            <CreateFamilyCard onCreate={handleCreateFamily} isCouple={!!isCouple} />
          </motion.div>
        )}

        {family && (
          <>
            {!family.ownerSubscriptionActive && (
              <motion.div
                variants={fadeUp}
                className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
              >
                <ShieldAlert className="h-5 w-5 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Owner-н subscription идэвхгүй байна</p>
                  <p className="mt-0.5 text-xs opacity-90">
                    Гишүүдийн санхүүгийн тэмдэглэлийг харах эрх түр зогссон. Owner subscription-аа сэргээснээр сэргэнэ. Өгөгдөл устаагүй.
                  </p>
                </div>
              </motion.div>
            )}

            <motion.div
              variants={fadeUp}
              className="rounded-3xl border border-mood-primary/10 bg-mood-card p-6 shadow-[0_4px_24px_-12px_rgba(var(--mood-shadow-rgb),0.10)]"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-mood-primary to-mood-deep text-white shadow-md shadow-mood-primary/25">
                    <Users className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="font-display text-xl font-bold text-mood-ink">{family.name}</h2>
                    <p className="text-sm text-mood-muted">
                      {members.length} / {memberLimit} гишүүн
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowRolePicker(true)}
                      className="mt-1.5 inline-flex items-center gap-1.5 rounded-full border border-mood-primary/15 bg-white px-2.5 py-1 text-[11px] font-semibold text-mood-ink/70 transition hover:border-mood-primary/40 hover:text-mood-primary"
                    >
                      <Heart className="h-3 w-3" />
                      {family.myFamilyRole
                        ? `Та: ${familyRoleLabel(family.myFamilyRole)}`
                        : isCouple ? 'Хосын үүрэг сонгох' : 'Гэр бүлийн үүрэг сонгох'}
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {isOwner && (
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setShowInvite(true)}
                      disabled={members.length >= memberLimit || !subscriptionActive}
                      className="inline-flex items-center gap-2 rounded-full bg-mood-primary px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-mood-primary/25 transition hover:bg-mood-deep disabled:cursor-not-allowed disabled:bg-mood-muted/40 disabled:shadow-none"
                      title={
                        members.length >= memberLimit
                          ? `${memberLimit} гишүүний хязгаарт хүрсэн байна`
                          : !subscriptionActive
                          ? 'Subscription идэвхгүй байна'
                          : ''
                      }
                    >
                      <UserPlus className="h-4 w-4" />
                      {isCouple ? 'Хосоо нэмэх' : 'Гишүүн нэмэх'}
                    </motion.button>
                  )}
                  {isOwner ? (
                    <button
                      onClick={handleDisband}
                      className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-100"
                    >
                      <Trash2 className="h-4 w-4" />
                      {isCouple ? 'Хосоо тараах' : 'Гэр бүл тараах'}
                    </button>
                  ) : (
                    <button
                      onClick={handleLeave}
                      className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-100"
                    >
                      <LogOut className="h-4 w-4" />
                      Гарах
                    </button>
                  )}
                </div>
              </div>
            </motion.div>

            <motion.div
              variants={fadeUp}
              className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            >
              {members.map(m => (
                <MemberCard
                  key={m.userId}
                  member={m}
                  isMe={m.userId === user?.id}
                  canView={family.ownerSubscriptionActive}
                  canRemove={isOwner && m.role !== 'owner' && m.userId !== user?.id}
                  onView={() => openMemberEntries(m)}
                  onViewProfile={() => openMemberProfile(m)}
                  onViewGoals={() => openMemberGoals(m)}
                  onRemove={() => handleRemoveMember(m.userId)}
                />
              ))}
            </motion.div>

            {family.ownerSubscriptionActive && (
              <motion.div variants={fadeUp}>
                <FamilyCategoriesPanel
                  loading={familyTxLoading}
                  error={familyTxError}
                  income={familyCategoryStats.income}
                  expense={familyCategoryStats.expense}
                  hovered={hoveredCategory}
                  setHovered={setHoveredCategory}
                  onRefresh={() => loadFamilyTransactions()}
                  isCouple={isCouple}
                />
              </motion.div>
            )}

            {isOwner && outgoingInvites.filter(i => i.status === 'pending').length > 0 && (
              <motion.div
                variants={fadeUp}
                className="rounded-3xl border border-mood-primary/10 bg-mood-card p-5 shadow-[0_4px_24px_-12px_rgba(var(--mood-shadow-rgb),0.10)]"
              >
                <h3 className="mb-3 font-display text-sm font-bold text-mood-ink">
                  Хүлээгдэж буй урилгууд
                </h3>
                <div className="space-y-2">
                  {outgoingInvites
                    .filter(i => i.status === 'pending')
                    .map(inv => (
                      <div
                        key={inv.id}
                        className="flex items-center justify-between rounded-xl border border-mood-primary/10 bg-white px-3 py-2"
                      >
                        <div className="text-sm">
                          <p className="font-semibold text-mood-ink">{inv.invitedEmail}</p>
                          <p className="text-xs text-mood-muted">
                            {new Date(inv.expiresAt).toLocaleDateString()} хүртэл хүчинтэй
                          </p>
                        </div>
                        <button
                          onClick={() => handleCancelInvite(inv.id)}
                          aria-label="Урилга цуцлах"
                          className="rounded-lg p-1.5 text-mood-muted transition hover:bg-rose-50 hover:text-rose-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                </div>
              </motion.div>
            )}
          </>
        )}
      </motion.div>

      {/* Invite modal */}
      <AnimatePresence>
        {showInvite && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-mood-ink/40 backdrop-blur-sm" onClick={() => setShowInvite(false)} />
            <motion.div
              initial={{ scale: 0.94, y: 12, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="relative z-10 w-full max-w-md rounded-3xl border border-mood-primary/10 bg-mood-card p-6 shadow-2xl shadow-mood-primary/20"
            >
              <button
                onClick={() => setShowInvite(false)}
                aria-label="Close"
                className="absolute right-3 top-3 rounded-lg p-1.5 text-mood-muted transition hover:bg-mood-primary/8 hover:text-mood-primary"
              >
                <X className="h-5 w-5" />
              </button>
              <h3 className="font-display text-lg font-bold text-mood-ink">Гишүүн урих</h3>
              <p className="mt-1 text-sm text-mood-muted">
                И-мэйл хаягаар урилга илгээх. Бүртгэлтэй хэрэглэгч апп дотроо мэдэгдэл хүлээн авна.
              </p>
              <form onSubmit={handleInvite} className="mt-5 space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-mood-muted">И-мэйл</label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    placeholder="email@example.com"
                    required
                    className="w-full rounded-xl border border-mood-primary/15 bg-white px-3.5 py-2.5 text-sm text-mood-ink placeholder:text-mood-muted/60 transition-all focus:border-mood-primary focus:outline-none focus:ring-4 focus:ring-mood-primary/15"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowInvite(false)}
                    className="flex-1 rounded-full border border-mood-primary/15 bg-white px-4 py-2.5 text-sm font-semibold text-mood-ink/80 transition hover:border-mood-primary/40"
                  >
                    Цуцлах
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={inviteSubmitting || !inviteEmail.trim()}
                    className="flex flex-1 items-center justify-center gap-2 rounded-full bg-mood-primary px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-mood-primary/25 transition hover:bg-mood-deep disabled:opacity-50"
                  >
                    {inviteSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                    Илгээх
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Family role picker */}
      <AnimatePresence>
        {showRolePicker && family && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className="absolute inset-0 bg-mood-ink/40 backdrop-blur-sm"
              onClick={() => setShowRolePicker(false)}
            />
            <motion.div
              initial={{ scale: 0.94, y: 12, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="relative z-10 w-full max-w-md rounded-3xl border border-mood-primary/10 bg-mood-card p-6 shadow-2xl shadow-mood-primary/20"
            >
              <button
                onClick={() => setShowRolePicker(false)}
                aria-label="Close"
                className="absolute right-3 top-3 rounded-lg p-1.5 text-mood-muted transition hover:bg-mood-primary/8 hover:text-mood-primary"
              >
                <X className="h-5 w-5" />
              </button>
              <h3 className="font-display text-lg font-bold text-mood-ink">
                {isCouple ? 'Та хосдоо хэн бэ?' : 'Та гэр бүлд хэн бэ?'}
              </h3>
              <p className="mt-1 text-sm text-mood-muted">
                {isCouple
                  ? 'Хосын дотор үүргээ сонгоно уу. Нэг үүргийг зөвхөн нэг гишүүн авч болно.'
                  : 'Гэр бүл доторх үүргээ сонгоно уу. Нэг үүргийг зөвхөн нэг гишүүн авч болно.'}
              </p>

              <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {FAMILY_ROLE_OPTIONS.filter(opt => rolesForKind(isCouple ? 'couple' : 'family').includes(opt.value)).map(opt => {
                  const taken = takenRoles.has(opt.value)
                  const mine = family.myFamilyRole === opt.value
                  const disabled = taken || roleSubmitting !== null
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handlePickRole(opt.value)}
                      disabled={disabled}
                      title={
                        taken
                          ? 'Энэ үүргийг өөр гишүүн сонгосон байна'
                          : ''
                      }
                      className={`flex flex-col items-center justify-center gap-1.5 rounded-2xl border p-4 text-sm font-semibold transition ${
                        mine
                          ? 'border-mood-primary bg-mood-primary/10 text-mood-primary'
                          : taken
                          ? 'cursor-not-allowed border-mood-primary/10 bg-mood-cream/40 text-mood-muted/60'
                          : 'border-mood-primary/15 bg-white text-mood-ink hover:border-mood-primary/40 hover:bg-mood-primary/5'
                      }`}
                    >
                      <span className="text-2xl">{opt.emoji}</span>
                      <span>{opt.label}</span>
                      {roleSubmitting === opt.value && (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      )}
                      {taken && !mine && (
                        <span className="text-[10px] font-normal text-mood-muted">
                          Сонгогдсон
                        </span>
                      )}
                      {mine && (
                        <span className="text-[10px] font-normal text-mood-primary">
                          Таны үүрэг
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>

              {family.myFamilyRole && (
                <button
                  type="button"
                  onClick={async () => {
                    setRoleSubmitting(family.myFamilyRole as FamilyRole)
                    try {
                      await apiFetch('/api/family/role', {
                        method: 'PUT',
                        body: JSON.stringify({ familyRole: null }),
                      })
                      flash('success', 'Үүрэг цэвэрлэгдлээ')
                      loadAll({ silent: true })
                    } catch (err) {
                      flash('error', err instanceof Error ? err.message : 'Алдаа')
                    } finally {
                      setRoleSubmitting(null)
                    }
                  }}
                  className="mt-4 w-full rounded-full border border-mood-primary/15 bg-white px-4 py-2 text-xs font-semibold text-mood-ink/70 transition hover:border-mood-primary/40"
                >
                  Үүргийг цэвэрлэх
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile viewer (read-only) */}
      <AnimatePresence>
        {profileMember && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-mood-ink/40 backdrop-blur-sm" onClick={closeProfile} />
            <motion.div
              initial={{ scale: 0.94, y: 12, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="relative z-10 flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-mood-primary/10 bg-mood-card shadow-2xl shadow-mood-primary/20"
            >
              <div className="flex items-start justify-between gap-4 border-b border-mood-primary/10 p-5">
                <div className="flex-1">
                  <h3 className="font-display text-lg font-bold text-mood-ink">
                    Профайл
                    <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-mood-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-mood-primary">
                      <Lock className="h-3 w-3" />
                      Зөвхөн харах
                    </span>
                  </h3>
                  <p className="mt-1 text-xs text-mood-muted">Гэр бүлийн гишүүний мэдээлэл</p>
                </div>
                <button
                  onClick={closeProfile}
                  aria-label="Close"
                  className="rounded-lg p-1.5 text-mood-muted transition hover:bg-mood-primary/8 hover:text-mood-primary"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5">
                {profileError && (
                  <div className="mb-3 flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    <AlertTriangle className="h-4 w-4" />
                    {profileError}
                  </div>
                )}
                {profileLoading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="h-6 w-6 animate-spin text-mood-primary" />
                  </div>
                ) : memberProfile ? (
                  <div className="space-y-5">
                    <div className="flex items-center gap-4">
                      {memberProfile.avatar ? (
                        <img
                          src={memberProfile.avatar}
                          alt={memberProfile.name}
                          className="h-16 w-16 rounded-full object-cover ring-2 ring-mood-primary/15"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%23ddd"/></svg>'
                          }}
                        />
                      ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-mood-primary to-mood-deep text-base font-bold text-white shadow-md shadow-mood-primary/25">
                          {memberProfile.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-display text-base font-bold text-mood-ink">{memberProfile.name}</p>
                        <p className="truncate text-xs text-mood-muted">{memberProfile.email}</p>
                      </div>
                    </div>

                    <ul className="divide-y divide-mood-primary/8 rounded-2xl border border-mood-primary/10 bg-white">
                      <ProfileRow label="Нэр" value={memberProfile.name} />
                      <ProfileRow label="И-мэйл" value={memberProfile.email} />
                      <ProfileRow
                        label="Нас"
                        value={memberProfile.age != null ? String(memberProfile.age) : '—'}
                      />
                      <ProfileRow
                        label="Хүйс"
                        value={
                          memberProfile.gender === 'male'
                            ? 'Эрэгтэй'
                            : memberProfile.gender === 'female'
                            ? 'Эмэгтэй'
                            : '—'
                        }
                      />
                      <ProfileRow label="Валют" value={memberProfile.currency || '—'} />
                    </ul>

                    <p className="text-center text-[11px] text-mood-muted">
                      Та зөвхөн харах эрхтэй. Өгөгдлийг засах боломжгүй.
                    </p>
                  </div>
                ) : null}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Goals viewer (read-only) */}
      <AnimatePresence>
        {goalsMember && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-mood-ink/40 backdrop-blur-sm" onClick={closeGoals} />
            <motion.div
              initial={{ scale: 0.94, y: 12, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="relative z-10 flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-mood-primary/10 bg-mood-card shadow-2xl shadow-mood-primary/20"
            >
              <div className="flex items-start justify-between gap-4 border-b border-mood-primary/10 p-5">
                <div className="flex-1">
                  <h3 className="font-display text-lg font-bold text-mood-ink">
                    {goalsMember.name}-ийн зорилго
                    <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-mood-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-mood-primary">
                      <Lock className="h-3 w-3" />
                      Зөвхөн харах
                    </span>
                  </h3>
                  <p className="mt-1 text-xs text-mood-muted">{goalsMember.email}</p>
                </div>
                <button
                  onClick={closeGoals}
                  aria-label="Close"
                  className="rounded-lg p-1.5 text-mood-muted transition hover:bg-mood-primary/8 hover:text-mood-primary"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5">
                {goalsError && (
                  <div className="mb-3 flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    <AlertTriangle className="h-4 w-4" />
                    {goalsError}
                  </div>
                )}
                {goalsLoading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="h-6 w-6 animate-spin text-mood-primary" />
                  </div>
                ) : memberGoals.length === 0 && !goalsError ? (
                  <div className="py-10 text-center text-sm text-mood-muted">
                    Энэ гишүүнд зорилго бүртгэгдээгүй байна
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {memberGoals.map((g) => {
                      const percent = g.targetAmount > 0
                        ? Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100))
                        : 0
                      const isCompleted = g.currentAmount >= g.targetAmount
                      const remaining = Math.max(0, g.targetAmount - g.currentAmount)
                      return (
                        <li
                          key={g.id}
                          className="overflow-hidden rounded-2xl border border-mood-primary/10 bg-white"
                        >
                          {g.image && (
                            <div className="h-32 overflow-hidden bg-mood-cream">
                              <img
                                src={g.image}
                                alt={g.name}
                                className="h-full w-full object-contain"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                              />
                            </div>
                          )}
                          <div className="p-4">
                            <div className="flex items-start gap-3">
                              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-mood-primary to-mood-deep text-white shadow-md shadow-mood-primary/25">
                                <Target className="h-5 w-5" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-mood-ink">{g.name}</p>
                                <div className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-mood-muted">
                                  <Calendar className="h-3 w-3" />
                                  {g.deadline}
                                </div>
                              </div>
                              {isCompleted && (
                                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                                  Хийсэн
                                </span>
                              )}
                            </div>

                            <div className="mt-3 flex items-baseline justify-between">
                              <span className="font-display text-base font-bold tabular-nums text-mood-ink">
                                {formatCurrency(g.currentAmount)}
                              </span>
                              <span className="text-xs text-mood-muted">
                                / {formatCurrency(g.targetAmount)}
                              </span>
                            </div>

                            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-mood-cream">
                              <div
                                className={`h-full rounded-full ${
                                  isCompleted
                                    ? 'bg-gradient-to-r from-emerald-400 to-emerald-600'
                                    : 'bg-gradient-to-r from-mood-primary to-mood-deep'
                                }`}
                                style={{ width: `${percent}%` }}
                              />
                            </div>

                            <div className="mt-2 flex items-center justify-between text-xs">
                              <span className={`font-semibold ${isCompleted ? 'text-emerald-600' : 'text-mood-primary'}`}>
                                {percent}%
                              </span>
                              {!isCompleted && (
                                <span className="text-mood-muted">
                                  Үлдсэн: <span className="tabular-nums font-semibold text-mood-ink">{formatCurrency(remaining)}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                )}

                <p className="mt-4 text-center text-[11px] text-mood-muted">
                  Та зөвхөн харах эрхтэй. Зорилгыг засах боломжгүй.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Entries viewer */}
      <AnimatePresence>
        {selectedMember && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-mood-ink/40 backdrop-blur-sm" onClick={closeEntries} />
            <motion.div
              initial={{ scale: 0.94, y: 12, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="relative z-10 flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-mood-primary/10 bg-mood-card shadow-2xl shadow-mood-primary/20"
            >
              <div className="flex items-start justify-between gap-4 border-b border-mood-primary/10 p-5">
                <div className="flex-1">
                  <h3 className="font-display text-lg font-bold text-mood-ink">
                    {selectedMember.name}-ийн тэмдэглэл
                    <span className="ml-2 rounded-full bg-mood-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-mood-primary">
                      Зөвхөн харах
                    </span>
                  </h3>
                  <p className="mt-1 text-xs text-mood-muted">{selectedMember.email}</p>
                </div>
                <button
                  onClick={closeEntries}
                  aria-label="Close"
                  className="rounded-lg p-1.5 text-mood-muted transition hover:bg-mood-primary/8 hover:text-mood-primary"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-3 border-b border-mood-primary/10 bg-mood-cream/40 p-5">
                <input
                  type="date"
                  value={entriesDate}
                  onChange={(e) => {
                    setEntriesDate(e.target.value)
                    loadMemberEntries(selectedMember.userId, e.target.value)
                  }}
                  className="rounded-xl border border-mood-primary/15 bg-white px-3 py-2 text-sm text-mood-ink transition-all focus:border-mood-primary focus:outline-none focus:ring-2 focus:ring-mood-primary/20"
                />
                <div className="ml-auto flex gap-4 text-xs">
                  <div>
                    <span className="text-mood-muted">Орлого: </span>
                    <span className="font-display font-bold text-emerald-600">{formatCurrency(totalIncome)}</span>
                  </div>
                  <div>
                    <span className="text-mood-muted">Зарлага: </span>
                    <span className="font-display font-bold text-rose-600">{formatCurrency(totalExpense)}</span>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-5">
                {entriesError && (
                  <div className="mb-3 flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    <AlertTriangle className="h-4 w-4" />
                    {entriesError}
                  </div>
                )}
                {entriesLoading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="h-6 w-6 animate-spin text-mood-primary" />
                  </div>
                ) : entries.length === 0 && !entriesError ? (
                  <div className="py-10 text-center text-sm text-mood-muted">
                    Энэ өдөрт тэмдэглэл байхгүй байна
                  </div>
                ) : (
                  <ul className="divide-y divide-mood-primary/8">
                    {entries.map(t => (
                      <li key={t.id} className="flex items-center gap-3 py-3">
                        <div
                          className={`h-2 w-2 flex-shrink-0 rounded-full ${
                            t.type === 'income' ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-sm font-semibold text-mood-ink">{t.title}</p>
                          <p className="text-xs text-mood-muted">{t.category}</p>
                        </div>
                        <p
                          className={`font-display text-sm font-bold tabular-nums ${
                            t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {t.type === 'income' ? '+' : '-'} {formatCurrency(t.amount)}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function PaywallCard({ onActivate, isCouple }: { onActivate: () => void; isCouple: boolean }) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-mood-primary/10 bg-gradient-to-br from-mood-primary via-mood-deep to-mood-primary p-8 text-center text-white shadow-xl shadow-mood-primary/25">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(circle at 80% 100%, rgba(255,200,120,0.20), transparent 50%)' }}
      />
      <div className="relative">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/20">
          {isCouple ? <Heart className="h-7 w-7" /> : <Crown className="h-7 w-7" />}
        </div>
        <h2 className="font-display text-xl font-extrabold tracking-tight">
          {isCouple
            ? 'Хос үүсгэхийн тулд Pro багц шаардлагатай'
            : 'Гэр бүл үүсгэхийн тулд Премиум багц шаардлагатай'}
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-white/85">
          {isCouple
            ? 'Owner болж хамтрагчаа урин, бие биенийхээ санхүүгийн тэмдэглэлийг харах боломжтой.'
            : 'Owner болж 4 хүртэл гишүүнтэй гэр бүл үүсгэн, бие биенийхээ санхүүгийн тэмдэглэлийг харах боломжтой.'}
        </p>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onActivate}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-mood-deep shadow-xl shadow-black/15 transition hover:bg-mood-cream"
        >
          {isCouple ? <Heart className="h-4 w-4" /> : <Crown className="h-4 w-4" />}
          Subscription идэвхжүүлэх
        </motion.button>
        <p className="mx-auto mt-4 max-w-md text-xs text-white/70">
          {isCouple
            ? <>Subscription-тэй найз таныг хосоор и-мэйлээр уривал та <span className="font-semibold text-white">үнэгүй</span> нэгдэх боломжтой.</>
            : <>Subscription-тэй найз эсвэл гэр бүлийн гишүүн таныг и-мэйлээр уривал та <span className="font-semibold text-white">үнэгүй</span> нэгдэх боломжтой.</>}
        </p>
      </div>
    </div>
  )
}

function CreateFamilyCard({ onCreate, isCouple }: { onCreate: () => void; isCouple: boolean }) {
  return (
    <div className="rounded-3xl border border-mood-primary/10 bg-mood-card p-8 text-center shadow-[0_4px_24px_-12px_rgba(var(--mood-shadow-rgb),0.10)]">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-mood-primary/10">
        {isCouple ? <Heart className="h-7 w-7 text-mood-primary" /> : <Users className="h-7 w-7 text-mood-primary" />}
      </div>
      <h2 className="font-display text-xl font-bold text-mood-ink">
        {isCouple ? 'Хосоо бүртгэе' : 'Гэр бүлээ үүсгэе'}
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-mood-muted">
        {isCouple
          ? 'Та owner болон 1 хосын хагасыг урих боломжтой (нийт 2 хүн).'
          : 'Та owner болон 4 хүртэлх гишүүнтэй гэр бүл үүсгэх боломжтой.'}
      </p>
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={onCreate}
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-mood-primary px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-mood-primary/25 transition hover:bg-mood-deep"
      >
        {isCouple ? <Heart className="h-4 w-4" /> : <Users className="h-4 w-4" />}
        {isCouple ? 'Хосоо үүсгэх' : 'Гэр бүл үүсгэх'}
      </motion.button>
    </div>
  )
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex items-center justify-between gap-3 px-4 py-3">
      <span className="text-xs font-semibold uppercase tracking-wider text-mood-muted">{label}</span>
      <span className="truncate text-sm font-medium text-mood-ink">{value}</span>
    </li>
  )
}

type CategoryEntry = [string, { total: number; entries: FamilyTransaction[] }]

function FamilyCategoriesPanel({
  loading,
  error,
  income,
  expense,
  hovered,
  setHovered,
  onRefresh,
  isCouple,
}: {
  loading: boolean
  error: string
  income: CategoryEntry[]
  expense: CategoryEntry[]
  hovered: string | null
  setHovered: (v: string | null) => void
  onRefresh: () => void
  isCouple: boolean
}) {
  const isEmpty = !loading && income.length === 0 && expense.length === 0 && !error
  return (
    <div className="rounded-3xl border border-mood-primary/10 bg-mood-card p-5 shadow-[0_4px_24px_-12px_rgba(var(--mood-shadow-rgb),0.10)]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-base font-bold text-mood-ink">
            {isCouple ? 'Хосын нийт ангилал' : 'Гэр бүлийн нийт ангилал'}
          </h3>
          <p className="text-xs text-mood-muted">
            Ангилал дээр хулганаар очиход хэн орлого/зарлага хийсэн харагдана
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex items-center gap-1.5 rounded-full border border-mood-primary/15 bg-white px-3 py-1.5 text-[11px] font-semibold text-mood-ink/70 transition hover:border-mood-primary/40 hover:text-mood-primary"
        >
          <RefreshCw className="h-3 w-3" />
          Шинэчлэх
        </button>
      </div>

      {error && (
        <div className="mb-3 flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <AlertTriangle className="h-4 w-4" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-mood-primary" />
        </div>
      ) : isEmpty ? (
        <div className="py-10 text-center text-sm text-mood-muted">
          {isCouple ? 'Хосдоо бүртгэгдсэн орлого/зарлага байхгүй байна' : 'Гэр бүлд бүртгэгдсэн орлого/зарлага байхгүй байна'}
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <CategoryGroup
            title="Орлого"
            tone="income"
            entries={income}
            hovered={hovered}
            setHovered={setHovered}
          />
          <CategoryGroup
            title="Зарлага"
            tone="expense"
            entries={expense}
            hovered={hovered}
            setHovered={setHovered}
          />
        </div>
      )}
    </div>
  )
}

function CategoryGroup({
  title,
  tone,
  entries,
  hovered,
  setHovered,
}: {
  title: string
  tone: 'income' | 'expense'
  entries: CategoryEntry[]
  hovered: string | null
  setHovered: (v: string | null) => void
}) {
  const Icon = tone === 'income' ? TrendingUp : TrendingDown
  const accent =
    tone === 'income'
      ? 'text-emerald-600 bg-emerald-50 border-emerald-100'
      : 'text-rose-600 bg-rose-50 border-rose-100'
  const numberClass = tone === 'income' ? 'text-emerald-600' : 'text-rose-600'

  return (
    <div className="rounded-2xl border border-mood-primary/10 bg-white p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className={`inline-flex h-7 w-7 items-center justify-center rounded-lg border ${accent}`}>
          <Icon className="h-3.5 w-3.5" />
        </span>
        <h4 className="font-display text-sm font-bold text-mood-ink">{title}</h4>
      </div>
      {entries.length === 0 ? (
        <p className="py-4 text-center text-xs text-mood-muted">
          {title === 'Орлого' ? 'Орлого алга' : 'Зарлага алга'}
        </p>
      ) : (
        <ul className="space-y-1.5">
          {entries.map(([category, info]) => {
            const key = `${tone}:${category}`
            const isHovered = hovered === key
            // Group totals per member so the tooltip shows "Аав: 100,000₮"
            // rather than dumping every individual entry.
            const perMember = new Map<string, { name: string; role: FamilyRole | null; total: number; count: number }>()
            for (const tx of info.entries) {
              const existing = perMember.get(tx.memberId) ?? {
                name: tx.memberName,
                role: tx.memberFamilyRole,
                total: 0,
                count: 0,
              }
              existing.total += tx.amount
              existing.count += 1
              perMember.set(tx.memberId, existing)
            }
            const breakdown = Array.from(perMember.values()).sort((a, b) => b.total - a.total)
            return (
              <li
                key={category}
                className="relative"
                onMouseEnter={() => setHovered(key)}
                onMouseLeave={() => setHovered(null)}
              >
                <div
                  className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2 transition ${
                    isHovered
                      ? 'border-mood-primary/40 bg-mood-primary/5'
                      : 'border-transparent hover:border-mood-primary/20'
                  }`}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-mood-ink">{category}</p>
                    <p className="text-[11px] text-mood-muted">
                      {info.entries.length} тэмдэглэл
                    </p>
                  </div>
                  <span className={`font-display text-sm font-bold tabular-nums ${numberClass}`}>
                    {tone === 'income' ? '+' : '-'} {formatCurrency(info.total)}
                  </span>
                </div>

                <AnimatePresence>
                  {isHovered && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.15 }}
                      role="tooltip"
                      className="pointer-events-none absolute right-0 top-full z-20 mt-1 w-64 rounded-2xl border border-mood-primary/15 bg-white p-3 shadow-xl shadow-mood-primary/20"
                    >
                      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-mood-muted">
                        Хэн {tone === 'income' ? 'орлого' : 'зарлага'} хийсэн
                      </p>
                      <ul className="space-y-1.5">
                        {breakdown.map((b, i) => (
                          <li key={i} className="flex items-center justify-between gap-2 text-xs">
                            <span className="min-w-0 truncate text-mood-ink">
                              {b.role ? (
                                <span className="font-semibold text-mood-primary">
                                  {familyRoleLabel(b.role)}
                                </span>
                              ) : null}
                              {b.role ? ' · ' : ''}
                              <span className="text-mood-ink/80">{b.name}</span>
                              <span className="ml-1 text-mood-muted">×{b.count}</span>
                            </span>
                            <span className={`shrink-0 font-display tabular-nums font-bold ${numberClass}`}>
                              {formatCurrency(b.total)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function MemberCard({
  member,
  isMe,
  canView,
  canRemove,
  onView,
  onViewProfile,
  onViewGoals,
  onRemove,
}: {
  member: FamilyMember
  isMe: boolean
  canView: boolean
  canRemove: boolean
  onView: () => void
  onViewProfile: () => void
  onViewGoals: () => void
  onRemove: () => void
}) {
  const initials = member.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="rounded-3xl border border-mood-primary/10 bg-mood-card p-4 shadow-[0_4px_24px_-12px_rgba(var(--mood-shadow-rgb),0.10)] transition-shadow hover:shadow-[0_18px_40px_-18px_rgba(var(--mood-shadow-rgb),0.30)]"
    >
      <div className="flex items-center gap-3">
        {member.avatar ? (
          <img src={member.avatar} alt={member.name} className="h-12 w-12 rounded-full object-cover ring-2 ring-mood-primary/15" />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-mood-primary to-mood-deep text-sm font-bold text-white shadow-md shadow-mood-primary/25">
            {initials}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="truncate text-sm font-semibold text-mood-ink">
            {member.name}
            {isMe && <span className="ml-1 text-xs font-normal text-mood-muted">(та)</span>}
          </p>
          <div className="mt-0.5 flex flex-wrap items-center gap-1">
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                member.role === 'owner'
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-mood-primary/10 text-mood-primary'
              }`}
            >
              {member.role === 'owner' ? 'Owner' : 'Гишүүн'}
            </span>
            {member.familyRole && (
              <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-600">
                {familyRoleLabel(member.familyRole)}
              </span>
            )}
          </div>
          <p className="mt-1 truncate text-xs text-mood-muted">{member.email}</p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <button
          onClick={onView}
          disabled={!canView}
          title={!canView ? 'Owner-н subscription идэвхгүй байна' : 'Тэмдэглэл харах'}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-mood-primary/15 bg-white px-2 py-2 text-[11px] font-semibold text-mood-ink/80 transition hover:border-mood-primary/40 hover:text-mood-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Eye className="h-3.5 w-3.5" />
          Тэмдэглэл
        </button>
        <button
          onClick={onViewProfile}
          disabled={!canView}
          title={!canView ? 'Owner-н subscription идэвхгүй байна' : 'Профайл харах'}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-mood-primary/15 bg-white px-2 py-2 text-[11px] font-semibold text-mood-ink/80 transition hover:border-mood-primary/40 hover:text-mood-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          <IdCard className="h-3.5 w-3.5" />
          Профайл
        </button>
        <button
          onClick={onViewGoals}
          disabled={!canView}
          title={!canView ? 'Owner-н subscription идэвхгүй байна' : 'Зорилго харах'}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-mood-primary/15 bg-white px-2 py-2 text-[11px] font-semibold text-mood-ink/80 transition hover:border-mood-primary/40 hover:text-mood-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Target className="h-3.5 w-3.5" />
          Зорилго
        </button>
        {canRemove && (
          <button
            onClick={onRemove}
            aria-label="Гишүүн хасах"
            className="col-span-3 mt-1 flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-2.5 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-100"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Хасах
          </button>
        )}
      </div>
    </motion.div>
  )
}
