'use client'
import { Globe } from 'lucide-react'
import { useLanding } from '@/lib/landingI18n'

export function LanguageToggle() {
  const { lang, setLang } = useLanding()
  const next = lang === 'mn' ? 'en' : 'mn'

  return (
    <button
      type="button"
      onClick={() => setLang(next)}
      aria-label={`Switch to ${next.toUpperCase()}`}
      className="inline-flex items-center gap-1.5 rounded-full border border-aureon-purple/15 bg-white/70 px-3 py-1.5 text-xs font-semibold text-aureon-ink/80 backdrop-blur transition-all hover:border-aureon-purple/40 hover:text-aureon-purple"
    >
      <Globe className="h-3.5 w-3.5 text-aureon-purple" />
      <span className={lang === 'mn' ? 'text-aureon-purple' : 'text-aureon-muted/70'}>МН</span>
      <span className="text-aureon-muted/40">|</span>
      <span className={lang === 'en' ? 'text-aureon-purple' : 'text-aureon-muted/70'}>EN</span>
    </button>
  )
}
