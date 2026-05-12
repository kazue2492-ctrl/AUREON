'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { updateProfile, addTransaction } from '@/lib/data'
import { apiFetch, getToken } from '@/lib/clientAuth'
import { useTheme } from '@/components/ThemeProvider'
import { useLanding } from '@/lib/landingI18n'
import { applyAccountTheme } from '@/lib/accountThemes'
import { useForceLightTheme } from '@/lib/useForceLightTheme'
import { Wordmark } from '@/views/landing/Navbar'
import { LanguageToggle } from '@/views/landing/LanguageToggle'
import { MASCOT_SRC } from '@/views/landing/mascot'
import PaymentModal from '@/components/PaymentModal'
import {
  AlertTriangle,
  ArrowRight,
  Crown,
  GraduationCap,
  Heart,
  Mail,
  Plus,
  ShieldCheck,
  Sparkles,
  Trash2,
  User,
  Users,
  Wallet,
  X,
  Zap,
} from 'lucide-react'

type AccountType = 'engiin' | 'oyutan' | 'khos' | 'gerbul'
type Gender = 'male' | 'female' | ''

const accentByType: Record<AccountType, string> = {
  engiin: '#6D28D9',
  oyutan: '#0EA5E9',
  khos:   '#EC4899',
  gerbul: '#F59E0B',
}

export default function SetupPage() {
  useForceLightTheme()
  const router = useRouter()
  const { setTheme } = useTheme()
  const { lang } = useLanding()

  const [age, setAge] = useState('')
  const [initialBalance, setInitialBalance] = useState('')
  const [gender, setGender] = useState<Gender>('')
  const [accountType, setAccountType] = useState<AccountType>('engiin')
  const [showSubscription, setShowSubscription] = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  const [subscriptionConfirmed, setSubscriptionConfirmed] = useState(false)
  const [familyMembers, setFamilyMembers] = useState<Array<{ name: string; email: string }>>([])
  const [newMemberName, setNewMemberName] = useState('')
  const [newMemberEmail, setNewMemberEmail] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const T = {
    title:        lang === 'mn' ? 'Профайлаа үүсгэе'                            : "Let's set up your profile",
    subtitle:     lang === 'mn' ? 'Моко чиний санхүүгийн зорилгод тохирох тохиргоог санал болгоно.' : 'Moko will tailor everything to your goals.',
    age:          lang === 'mn' ? 'Нас'                                          : 'Age',
    gender:       lang === 'mn' ? 'Хүйс'                                         : 'Gender',
    male:         lang === 'mn' ? 'Эр'                                           : 'Male',
    female:       lang === 'mn' ? 'Эм'                                           : 'Female',
    balance:      lang === 'mn' ? 'Эхний үлдэгдэл (₮)'                           : 'Starting balance (₮)',
    balanceHint:  lang === 'mn' ? 'Энэ дүн нийт үлдэгдэл болон тайланд автоматаар орно.' : "This amount goes into your total balance and reports.",
    accountType:  lang === 'mn' ? 'Бүртгэлийн төрөл'                             : 'Account type',
    submit:       lang === 'mn' ? 'Үргэлжлүүлэх'                                 : 'Continue',
    submitting:   lang === 'mn' ? 'Хадгалж байна...'                             : 'Saving...',
    fillAll:      lang === 'mn' ? 'Бүх талбарыг бөглөнө үү'                      : 'Please fill in all fields',
    badAge:       lang === 'mn' ? 'Нас буруу байна'                              : 'Invalid age',
    badAmount:    lang === 'mn' ? 'Дүн буруу байна'                              : 'Invalid amount',
    confirmed:    lang === 'mn' ? 'баталгаажлаа'                                 : 'confirmed',
    seeDetails:   lang === 'mn' ? 'Дэлгэрэнгүй харах'                            : 'See details',
    subTitle:     lang === 'mn' ? 'Багц сонгох'                                  : 'Choose plan',
    couplePitch:  lang === 'mn' ? 'Хосын санхүүг хамтдаа хянах тарифаа баталгаажуулна уу' : 'Confirm the plan to manage finances together',
    familyPitch:  lang === 'mn' ? 'Гэр бүлийнхээ санхүүг хамтдаа хянах тарифаа баталгаажуулна уу' : 'Confirm the family plan to budget together',
    chooseBtn:    lang === 'mn' ? 'Сонгох'                                       : 'Choose',
    coupleBadge:  lang === 'mn' ? 'Хосын тариф'                                  : 'Couple plan',
    familyBadge:  lang === 'mn' ? 'Гэр бүлийн тариф'                             : 'Family plan',
    coupleHalf:   lang === 'mn' ? 'Хосын нөгөө хагас'                            : 'Your other half',
    familyMember: lang === 'mn' ? 'Гэр бүлийн гишүүд'                            : 'Family members',
    namePh:       lang === 'mn' ? 'Нэр'                                          : 'Name',
    coupleNamePh: lang === 'mn' ? 'Хосын нэр'                                    : "Partner's name",
    emailPh:      lang === 'mn' ? 'И-мэйл (заавал биш)'                          : 'Email (optional)',
    canAddMore:   (n: number) => lang === 'mn' ? `${n} гишүүн нэмэх боломжтой` : `Can add ${n} more member${n === 1 ? '' : 's'}`,
    coupleDone:   lang === 'mn' ? 'Хос бүртгэгдлээ ✓'                            : 'Partner registered ✓',
    maxReached:   (m: number) => lang === 'mn' ? `Гишүүний хязгаар хүрлээ (${m}/${m})` : `Member limit reached (${m}/${m})`,
  }

  const accountTypes: { id: AccountType; label: string; icon: any; desc: string }[] = [
    { id: 'engiin', label: lang === 'mn' ? 'Энгийн'  : 'Solo',     icon: User,           desc: lang === 'mn' ? 'Ганцаараа'    : 'Just you' },
    { id: 'khos',   label: lang === 'mn' ? 'Хосууд'  : 'Couples',  icon: Heart,          desc: lang === 'mn' ? '2 хүн'         : '2 people' },
    { id: 'oyutan', label: lang === 'mn' ? 'Оюутан'  : 'Student',  icon: GraduationCap,  desc: lang === 'mn' ? 'Хөнгөлөлттэй' : 'Discount'  },
    { id: 'gerbul', label: lang === 'mn' ? 'Гэр бүл' : 'Family',   icon: Users,          desc: lang === 'mn' ? 'Бүх гишүүд'   : 'Everyone'  },
  ]

  const couplePlan = {
    name: 'Pro',
    price: '₮9,900',
    period: lang === 'mn' ? '/сар' : '/mo',
    icon: Zap,
    features: lang === 'mn'
      ? ['Хоёулаа нэгэн данснаас хянах', 'Нийтлэг төсөв төлөвлөлт', 'Зорилго хуваалцах', 'Дэлгэрэнгүй тайлан', 'Санхүүгийн зөвлөмж']
      : ['Two-account combined view', 'Shared budgets', 'Shared goals', 'Detailed reports', 'Personalized tips'],
    badge: T.coupleBadge,
    pitch: T.couplePitch,
  }

  const familyPlan = {
    name: lang === 'mn' ? 'Премиум' : 'Premium',
    price: '₮34,900',
    period: lang === 'mn' ? '/сар' : '/mo',
    icon: Crown,
    features: lang === 'mn'
      ? ['Хязгааргүй гишүүд', 'Нийтлэг төсөв', 'Зорилго хуваалцах', 'Дэлгэрэнгүй тайлан', 'Санхүүгийн зөвлөмж', 'Хүүхдийн халаас']
      : ['Unlimited members', 'Shared budgets', 'Shared goals', 'Detailed reports', 'Personalized tips', 'Kids allowance tracker'],
    badge: T.familyBadge,
    pitch: T.familyPitch,
  }

  const MAX_MEMBERS = accountType === 'khos' ? 1 : 4
  const needsSubscription = accountType === 'khos' || accountType === 'gerbul'
  const currentPlan = accountType === 'khos' ? couplePlan : familyPlan

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login')
      return
    }
    apiFetch<import('@/lib/clientAuth').AuthUser>('/api/auth/me')
      .then((me) => { if (me.setupCompleted) router.replace('/dashboard') })
      .catch(() => {})
  }, [router])

  const handleAccountTypeSelect = (type: AccountType) => {
    setAccountType(type)
    applyAccountTheme(type)
    setSubscriptionConfirmed(false)
    setFamilyMembers([])
    setNewMemberName('')
    setNewMemberEmail('')
    if (type === 'khos' || type === 'gerbul') setShowSubscription(true)
  }

  const handleAddMember = () => {
    if (!newMemberName.trim() || familyMembers.length >= MAX_MEMBERS) return
    setFamilyMembers((prev) => [...prev, { name: newMemberName.trim(), email: newMemberEmail.trim() }])
    setNewMemberName('')
    setNewMemberEmail('')
  }

  const handleRemoveMember = (idx: number) => {
    setFamilyMembers((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleConfirmSubscription = () => {
    // Step 1 → close the plan info modal, open the payment modal.
    // Confirmation only happens after a successful card charge.
    setShowSubscription(false)
    setShowPayment(true)
  }

  const handlePaymentSuccess = () => {
    setSubscriptionConfirmed(true)
    setShowPayment(false)
    const planName = accountType === 'khos' ? 'pro' : 'premium'
    localStorage.setItem('walletHubSubscription', planName)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!age || !initialBalance || !gender) {
      setError(T.fillAll)
      return
    }

    const ageNum = parseInt(age)
    if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
      setError(T.badAge)
      return
    }

    const balanceNum = Number(initialBalance.replace(/[\s,]/g, ''))
    if (!Number.isFinite(balanceNum) || balanceNum < 0) {
      setError(T.badAmount)
      return
    }

    if (needsSubscription && !subscriptionConfirmed) {
      setShowSubscription(true)
      return
    }

    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 800))

    const statusMap: Record<AccountType, 'individual' | 'couple' | 'student' | 'family'> = {
      engiin: 'individual',
      khos:   'couple',
      oyutan: 'student',
      gerbul: 'family',
    }

    localStorage.setItem('walletHubAge', age)
    localStorage.setItem('walletHubGender', gender)
    localStorage.setItem('walletHubAccountType', accountType)
    setTheme(accountType)
    updateProfile({ relationshipStatus: statusMap[accountType] })

    if (balanceNum > 0) {
      addTransaction({
        title: lang === 'mn' ? 'Эхний үлдэгдэл' : 'Starting balance',
        amount: balanceNum,
        category: lang === 'mn' ? 'Бусад' : 'Other',
        date: new Date().toISOString().split('T')[0],
        type: 'income',
        description: lang === 'mn' ? 'Setup-аас үүсгэсэн эхний үлдэгдэл' : 'Created from setup wizard',
      })
    }

    try {
      await apiFetch('/api/setup/complete', {
        method: 'POST',
        body: JSON.stringify({
          age: parseInt(age),
          gender: gender || null,
          relationshipStatus: statusMap[accountType],
        }),
      })

      // Activate subscription BEFORE caching the user, so /api/auth/me
      // returns subscription_status='active' on the next call.
      // Otherwise localStorage gets cached with 'none' and downstream
      // pages (e.g. /family) gate features behind a stale paywall.
      if (subscriptionConfirmed) {
        try {
          await apiFetch('/api/subscription/activate', { method: 'POST' })
        } catch (err) {
          console.error('subscription activation failed', err)
        }
      }

      const me = await apiFetch<import('@/lib/clientAuth').AuthUser>('/api/auth/me')
      const { setUser } = await import('@/lib/clientAuth')
      setUser(me)
    } catch (err) {
      console.error('setup completion failed', err)
    }

    setIsLoading(false)
    router.push('/dashboard')
  }

  const accent = accentByType[accountType]

  return (
    <main className="relative min-h-screen overflow-hidden bg-mood-cream font-sans text-mood-ink">
      <div className="pointer-events-none absolute inset-0 bg-mood-dots opacity-60" />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 18% 22%, rgba(var(--mood-glow-rgb),0.10), transparent 45%), radial-gradient(circle at 82% 78%, rgba(139,90,43,0.08), transparent 45%)',
        }}
      />

      <header className="relative z-10 mx-auto flex max-w-3xl items-center justify-between px-5 py-5 lg:px-8">
        <Link href="/" className="inline-flex items-center gap-2">
          <Wordmark />
        </Link>
        <LanguageToggle />
      </header>

      <AnimatePresence>
        {showSubscription && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className="absolute inset-0 bg-mood-ink/40 backdrop-blur-sm"
              onClick={() => setShowSubscription(false)}
            />
            <motion.div
              initial={{ scale: 0.92, y: 12, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="relative z-10 w-full max-w-sm overflow-hidden rounded-3xl bg-mood-card shadow-2xl shadow-mood-primary/20 ring-1 ring-mood-primary/10"
            >
              <div className="relative bg-gradient-to-br from-mood-primary to-mood-deep px-6 pb-7 pt-6 text-white">
                <button
                  onClick={() => setShowSubscription(false)}
                  className="absolute right-3 top-3 rounded-full p-1.5 text-white/80 transition-colors hover:bg-white/15 hover:text-white"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold backdrop-blur">
                  <Sparkles className="h-3 w-3" />
                  {currentPlan.badge}
                </span>
                <h3 className="mt-3 font-display text-xl font-bold">{T.subTitle}</h3>
                <p className="mt-1 text-xs text-white/80">{currentPlan.pitch}</p>
              </div>

              <div className="p-6">
                <div className="rounded-2xl border border-mood-primary/15 bg-white p-5 shadow-sm">
                  <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-mood-primary/10 text-mood-primary">
                    <currentPlan.icon className="h-5 w-5" />
                  </div>
                  <div className="font-display text-base font-bold text-mood-ink">{currentPlan.name}</div>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="font-display text-2xl font-extrabold text-mood-ink">{currentPlan.price}</span>
                    <span className="text-xs text-mood-muted">{currentPlan.period}</span>
                  </div>
                  <ul className="mt-4 space-y-2">
                    {currentPlan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-xs text-mood-ink/80">
                        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-mood-primary" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleConfirmSubscription}
                    className="mt-5 w-full rounded-full bg-mood-primary py-2.5 text-sm font-semibold text-white shadow-lg shadow-mood-primary/25 transition-colors hover:bg-mood-deep"
                  >
                    {T.chooseBtn}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {needsSubscription && (
        <PaymentModal
          isOpen={showPayment}
          plan={accountType as 'khos' | 'gerbul'}
          planName={`${currentPlan.name} · ${currentPlan.badge}`}
          priceLabel={`${currentPlan.price}${currentPlan.period}`}
          onClose={() => setShowPayment(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}

      <section className="relative z-10 mx-auto w-full max-w-2xl px-5 pb-16 pt-2 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="mb-6 flex items-center gap-3"
        >
          <motion.img
            src={MASCOT_SRC}
            alt="Moko"
            animate={{ y: [0, -4, 0], rotate: [-2, 2, -2] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            className="h-14 w-14 object-contain drop-shadow-[0_8px_14px_rgba(var(--mood-shadow-rgb),0.18)]"
          />
          <div>
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-mood-ink sm:text-3xl">
              {T.title}
            </h1>
            <p className="text-sm text-mood-muted">{T.subtitle}</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: 'easeOut', delay: 0.05 }}
          className="rounded-3xl border border-mood-primary/10 bg-mood-card p-6 shadow-[0_24px_60px_-24px_rgba(var(--mood-shadow-rgb),0.30)] sm:p-8"
        >
          {error && (
            <div className="mb-5 flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-mood-muted">
                  {T.age}
                </label>
                <input
                  type="number"
                  min={1}
                  max={120}
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="25"
                  className="w-full rounded-xl border border-mood-primary/15 bg-white px-4 py-3 text-sm text-mood-ink placeholder:text-mood-muted/60 transition-all focus:border-mood-primary focus:outline-none focus:ring-4 focus:ring-mood-primary/15"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-mood-muted">
                  {T.gender}
                </label>
                <div className="flex gap-2">
                  {(['male', 'female'] as const).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGender(g)}
                      className={`flex-1 rounded-xl border py-3 text-sm font-semibold transition-all ${
                        gender === g
                          ? 'border-mood-primary bg-mood-primary text-white shadow-md shadow-mood-primary/20'
                          : 'border-mood-primary/15 bg-white text-mood-ink/70 hover:border-mood-primary/40 hover:text-mood-ink'
                      }`}
                    >
                      {g === 'male' ? T.male : T.female}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-mood-muted">
                {T.balance}
              </label>
              <div className="relative">
                <Wallet className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-mood-primary" />
                <input
                  type="text"
                  inputMode="numeric"
                  value={initialBalance}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^\d]/g, '')
                    setInitialBalance(raw ? Number(raw).toLocaleString('en-US') : '')
                  }}
                  placeholder="0"
                  className="w-full rounded-xl border border-mood-primary/15 bg-white py-3 pl-10 pr-10 text-sm text-mood-ink placeholder:text-mood-muted/60 transition-all focus:border-mood-primary focus:outline-none focus:ring-4 focus:ring-mood-primary/15"
                  disabled={isLoading}
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-mood-muted">₮</span>
              </div>
              <p className="mt-1.5 text-[11px] text-mood-muted/80">{T.balanceHint}</p>
            </div>

            <div>
              <label className="mb-2.5 block text-xs font-semibold uppercase tracking-wider text-mood-muted">
                {T.accountType}
              </label>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                {accountTypes.map((type) => {
                  const selected = accountType === type.id
                  return (
                    <motion.button
                      key={type.id}
                      type="button"
                      whileHover={{ y: -2 }}
                      onClick={() => handleAccountTypeSelect(type.id)}
                      className={`relative flex flex-col items-center gap-1.5 rounded-2xl border-2 px-2 py-3.5 text-center transition-all ${
                        selected
                          ? 'border-mood-primary bg-mood-primary/5 text-mood-ink shadow-md shadow-mood-primary/15'
                          : 'border-mood-primary/10 bg-white text-mood-ink/70 hover:border-mood-primary/30'
                      }`}
                    >
                      <span
                        aria-hidden
                        className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full"
                        style={{ background: accentByType[type.id], opacity: selected ? 1 : 0.35 }}
                      />
                      <type.icon className={`h-4 w-4 ${selected ? 'text-mood-primary' : 'text-mood-muted'}`} />
                      <span className="text-[11px] font-semibold leading-tight">{type.label}</span>
                      <span className="text-[10px] leading-tight text-mood-muted">{type.desc}</span>
                    </motion.button>
                  )
                })}
              </div>

              {needsSubscription && (
                <button
                  type="button"
                  onClick={() => setShowSubscription(true)}
                  className={`mt-3 flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-xs font-semibold transition-all ${
                    subscriptionConfirmed
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'border-mood-primary/20 bg-mood-primary/5 text-mood-primary hover:bg-mood-primary/10'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    {subscriptionConfirmed ? <ShieldCheck className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
                    {subscriptionConfirmed
                      ? `${currentPlan.name} ${currentPlan.price}${currentPlan.period} — ${T.confirmed}`
                      : `${currentPlan.name} ${currentPlan.price}${currentPlan.period} — ${T.seeDetails}`}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 opacity-70" />
                </button>
              )}

              {(accountType === 'khos' || accountType === 'gerbul') && subscriptionConfirmed && (
                <div className="mt-3 rounded-2xl border border-mood-primary/15 bg-white p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {accountType === 'khos'
                        ? <Heart className="h-4 w-4" style={{ color: accent }} />
                        : <Users className="h-4 w-4" style={{ color: accent }} />}
                      <span className="text-xs font-semibold text-mood-ink">
                        {accountType === 'khos' ? T.coupleHalf : T.familyMember}
                      </span>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        familyMembers.length >= MAX_MEMBERS
                          ? 'bg-mood-primary/15 text-mood-primary'
                          : 'bg-mood-cream text-mood-muted'
                      }`}
                    >
                      {familyMembers.length}/{MAX_MEMBERS}
                    </span>
                  </div>

                  {familyMembers.length > 0 && (
                    <div className="mb-3 space-y-2">
                      {familyMembers.map((m, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 rounded-xl border border-mood-primary/10 bg-mood-cream/60 px-3 py-2"
                        >
                          <div
                            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                            style={{ background: accent }}
                          >
                            {m.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="truncate text-xs font-semibold text-mood-ink">{m.name}</p>
                            {m.email && (
                              <p className="truncate text-[10px] text-mood-muted">{m.email}</p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveMember(idx)}
                            className="flex-shrink-0 rounded-md p-1 text-mood-muted/70 transition-colors hover:text-rose-500"
                            aria-label="Remove"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {familyMembers.length < MAX_MEMBERS ? (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <User className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-mood-muted/70" />
                          <input
                            type="text"
                            value={newMemberName}
                            onChange={(e) => setNewMemberName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddMember())}
                            placeholder={accountType === 'khos' ? T.coupleNamePh : T.namePh}
                            className="w-full rounded-lg border border-mood-primary/15 bg-white py-2 pl-8 pr-3 text-xs text-mood-ink placeholder:text-mood-muted/60 transition-all focus:border-mood-primary focus:outline-none focus:ring-2 focus:ring-mood-primary/20"
                          />
                        </div>
                        <div className="relative flex-1">
                          <Mail className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-mood-muted/70" />
                          <input
                            type="email"
                            value={newMemberEmail}
                            onChange={(e) => setNewMemberEmail(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddMember())}
                            placeholder={T.emailPh}
                            className="w-full rounded-lg border border-mood-primary/15 bg-white py-2 pl-8 pr-3 text-xs text-mood-ink placeholder:text-mood-muted/60 transition-all focus:border-mood-primary focus:outline-none focus:ring-2 focus:ring-mood-primary/20"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleAddMember}
                          disabled={!newMemberName.trim()}
                          className="flex h-[34px] w-[34px] flex-shrink-0 items-center justify-center rounded-lg bg-mood-primary text-white shadow-md shadow-mood-primary/25 transition-all hover:bg-mood-deep disabled:opacity-40"
                          aria-label="Add"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      {accountType === 'gerbul' && (
                        <p className="text-[10px] text-mood-muted">
                          {T.canAddMore(MAX_MEMBERS - familyMembers.length)}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-center text-xs font-semibold text-mood-primary">
                      {accountType === 'khos' ? T.coupleDone : T.maxReached(MAX_MEMBERS)}
                    </p>
                  )}
                </div>
              )}
            </div>

            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: isLoading ? 1 : 1.02 }}
              whileTap={{ scale: isLoading ? 1 : 0.98 }}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-mood-primary py-3.5 text-sm font-semibold text-white shadow-xl shadow-mood-primary/30 transition-colors hover:bg-mood-deep disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  <span>{T.submitting}</span>
                </>
              ) : (
                <>
                  <span>{T.submit}</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </motion.button>
          </form>
        </motion.div>
      </section>
    </main>
  )
}
