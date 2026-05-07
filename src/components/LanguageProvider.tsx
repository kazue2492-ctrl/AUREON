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
  DEFAULT_LANG,
  LANG_STORAGE_KEY,
  type Lang,
  type TKey,
  isLang,
  translate,
  translateCategory,
} from '@/lib/i18n'

interface LanguageContextValue {
  lang: Lang
  setLang: (lang: Lang) => void
  t: (key: TKey) => string
  tc: (cat: string) => string
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(DEFAULT_LANG)

  useEffect(() => {
    const stored = localStorage.getItem(LANG_STORAGE_KEY)
    if (isLang(stored)) setLangState(stored)
  }, [])

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === LANG_STORAGE_KEY && isLang(e.newValue)) setLangState(e.newValue)
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const setLang = useCallback((next: Lang) => {
    setLangState(next)
    try {
      localStorage.setItem(LANG_STORAGE_KEY, next)
      document.documentElement.setAttribute('lang', next)
    } catch {}
    window.dispatchEvent(new Event('languageChanged'))
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('lang', lang)
  }, [lang])

  const t = useCallback((key: TKey) => translate(lang, key), [lang])
  const tc = useCallback((cat: string) => translateCategory(lang, cat), [lang])

  const value = useMemo(() => ({ lang, setLang, t, tc }), [lang, setLang, t, tc])
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used inside <LanguageProvider>')
  return ctx
}
