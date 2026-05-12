'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  Receipt,
  ScanLine,
  PiggyBank,
  Target,
  Users,
  Heart,
  Settings,
  Crown,
} from 'lucide-react'
import { useLanguage } from './LanguageProvider'
import type { TKey } from '@/lib/i18n'

const baseNavItems: Array<{ path: string; labelKey: TKey; icon: typeof LayoutDashboard }> = [
  { path: '/dashboard',    labelKey: 'nav.dashboard',    icon: LayoutDashboard },
  { path: '/transactions', labelKey: 'nav.transactions', icon: Receipt },
  { path: '/upload',       labelKey: 'nav.upload',       icon: ScanLine },
  { path: '/budget',       labelKey: 'nav.budget',       icon: PiggyBank },
  { path: '/goals',        labelKey: 'nav.goals',        icon: Target },
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

export default function BottomNav() {
  const pathname = usePathname()
  const { t } = useLanguage()
  const [accountType, setAccountType] = useState<string | null>(null)
  const [inFamily, setInFamily] = useState(false)

  useEffect(() => {
    setAccountType(readAccountType())
    setInFamily(readInFamily())
    const sync = () => {
      setAccountType(readAccountType())
      setInFamily(readInFamily())
    }
    window.addEventListener('profileUpdated', sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener('profileUpdated', sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  // 'khos' goes to /couple, 'gerbul' to /family. Invited members default
  // to /family since invitations are family-only today.
  const isCouple = accountType === 'khos'
  const showFamilyOrCouple = accountType === 'gerbul' || isCouple || inFamily
  const partnerItem = isCouple ? coupleItem : familyItem
  const navItems = showFamilyOrCouple
    ? [...baseNavItems, partnerItem, subscriptionItem, profileItem]
    : [...baseNavItems, subscriptionItem, profileItem]

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex items-stretch justify-between gap-0.5 border-t border-mood-primary/10 bg-mood-card/95 px-1 pb-[env(safe-area-inset-bottom)] pt-1.5 backdrop-blur-md sm:gap-1 sm:px-2 sm:pt-2"
      style={{ boxShadow: '0 -8px 32px -16px rgba(var(--mood-shadow-rgb),0.20)' }}
    >
      {navItems.map((item) => {
        const active = pathname === item.path
        return (
          <Link
            key={item.path}
            href={item.path}
            className="relative flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 py-1.5 transition-colors"
          >
            {active && (
              <motion.span
                layoutId="bottomnav-active"
                className="absolute inset-0 rounded-2xl bg-mood-primary/10"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            <item.icon
              className={`relative h-[18px] w-[18px] sm:h-5 sm:w-5 ${active ? 'text-mood-primary' : 'text-mood-muted'}`}
              strokeWidth={active ? 2.4 : 2}
            />
            <span className={`relative max-w-full truncate text-[9px] font-semibold leading-tight sm:text-[10px] ${active ? 'text-mood-primary' : 'text-mood-muted'}`}>
              {t(item.labelKey)}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
