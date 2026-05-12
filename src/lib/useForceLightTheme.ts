'use client'
import { useEffect } from 'react'
import { applyAccountTheme, isAccountKey, DEFAULT_ACCOUNT } from './accountThemes'

// Public pages (login/register/setup/landing) must ignore the user's
// dashboard darkmode preference. AccountThemeProvider lives only inside the
// dashboard layout, so a navigation from a dark dashboard to /login would
// leave .dark on <html> until something resets it. This hook re-applies the
// current account theme in light mode on mount.
export function useForceLightTheme() {
  useEffect(() => {
    const current = document.documentElement.getAttribute('data-theme')
    const key = isAccountKey(current) ? current : DEFAULT_ACCOUNT
    applyAccountTheme(key, false)
  }, [])
}
