'use client'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  DEFAULT_THEME,
  THEME_STORAGE_KEY,
  type ThemeId,
  isThemeId,
} from '@/lib/themes'
import { applyAccountTheme, isAccountKey } from '@/lib/accountThemes'

interface ThemeContextValue {
  theme: ThemeId
  setTheme: (id: ThemeId) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function applyTheme(id: ThemeId) {
  document.documentElement.setAttribute('data-theme', id)
  // Also drive the new per-account mood palette (--mood-* CSS vars).
  // ThemeId and AccountKey share the same 4 values: engiin/oyutan/khos/gerbul.
  if (isAccountKey(id)) applyAccountTheme(id)
}

export function ThemeProvider({
  children,
  defaultTheme = DEFAULT_THEME,
}: {
  children: React.ReactNode
  defaultTheme?: ThemeId
}) {
  const [theme, setThemeState] = useState<ThemeId>(defaultTheme)

  useEffect(() => {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    const legacy = localStorage.getItem('walletHubAccountType')
    const initial = isThemeId(stored)
      ? stored
      : isThemeId(legacy)
        ? legacy
        : defaultTheme
    setThemeState(initial)
    applyTheme(initial)
  }, [defaultTheme])

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === THEME_STORAGE_KEY && isThemeId(e.newValue)) {
        setThemeState(e.newValue)
        applyTheme(e.newValue)
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const setTheme = useCallback((id: ThemeId) => {
    setThemeState(id)
    applyTheme(id)
    try {
      localStorage.setItem(THEME_STORAGE_KEY, id)
      localStorage.setItem('walletHubAccountType', id)
    } catch {}
    window.dispatchEvent(new Event('themeChanged'))
    // Notify AccountThemeProvider listeners (Sidebar/BottomNav read accountType too).
    window.dispatchEvent(new Event('profileUpdated'))
  }, [])

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    throw new Error('useTheme must be used inside <ThemeProvider>')
  }
  return ctx
}

export const THEME_INIT_SCRIPT = `(function(){try{var s=localStorage.getItem('${THEME_STORAGE_KEY}');var l=localStorage.getItem('walletHubAccountType');var v=['engiin','gerbul','khos','oyutan'];var t=v.indexOf(s)>=0?s:(v.indexOf(l)>=0?l:'${DEFAULT_THEME}');document.documentElement.setAttribute('data-theme',t);}catch(e){document.documentElement.setAttribute('data-theme','${DEFAULT_THEME}');}})();`
