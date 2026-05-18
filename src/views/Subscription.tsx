'use client'
import { useEffect, useState } from 'react'
import { motion, type Variants } from 'framer-motion'
import {
  Crown,
  Heart,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  CreditCard,
  Calendar,
  Zap,
  GraduationCap,
  RotateCcw,
} from 'lucide-react'
import { apiFetch, getUser, setUser, type AuthUser } from '@/lib/clientAuth'
import { useLanguage } from '@/components/LanguageProvider'
import PaymentModal, { type DurationOption, type PaymentPlan } from '@/components/PaymentModal'

type PlanId = 'free' | 'pro' | 'premium'

interface FamilyMembership {
  kind: 'family' | 'couple'
  myRole: 'owner' | 'member'
  ownerSubscriptionActive: boolean
  ownerSubscriptionExpiresAt: string | null
}

interface PlanDef {
  id: PlanId
  paymentPlan: PaymentPlan | null  // null = free, no payment flow
  icon: typeof Crown
  accent: string
  price: string  // localized price (incl. currency)
  paidValue: string  // raw price for PaymentModal price label
  nameKey: 'subscription.planFree' | 'subscription.planPro' | 'subscription.planPremium'
  descKey: 'subscription.freeDesc' | 'subscription.proDesc' | 'subscription.premiumDesc'
  features: Array<'subscription.featureBase' | 'subscription.featureCouple' | 'subscription.featureFamily'>
}

const PLANS: PlanDef[] = [
  {
    id: 'free',
    paymentPlan: null,
    icon: GraduationCap,
    accent: '#0EA5E9',
    price: '₮0',
    paidValue: '₮0',
    nameKey: 'subscription.planFree',
    descKey: 'subscription.freeDesc',
    features: ['subscription.featureBase'],
  },
  {
    id: 'pro',
    paymentPlan: 'khos',
    icon: Heart,
    accent: '#EC4899',
    price: '₮9,900',
    paidValue: '₮9,900',
    nameKey: 'subscription.planPro',
    descKey: 'subscription.proDesc',
    features: ['subscription.featureBase', 'subscription.featureCouple'],
  },
  {
    id: 'premium',
    paymentPlan: 'gerbul',
    icon: Crown,
    accent: '#F59E0B',
    price: '₮34,900',
    paidValue: '₮34,900',
    nameKey: 'subscription.planPremium',
    descKey: 'subscription.premiumDesc',
    features: ['subscription.featureBase', 'subscription.featureCouple', 'subscription.featureFamily'],
  },
]

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
}

// Map the user's account type to the plan that unlocks it.
function planForAccountType(accountType: string | null, subscriptionActive: boolean): PlanId {
  if (!subscriptionActive) return 'free'
  if (accountType === 'gerbul') return 'premium'
  if (accountType === 'khos')   return 'pro'
  return 'free'
}

// Per-plan duration prices. MUST mirror PRICES_MNT in
// app/api/subscription/checkout/route.ts; the server is authoritative.
const PLAN_DURATION_PRICES: Record<'khos' | 'gerbul', Array<{ months: 1 | 3 | 12; mnt: number }>> = {
  khos:   [{ months: 1, mnt: 9900  }, { months: 3, mnt: 28500 }, { months: 12, mnt: 118800 }],
  gerbul: [{ months: 1, mnt: 34900 }, { months: 3, mnt: 99000 }, { months: 12, mnt: 418800 }],
}

function formatMnt(n: number): string {
  return '₮' + n.toLocaleString('en-US')
}

function buildDurationOptions(
  paymentPlan: PaymentPlan,
  t: (key: 'subscription.duration1m' | 'subscription.duration3m' | 'subscription.duration12m') => string,
): DurationOption[] {
  const tiers = PLAN_DURATION_PRICES[paymentPlan]
  const monthlyMnt = tiers[0].mnt
  return tiers.map(({ months, mnt }) => {
    const label = months === 1
      ? t('subscription.duration1m')
      : months === 3
      ? t('subscription.duration3m')
      : t('subscription.duration12m')
    const undiscounted = monthlyMnt * months
    const discountPct = undiscounted > mnt
      ? Math.round(((undiscounted - mnt) / undiscounted) * 100)
      : 0
    return {
      months,
      label,
      priceLabel: formatMnt(mnt),
      badge: discountPct > 0 ? `-${discountPct}%` : undefined,
    }
  })
}

export default function Subscription() {
  const { t, lang } = useLanguage()
  const [authUser, setAuthUserState] = useState<AuthUser | null>(null)
  const [accountType, setAccountType] = useState<string | null>(null)
  const [membership, setMembership] = useState<FamilyMembership | null>(null)
  // `pendingPlan` covers two flows: upgrading from free (purchase) and
  // renewing/extending the user's current paid plan. Both open PaymentModal
  // with the per-duration price grid.
  const [pendingPlan, setPendingPlan] = useState<PlanDef | null>(null)
  const [canceled, setCanceled] = useState(false)

  // "Invited" = joined someone else's family/couple AND their owner still has
  // an active subscription. These users inherit the plan and can't switch.
  const isInvitedMember =
    membership !== null &&
    membership.myRole === 'member' &&
    membership.ownerSubscriptionActive

  const ownSubscriptionActive = authUser?.subscriptionStatus === 'active'
  const effectiveActive = ownSubscriptionActive || isInvitedMember

  const inheritedPlanId: PlanId | null = isInvitedMember
    ? membership!.kind === 'family' ? 'premium' : 'pro'
    : null

  const currentPlanId: PlanId = inheritedPlanId
    ?? planForAccountType(accountType, ownSubscriptionActive)

  const expiresAtRaw = isInvitedMember
    ? membership!.ownerSubscriptionExpiresAt
    : authUser?.subscriptionExpiresAt ?? null

  useEffect(() => {
    const cachedUser = getUser()
    setAuthUserState(cachedUser)
    setAccountType(typeof window !== 'undefined'
      ? window.localStorage.getItem('walletHubAccountType')
      : null)

    apiFetch<AuthUser>('/api/auth/me')
      .then((me) => {
        setAuthUserState(me)
        setUser(me)
      })
      .catch(() => { /* fall back to cached */ })

    apiFetch<{ family: FamilyMembership | null }>('/api/family')
      .then((res) => setMembership(res.family))
      .catch(() => { /* no family is a valid state */ })
  }, [])

  // Open the payment modal for a brand-new purchase. Renewals reuse
  // setPendingPlan directly via the Extend button on the current plan card.
  function handlePick(plan: PlanDef) {
    if (plan.paymentPlan === null) return
    setPendingPlan(plan)
  }

  async function handleCancel() {
    if (!ownSubscriptionActive) return
    if (!window.confirm(t('subscription.cancelConfirm'))) return
    try {
      await apiFetch('/api/subscription/activate', { method: 'DELETE' })
      const me = await apiFetch<AuthUser>('/api/auth/me')
      setUser(me)
      setAuthUserState(me)
      window.localStorage.removeItem('walletHubSubscription')
      // Notify Sidebar / BottomNav so the /couple or /family entry
      // disappears now that the subscription is inactive.
      try { window.dispatchEvent(new Event('profileUpdated')) } catch {}
      setCanceled(true)
      setTimeout(() => setCanceled(false), 3000)
    } catch (err) {
      console.error('cancel failed', err)
    }
  }

  async function handlePaymentSuccess() {
    if (!pendingPlan) return
    const planName = pendingPlan.id === 'pro' ? 'pro' : 'premium'
    window.localStorage.setItem('walletHubSubscription', planName)

    // Sync the cached account type with the purchased tier so the sidebar /
    // bottom-nav swap (couple ↔ family) and the "current plan" highlight on
    // this page take effect immediately — the server already updated
    // relationship_status to match in /api/subscription/checkout.
    const nextAccountType = pendingPlan.paymentPlan === 'gerbul' ? 'gerbul' : 'khos'
    window.localStorage.setItem('walletHubAccountType', nextAccountType)
    setAccountType(nextAccountType)

    // Refresh AuthUser FIRST so getUser().subscriptionStatus is 'active'
    // before we notify the nav components — otherwise their visibility
    // gate (subscription-active + accountType) still sees the stale
    // 'expired' status and keeps the section hidden.
    try {
      const me = await apiFetch<AuthUser>('/api/auth/me')
      setUser(me)
      setAuthUserState(me)
    } catch { /* best-effort cache refresh */ }

    try {
      window.dispatchEvent(new Event('profileUpdated'))
    } catch { /* SSR-safe no-op */ }

    setPendingPlan(null)
  }

  const expiresLabel = expiresAtRaw
    ? new Date(expiresAtRaw).toLocaleDateString(
        lang === 'mn' ? 'mn-MN' : 'en-US',
        { year: 'numeric', month: 'short', day: 'numeric' }
      )
    : null

  return (
    <div className="p-4 lg:p-8">
      <motion.div
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.06 } } }}
        className="space-y-6"
      >
        <motion.header variants={fadeUp}>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-mood-ink lg:text-3xl">
            {t('subscription.title')}
          </h1>
          <p className="mt-0.5 text-sm text-mood-muted">{t('subscription.subtitle')}</p>
        </motion.header>

        {/* Current plan card */}
        <motion.div
          variants={fadeUp}
          className="relative overflow-hidden rounded-3xl border border-mood-primary/10 bg-gradient-to-br from-mood-primary/8 via-mood-card to-mood-cream p-6 shadow-[0_4px_24px_-12px_rgba(var(--mood-shadow-rgb),0.10)]"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-mood-primary/12 text-mood-primary">
                {currentPlanId === 'premium'
                  ? <Crown className="h-5 w-5" />
                  : currentPlanId === 'pro'
                  ? <Heart className="h-5 w-5" />
                  : <Sparkles className="h-5 w-5" />}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-mood-muted">
                  {t('subscription.currentPlan')}
                </p>
                <p className="font-display text-lg font-bold text-mood-ink">
                  {t(PLANS.find((p) => p.id === currentPlanId)!.nameKey)}
                </p>
              </div>
            </div>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold ${
                effectiveActive
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-mood-cream text-mood-muted'
              }`}
            >
              <ShieldCheck className="h-3 w-3" />
              {isInvitedMember
                ? t('subscription.invitedBy')
                : ownSubscriptionActive
                ? t('subscription.statusActive')
                : authUser?.subscriptionStatus === 'expired'
                ? t('subscription.statusExpired')
                : t('subscription.statusInactive')}
            </span>
          </div>

          {expiresLabel && effectiveActive && (
            <div className="mt-4 flex items-center gap-2 text-xs text-mood-muted">
              <Calendar className="h-3.5 w-3.5" />
              <span>{t('subscription.expiresOn')}: <span className="font-semibold text-mood-ink/80">{expiresLabel}</span></span>
            </div>
          )}

          {isInvitedMember && (
            <p className="mt-3 rounded-xl bg-mood-primary/8 px-3 py-2 text-[11px] text-mood-ink/75">
              {t('subscription.invitedHint')}
            </p>
          )}

          {canceled && (
            <p className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 text-xs font-semibold text-emerald-700">
              <CheckCircle2 className="h-3 w-3" />
              {t('subscription.canceled')}
            </p>
          )}
        </motion.div>

        {/* Plan list — hidden for invited members (they inherit the owner's plan) */}
        {!isInvitedMember && (
        <motion.div variants={fadeUp}>
          <h2 className="mb-3 font-display text-base font-bold text-mood-ink">{t('subscription.choosePlan')}</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {PLANS.map((plan) => {
              const Icon = plan.icon
              const isCurrent = plan.id === currentPlanId
              return (
                <div
                  key={plan.id}
                  className={`relative flex flex-col gap-3 rounded-3xl border-2 p-5 transition-all ${
                    isCurrent
                      ? 'border-mood-primary bg-mood-primary/5 shadow-md shadow-mood-primary/15'
                      : 'border-mood-primary/10 bg-mood-card hover:border-mood-primary/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-xl text-white"
                      style={{ background: plan.accent }}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    {isCurrent && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                        <CheckCircle2 className="h-3 w-3" />
                        {t('subscription.current')}
                      </span>
                    )}
                  </div>

                  <div>
                    <p className="font-display text-sm font-bold text-mood-ink">
                      {t(plan.nameKey)}
                    </p>
                    <p className="mt-0.5 text-xs text-mood-muted">{t(plan.descKey)}</p>
                  </div>

                  <div className="flex items-baseline gap-1">
                    <span className="font-display text-xl font-extrabold text-mood-ink">
                      {plan.id === 'free' ? t('subscription.free') : plan.price}
                    </span>
                    {plan.id !== 'free' && (
                      <span className="text-[11px] text-mood-muted">{t('subscription.month')}</span>
                    )}
                  </div>

                  <ul className="space-y-1.5">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-[11px] text-mood-ink/80">
                        <ShieldCheck className="mt-0.5 h-3 w-3 flex-shrink-0 text-mood-primary" />
                        {t(f)}
                      </li>
                    ))}
                  </ul>

                  {/* Action area:
                      - Current paid plan → Extend (Renew) + Cancel
                      - Non-current paid plan when no active sub → Upgrade
                      - Free plan (non-current) when subscribed → no button (managed via Cancel on current card)
                      - Current free plan → no button */}
                  {isCurrent && plan.paymentPlan !== null && ownSubscriptionActive && (
                    <div className="mt-auto flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => setPendingPlan(plan)}
                        className="inline-flex items-center justify-center gap-1.5 rounded-full bg-mood-primary px-3.5 py-2 text-xs font-semibold text-white shadow-lg shadow-mood-primary/25 transition-colors hover:bg-mood-deep"
                      >
                        <RotateCcw className="h-3 w-3" />
                        {t('subscription.extend')}
                      </button>
                      <button
                        type="button"
                        onClick={handleCancel}
                        className="inline-flex items-center justify-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-100"
                      >
                        {t('subscription.cancel')}
                      </button>
                    </div>
                  )}

                  {!isCurrent && plan.paymentPlan !== null && !ownSubscriptionActive && (
                    <button
                      type="button"
                      onClick={() => handlePick(plan)}
                      className="mt-auto inline-flex items-center justify-center gap-1.5 rounded-full bg-mood-primary px-3.5 py-2 text-xs font-semibold text-white shadow-lg shadow-mood-primary/25 transition-colors hover:bg-mood-deep"
                    >
                      <CreditCard className="h-3 w-3" />
                      {t('subscription.upgrade')}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
          <p className="mt-3 flex items-center gap-1.5 text-[11px] text-mood-muted">
            <Zap className="h-3 w-3" />
            {t('profile.lifestyleHint')}
          </p>
        </motion.div>
        )}
      </motion.div>

      {pendingPlan?.paymentPlan && (
        <PaymentModal
          isOpen={pendingPlan !== null}
          plan={pendingPlan.paymentPlan}
          planName={t(pendingPlan.nameKey)}
          priceLabel={`${pendingPlan.paidValue}${t('subscription.month')}`}
          durations={buildDurationOptions(pendingPlan.paymentPlan, (k) => t(k))}
          onClose={() => setPendingPlan(null)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  )
}
