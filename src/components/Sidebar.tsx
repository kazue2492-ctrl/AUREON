'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  Receipt,
  ScanLine,
  PiggyBank,
  Target,
  BarChart3,
  LogOut,
  Settings,
  Users,
  Heart,
  Crown,
} from 'lucide-react'
import { apiFetch, clearAuth, getToken, getUser } from '@/lib/clientAuth'
import { useLanguage } from './LanguageProvider'
import type { TKey } from '@/lib/i18n'
import { Wordmark } from '@/views/landing/Navbar'

const SIDEBAR_MASCOT_SRC = '/10.png'

const baseMenuItems: Array<{ path: string; labelKey: TKey; icon: typeof LayoutDashboard }> = [
  { path: '/dashboard',    labelKey: 'nav.dashboard',    icon: LayoutDashboard },
  { path: '/transactions', labelKey: 'nav.transactions', icon: Receipt },
  { path: '/upload',       labelKey: 'nav.upload',       icon: ScanLine },
  { path: '/budget',       labelKey: 'nav.budget',       icon: PiggyBank },
  { path: '/goals',        labelKey: 'nav.goals',        icon: Target },
  { path: '/reports',      labelKey: 'nav.reports',      icon: BarChart3 },
]

const familyItem       = { path: '/family',       labelKey: 'nav.family'       as TKey, icon: Users }
const coupleItem       = { path: '/couple',       labelKey: 'nav.couple'       as TKey, icon: Heart }
const subscriptionItem = { path: '/subscription', labelKey: 'nav.subscription' as TKey, icon: Crown }
const profileItem      = { path: '/profile',      labelKey: 'nav.profile'      as TKey, icon: Settings }

function readAccountType(): string | null {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem('walletHubAccountType')
}

function readInFamily(): boolean {
  if (typeof window === 'undefined') return false
  return window.localStorage.getItem('walletHubInFamily') === 'true'
}

function readSubscriptionActive(): boolean {
  return getUser()?.subscriptionStatus === 'active'
}

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { t } = useLanguage()
  const [accountType, setAccountType] = useState<string | null>(null)
  const [inFamily, setInFamily] = useState(false)
  const [subscriptionActive, setSubscriptionActive] = useState(false)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    setAccountType(readAccountType())
    setInFamily(readInFamily())
    setSubscriptionActive(readSubscriptionActive())
    const sync = () => {
      setAccountType(readAccountType())
      setInFamily(readInFamily())
      setSubscriptionActive(readSubscriptionActive())
    }
    window.addEventListener('profileUpdated', sync)
    window.addEventListener('storage', sync)

    // Fallback: if localStorage was cleared (e.g. logout/relogin on an old
    // build), re-derive accountType from the server's relationship_status
    // so the Family menu doesn't disappear for paying members.
    if (!readAccountType() && getToken()) {
      const statusToAccount: Record<string, string> = {
        individual: 'engiin', couple: 'khos', student: 'oyutan', family: 'gerbul',
      }
      apiFetch<{ relationshipStatus?: string | null }>('/api/auth/me')
        .then((me) => {
          const key = me.relationshipStatus && statusToAccount[me.relationshipStatus]
          if (key) {
            window.localStorage.setItem('walletHubAccountType', key)
            setAccountType(key)
            // Notify BottomNav (and any other listeners) that the cached
            // account type just appeared so their menus rebuild too.
            window.dispatchEvent(new Event('profileUpdated'))
          }
        })
        .catch(() => { /* silent — sidebar stays on default */ })
    }

    // Independently verify family membership so accepted-invite members
    // (whose own accountType stays 'engiin') still get the Family menu.
    if (getToken()) {
      apiFetch<{ family: { id: string } | null }>('/api/family')
        .then((res) => {
          const next = res.family !== null
          const prev = window.localStorage.getItem('walletHubInFamily') === 'true'
          window.localStorage.setItem('walletHubInFamily', next ? 'true' : 'false')
          if (prev !== next) {
            setInFamily(next)
            window.dispatchEvent(new Event('profileUpdated'))
          }
        })
        .catch(() => { /* silent — fall back to cached value */ })
    }

    return () => {
      window.removeEventListener('profileUpdated', sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  function setSidebarExpanded(next: boolean) {
    setExpanded((prev) => {
      if (prev === next) return prev
      try {
        window.dispatchEvent(new CustomEvent('sidebarToggled', { detail: { expanded: next } }))
      } catch {}
      return next
    })
  }

  // Each relationship type has its own section: 'gerbul' goes to /family,
  // 'khos' goes to /couple. Owners (accountType 'khos'/'gerbul') only see
  // the link while their subscription is active — cancelling hides it
  // until they renew. Invited members (accountType is something else
  // like 'engiin'/'oyutan') inherit access from the owner, so the
  // inFamily flag alone is enough for them.
  const isCoupleOwner = accountType === 'khos' && subscriptionActive
  const isFamilyOwner = accountType === 'gerbul' && subscriptionActive
  const isInvitedMember = accountType !== 'khos' && accountType !== 'gerbul' && inFamily
  const showFamilyOrCouple = isCoupleOwner || isFamilyOwner || isInvitedMember
  const partnerItem = isCoupleOwner ? coupleItem : familyItem
  const menuItems = showFamilyOrCouple
    ? [...baseMenuItems, partnerItem, subscriptionItem, profileItem]
    : [...baseMenuItems, subscriptionItem, profileItem]

  function handleLogout() {
    clearAuth()
    router.replace('/login')
  }

  return (
    <aside
      data-expanded={expanded}
      onMouseEnter={() => setSidebarExpanded(true)}
      onMouseLeave={() => setSidebarExpanded(false)}
      className={`fixed left-0 top-0 z-50 flex h-screen flex-col overflow-hidden border-r border-mood-primary/15 bg-mood-card/95 shadow-[0_16px_50px_-24px_rgba(var(--mood-shadow-rgb),0.45)] backdrop-blur-md transition-[width] duration-300 ease-out ${
        expanded ? 'w-64' : 'w-20'
      }`}
    >
      <div className="flex items-center gap-2 px-4 py-5">
        <motion.img
          src={SIDEBAR_MASCOT_SRC}
          alt="Moko"
          className="h-12 w-12 flex-shrink-0 object-contain drop-shadow-[0_4px_8px_rgba(var(--mood-shadow-rgb),0.18)]"
        />
        <Wordmark
          className={`whitespace-nowrap text-lg transition-opacity duration-200 ${
            expanded ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
        />
      </div>

      <nav className="flex-1 space-y-1 px-3 py-1">
        {menuItems.map((item) => {
          const active = pathname === item.path
          return (
            <Link
              key={item.path}
              href={item.path}
              title={t(item.labelKey)}
              className={`group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
                active
                  ? 'bg-mood-primary text-white shadow-md shadow-mood-primary/25'
                  : 'text-mood-ink/75 hover:bg-mood-primary/8 hover:text-mood-primary'
              }`}
            >
              <item.icon className="h-4.5 w-4.5 flex-shrink-0" strokeWidth={2.2} />
              <span
                className={`whitespace-nowrap transition-opacity duration-200 ${
                  expanded ? 'opacity-100' : 'pointer-events-none opacity-0'
                }`}
              >
                {t(item.labelKey)}
              </span>
              {active && expanded && (
                <motion.span
                  layoutId="sidebar-active"
                  className="ml-auto h-1.5 w-1.5 flex-shrink-0 rounded-full bg-white"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
            </Link>
          )
        })}
      </nav>

      <div className="space-y-3 border-t border-mood-primary/10 px-3 py-4">
        <button
          type="button"
          onClick={handleLogout}
          title={t('nav.logout')}
          className="flex w-full items-center gap-2.5 rounded-xl border border-mood-primary/15 bg-mood-cream px-3.5 py-2.5 text-sm font-medium text-mood-ink/80 transition-colors hover:border-rose-400/60 hover:bg-rose-500/10 hover:text-rose-500"
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          <span
            className={`whitespace-nowrap transition-opacity duration-200 ${
              expanded ? 'opacity-100' : 'pointer-events-none opacity-0'
            }`}
          >
            {t('nav.logout')}
          </span>
        </button>
        <p
          className={`whitespace-nowrap px-1 text-[11px] font-medium text-mood-muted/70 transition-opacity duration-200 ${
            expanded ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
        >
          AUREON · v1.0
        </p>
      </div>
    </aside>
  )
}
