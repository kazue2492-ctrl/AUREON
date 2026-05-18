'use client'
import { useEffect, useState, useCallback } from 'react'
import {
  applyAccountTheme,
  isAccountKey,
  DEFAULT_ACCOUNT,
  type AccountKey,
} from '@/lib/accountThemes'
import { getProfile } from '@/lib/data'
import { getUser } from '@/lib/clientAuth'

const STORAGE_KEY = 'walletHubAccountType'

function read(): AccountKey {
  if (typeof window === 'undefined') return DEFAULT_ACCOUNT
  const v = window.localStorage.getItem(STORAGE_KEY)
  const cached: AccountKey = isAccountKey(v) ? v : DEFAULT_ACCOUNT

  // 'khos' (Pro) and 'gerbul' (Premium) palettes belong to *paid* tiers.
  // When the user has no active subscription (cancelled / expired / never
  // bought), fall back to the neutral 'engiin' mood so the UI visibly
  // resets to the free state. 'engiin' and 'oyutan' are free tiers and
  // don't need an active subscription. The cached accountType is
  // preserved so renewing the same tier restores the right palette.
  const subscriptionActive = getUser()?.subscriptionStatus === 'active'
  if (!subscriptionActive && (cached === 'khos' || cached === 'gerbul')) {
    return 'engiin'
  }
  return cached
}

function readDarkMode(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return getProfile().darkMode === true
  } catch {
    return false
  }
}

/**
 * Reads `walletHubAccountType` from localStorage and applies the matching
 * mood palette to <html> as CSS custom properties. Re-applies on
 * `profileUpdated` and on storage events from other tabs.
 *
 * Also drives the .dark class — mood tokens are inline styles so a CSS-only
 * `.dark { --mood-* }` override would lose; tokens are swapped here instead.
 */
export function AccountThemeProvider({ children }: { children: React.ReactNode }) {
  const [, setAccount] = useState<AccountKey>(DEFAULT_ACCOUNT)

  const refresh = useCallback(() => {
    const next = read()
    setAccount(next)
    applyAccountTheme(next, readDarkMode())
  }, [])

  useEffect(() => {
    refresh()
    const onUpdate = () => refresh()
    window.addEventListener('profileUpdated', onUpdate)
    window.addEventListener('storage', onUpdate)
    return () => {
      window.removeEventListener('profileUpdated', onUpdate)
      window.removeEventListener('storage', onUpdate)
    }
  }, [refresh])

  return <>{children}</>
}
