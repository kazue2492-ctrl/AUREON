'use client'
import { useState, useEffect, useRef } from 'react'
import { motion, type Variants } from 'framer-motion'
import {
  User,
  Mail,
  Moon,
  Sun,
  Coins,
  Bell,
  CheckCircle2,
  Save,
  LogOut,
  Heart,
  Users,
  GraduationCap,
  Sparkles,
  Camera,
  Languages,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import {
  getProfile,
  updateProfile,
  getNotifications,
  markNotificationRead,
} from '@/lib/data'
import { clearAuth } from '@/lib/clientAuth'
import type { UserProfile, Notification } from '@/types'
import { useTheme } from '@/components/ThemeProvider'
import { useLanguage } from '@/components/LanguageProvider'

const profileModes = {
  individual: { icon: Sparkles,        accent: '#6D28D9' },
  couple:     { icon: Heart,           accent: '#EC4899' },
  family:     { icon: Users,           accent: '#F59E0B' },
  student:    { icon: GraduationCap,   accent: '#0EA5E9' },
} as const

type ProfileMode = keyof typeof profileModes

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
}

export default function Profile() {
  const router = useRouter()
  const { setTheme } = useTheme()
  const { lang, setLang, t } = useLanguage()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [currency, setCurrency] = useState('MNT')
  const [relationshipStatus, setRelationshipStatus] = useState<ProfileMode>('individual')
  const [darkMode, setDarkMode] = useState(false)
  const [age, setAge] = useState('')
  const [gender, setGender] = useState<'male' | 'female' | ''>('')
  const [saved, setSaved] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [avatarUrl, setAvatarUrl] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const p = getProfile()
    setProfile(p)
    setName(p.name)
    setEmail(p.email)
    setCurrency(p.currency)
    const accountTypeMap: Record<string, ProfileMode> = {
      engiin: 'individual', khos: 'couple', oyutan: 'student', gerbul: 'family',
    }
    const savedAccountType = localStorage.getItem('walletHubAccountType')
    setRelationshipStatus(
      (savedAccountType && accountTypeMap[savedAccountType])
        ? accountTypeMap[savedAccountType]
        : (p.relationshipStatus ?? 'individual')
    )
    setDarkMode(p.darkMode)
    setAvatarUrl(p.avatar)
    setAge(localStorage.getItem('walletHubAge') || '')
    setGender((localStorage.getItem('walletHubGender') as 'male' | 'female' | '') || '')
    setNotifications(getNotifications())
  }, [])

  useEffect(() => {
    const sync = () => {
      const p = getProfile()
      setProfile(p)
      setName(p.name)
      setEmail(p.email)
      setCurrency(p.currency)
      setRelationshipStatus(p.relationshipStatus ?? 'individual')
      setDarkMode(p.darkMode)
      setAvatarUrl(p.avatar)
      setNotifications(getNotifications())
    }
    window.addEventListener('dataUpdated', sync)
    window.addEventListener('profileUpdated', sync)
    return () => {
      window.removeEventListener('dataUpdated', sync)
      window.removeEventListener('profileUpdated', sync)
    }
  }, [])

  function handleSave() {
    updateProfile({ currency, relationshipStatus, darkMode })
    const statusToAccount: Record<ProfileMode, 'engiin' | 'khos' | 'oyutan' | 'gerbul'> = {
      individual: 'engiin',
      couple:     'khos',
      student:    'oyutan',
      family:     'gerbul',
    }
    const newAccountType = statusToAccount[relationshipStatus]
    localStorage.setItem('walletHubAccountType', newAccountType)
    setTheme(newAccountType)
    window.dispatchEvent(new Event('profileUpdated'))
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  function handleThemeToggle() {
    const nextDarkMode = !darkMode
    setDarkMode(nextDarkMode)
    updateProfile({ darkMode: nextDarkMode })
  }

  function handleMarkRead(id: string) {
    markNotificationRead(id)
    setNotifications(getNotifications())
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string
      setAvatarUrl(dataUrl)
      updateProfile({ avatar: dataUrl })
    }
    reader.readAsDataURL(file)
  }

  function handleLogout() {
    clearAuth()
    window.localStorage.removeItem('walletHubAccountType')
    window.localStorage.removeItem('walletHubSubscription')
    window.localStorage.removeItem('walletHubAge')
    window.localStorage.removeItem('walletHubGender')
    router.replace('/login')
  }

  if (!profile) return null

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
            {t('profile.title')}
          </h1>
          <p className="mt-0.5 text-sm text-mood-muted">{t('profile.subtitle')}</p>
        </motion.header>

        {/* Avatar card */}
        <motion.div
          variants={fadeUp}
          className="relative overflow-hidden rounded-3xl border border-mood-primary/10 bg-gradient-to-br from-mood-primary/8 via-mood-card to-mood-cream p-6 shadow-[0_4px_24px_-12px_rgba(var(--mood-shadow-rgb),0.10)]"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{ background: 'radial-gradient(circle at 100% 0%, rgba(var(--mood-glow-rgb),0.10), transparent 50%)' }}
          />
          <div className="relative flex items-center gap-5">
            <div className="relative flex-shrink-0">
              <div className="h-20 w-20 overflow-hidden rounded-full bg-mood-cream ring-4 ring-mood-primary/15">
                <img
                  src={avatarUrl || profile.avatar}
                  alt={profile.name}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%23ddd"/></svg>'
                  }}
                />
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-0.5 -right-0.5 flex h-7 w-7 items-center justify-center rounded-full border-2 border-mood-card bg-mood-primary text-white shadow-md shadow-mood-primary/30 transition hover:bg-mood-deep"
                title={t('profile.changeAvatar')}
              >
                <Camera className="h-3.5 w-3.5" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
            <div className="min-w-0">
              <h2 className="font-display text-xl font-bold text-mood-ink">{name || profile.name}</h2>
              <p className="text-sm text-mood-muted">{email || profile.email}</p>
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-mood-primary/10 px-3 py-1 text-xs font-semibold text-mood-primary">
                {t(`mode.${relationshipStatus}.label` as const)}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Settings */}
        <motion.div
          variants={fadeUp}
          className="rounded-3xl border border-mood-primary/10 bg-mood-card p-6 shadow-[0_4px_24px_-12px_rgba(var(--mood-shadow-rgb),0.10)]"
        >
          <h3 className="font-display text-lg font-bold text-mood-ink">{t('profile.updateInfo')}</h3>

          <div className="mt-5 space-y-4">
            <div>
              <label className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-mood-muted">
                <User className="h-3.5 w-3.5 text-mood-primary" />
                {t('profile.name')}
              </label>
              <input
                type="text"
                value={name}
                readOnly
                disabled
                aria-readonly="true"
                title={t('profile.lockedHint')}
                className="w-full cursor-not-allowed rounded-xl border border-mood-primary/10 bg-mood-cream/60 px-4 py-3 text-sm text-mood-ink/70"
              />
              <p className="mt-1.5 text-xs text-mood-muted">{t('profile.lockedHint')}</p>
            </div>

            <div>
              <label className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-mood-muted">
                <Mail className="h-3.5 w-3.5 text-mood-primary" />
                {t('profile.email')}
              </label>
              <input
                type="email"
                value={email}
                readOnly
                disabled
                aria-readonly="true"
                title={t('profile.lockedHint')}
                className="w-full cursor-not-allowed rounded-xl border border-mood-primary/10 bg-mood-cream/60 px-4 py-3 text-sm text-mood-ink/70"
              />
              <p className="mt-1.5 text-xs text-mood-muted">{t('profile.lockedHint')}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-mood-muted">
                  <User className="h-3.5 w-3.5 text-mood-primary" />
                  {t('profile.age')}
                </label>
                <input
                  type="number"
                  value={age}
                  readOnly
                  disabled
                  aria-readonly="true"
                  title={t('profile.lockedHint')}
                  className="w-full cursor-not-allowed rounded-xl border border-mood-primary/10 bg-mood-cream/60 px-4 py-3 text-sm text-mood-ink/70"
                />
              </div>
              <div>
                <label className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-mood-muted">
                  <User className="h-3.5 w-3.5 text-mood-primary" />
                  {t('profile.gender')}
                </label>
                <div className="flex gap-2" title={t('profile.lockedHint')}>
                  {(['male', 'female'] as const).map((g) => {
                    const active = gender === g
                    return (
                      <div
                        key={g}
                        aria-disabled="true"
                        className={`flex-1 cursor-not-allowed select-none rounded-xl border py-3 text-center text-sm font-semibold ${
                          active
                            ? 'border-mood-primary/40 bg-mood-primary/15 text-mood-primary'
                            : 'border-mood-primary/10 bg-mood-cream/60 text-mood-ink/40'
                        }`}
                      >
                        {g === 'male' ? t('profile.male') : t('profile.female')}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
            <p className="-mt-2 text-xs text-mood-muted">{t('profile.lockedHint')}</p>

            <div>
              <label className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-mood-muted">
                <Sparkles className="h-3.5 w-3.5 text-mood-primary" />
                {t('profile.lifestyle')}
              </label>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {(Object.keys(profileModes) as ProfileMode[]).map((mode) => {
                  const meta = profileModes[mode]
                  const Icon = meta.icon
                  const active = relationshipStatus === mode
                  return (
                    <motion.button
                      key={mode}
                      type="button"
                      whileHover={{ y: -2 }}
                      onClick={() => setRelationshipStatus(mode)}
                      className={`relative rounded-2xl border-2 p-4 text-left transition-all ${
                        active
                          ? 'border-mood-primary bg-mood-primary/5 shadow-md shadow-mood-primary/15'
                          : 'border-mood-primary/10 bg-white hover:border-mood-primary/30'
                      }`}
                    >
                      <span
                        aria-hidden
                        className="absolute right-3 top-3 h-1.5 w-1.5 rounded-full"
                        style={{ background: meta.accent, opacity: active ? 1 : 0.35 }}
                      />
                      <Icon className={`mb-3 h-4 w-4 ${active ? 'text-mood-primary' : 'text-mood-muted'}`} />
                      <p className="text-sm font-semibold text-mood-ink">
                        {t(`mode.${mode}.label` as const)}
                      </p>
                      <p className="mt-1 text-xs text-mood-muted">
                        {t(`mode.${mode}.subtitle` as const)}
                      </p>
                    </motion.button>
                  )
                })}
              </div>
            </div>

            <div>
              <label className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-mood-muted">
                <Coins className="h-3.5 w-3.5 text-mood-primary" />
                {t('profile.currency')}
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full rounded-xl border border-mood-primary/15 bg-white px-4 py-3 text-sm text-mood-ink transition-all focus:border-mood-primary focus:outline-none focus:ring-4 focus:ring-mood-primary/15"
              >
                <option value="MNT">Монгол төгрөг (₮)</option>
                <option value="USD">Америк доллар ($)</option>
                <option value="EUR">Евро (€)</option>
              </select>
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-mood-primary/10 bg-white px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-medium text-mood-ink">
                <Languages className="h-4 w-4 text-mood-primary" />
                {t('profile.language')}
              </div>
              <div className="inline-flex rounded-full bg-mood-cream p-0.5 text-xs font-bold">
                {(['mn', 'en'] as const).map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setLang(l)}
                    className={`rounded-full px-4 py-1.5 transition-colors ${
                      lang === l
                        ? 'bg-mood-primary text-white shadow-sm'
                        : 'text-mood-muted hover:text-mood-ink'
                    }`}
                  >
                    {l.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-mood-primary/10 bg-white px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-medium text-mood-ink">
                {darkMode ? <Moon className="h-4 w-4 text-mood-primary" /> : <Sun className="h-4 w-4 text-mood-primary" />}
                {t('profile.darkMode')}
              </div>
              <button
                onClick={handleThemeToggle}
                aria-label="Toggle dark mode"
                className={`relative h-7 w-12 rounded-full transition-colors ${
                  darkMode ? 'bg-mood-primary' : 'bg-mood-primary/25'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 flex h-6 w-6 items-center justify-center rounded-full shadow-sm transition-all duration-200 ${
                    darkMode
                      ? 'translate-x-5 bg-mood-card text-mood-primary'
                      : 'translate-x-0 bg-mood-primary text-mood-card'
                  }`}
                >
                  {darkMode
                    ? <Moon className="h-3 w-3" />
                    : <Sun className="h-3 w-3" />}
                </span>
              </button>
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={handleSave}
              className={`flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold text-white shadow-lg transition-colors ${
                saved
                  ? 'bg-emerald-500 shadow-emerald-500/25'
                  : 'bg-mood-primary shadow-mood-primary/25 hover:bg-mood-deep'
              }`}
            >
              {saved ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  {t('profile.saved')}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {t('profile.save')}
                </>
              )}
            </motion.button>

            <button
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-full border border-rose-200 bg-rose-50 py-3 text-sm font-semibold text-rose-600 transition hover:bg-rose-100"
            >
              <LogOut className="h-4 w-4" />
              {t('nav.logout')}
            </button>
          </div>
        </motion.div>

        {/* Notifications */}
        <motion.div
          variants={fadeUp}
          className="overflow-hidden rounded-3xl border border-mood-primary/10 bg-mood-card shadow-[0_4px_24px_-12px_rgba(var(--mood-shadow-rgb),0.10)]"
        >
          <div className="flex items-center gap-2 p-6 pb-3">
            <Bell className="h-5 w-5 text-mood-primary" />
            <h3 className="font-display text-lg font-bold text-mood-ink">
              {lang === 'mn' ? 'Мэдэгдэл' : 'Notifications'}
            </h3>
          </div>
          <div className="divide-y divide-mood-primary/8">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`flex items-start gap-3 px-6 py-4 transition-colors ${
                  !n.read ? 'bg-mood-primary/5' : ''
                }`}
              >
                <div className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${
                  !n.read ? 'bg-mood-primary' : 'bg-mood-muted/40'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-mood-ink">{n.title}</p>
                  <p className="mt-0.5 text-xs text-mood-muted">{n.message}</p>
                </div>
                {!n.read && (
                  <button
                    onClick={() => handleMarkRead(n.id)}
                    className="flex-shrink-0 text-xs font-semibold text-mood-primary transition-colors hover:text-mood-deep"
                  >
                    {lang === 'mn' ? 'Уншсан' : 'Mark read'}
                  </button>
                )}
              </div>
            ))}

            {notifications.length === 0 && (
              <div className="py-8 text-center text-sm text-mood-muted">
                {lang === 'mn' ? 'Мэдэгдэл байхгүй' : 'No notifications'}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
