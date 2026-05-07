'use client'
import { useEffect, useRef, useState } from 'react'
import { Check, Palette } from 'lucide-react'
import { THEMES } from '@/lib/themes'
import { useTheme } from './ThemeProvider'

interface ThemeSwitcherProps {
  variant?: 'sidebar' | 'inline'
  align?: 'left' | 'right'
  expanded?: boolean
}

export default function ThemeSwitcher({
  variant = 'sidebar',
  align = 'left',
  expanded = true,
}: ThemeSwitcherProps) {
  const { theme, setTheme } = useTheme()
  const [open, setOpen] = useState(false)
  const [popupStyle, setPopupStyle] = useState<{
    left: number
    top?: number
    bottom?: number
  } | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  useEffect(() => {
    if (!open || variant !== 'sidebar') return

    const updatePosition = () => {
      if (!wrapRef.current) return
      const rect = wrapRef.current.getBoundingClientRect()
      const gap = 8
      const spaceAbove = rect.top
      const spaceBelow = window.innerHeight - rect.bottom
      const shouldOpenAbove = spaceAbove >= 280 || spaceAbove > spaceBelow

      setPopupStyle(
        shouldOpenAbove
          ? {
              left: rect.left,
              bottom: window.innerHeight - rect.top + gap,
            }
          : {
              left: rect.left,
              top: rect.bottom + gap,
            },
      )
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [open, variant])

  const current = THEMES.find((t) => t.id === theme) ?? THEMES[0]
  const isSidebarCompact = variant === 'sidebar' && !expanded

  const triggerClass =
    variant === 'sidebar'
      ? `flex w-full items-center rounded-xl border border-mood-primary/15 bg-mood-cream text-sm font-medium text-mood-ink/80 transition hover:border-mood-primary/40 hover:text-mood-primary ${
          isSidebarCompact ? 'justify-center px-2.5 py-2.5' : 'gap-2.5 px-3.5 py-2.5 text-left'
        }`
      : 'flex items-center gap-2 rounded-xl border border-mood-primary/15 bg-mood-cream px-3 py-2 text-sm font-medium text-mood-ink transition hover:bg-mood-primary/5'

  const labelHideClass =
    variant === 'sidebar'
      ? expanded
        ? 'opacity-100 transition-opacity duration-200'
        : 'pointer-events-none opacity-0 transition-opacity duration-200'
      : ''

  const swatchClass =
    variant === 'sidebar'
      ? isSidebarCompact
        ? 'hidden'
        : labelHideClass
      : ''

  const textClass =
    variant === 'sidebar'
      ? expanded
        ? 'opacity-100 transition-opacity duration-200'
        : 'pointer-events-none hidden opacity-0 transition-opacity duration-200'
      : ''

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={triggerClass}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Өнгөний theme сонгох"
        title={current.label}
      >
        <Palette className="h-4 w-4 flex-shrink-0 text-mood-primary" />
        <span
          className={`inline-block h-4 w-4 flex-shrink-0 rounded-full ring-1 ring-mood-primary/20 ${swatchClass}`}
          style={{
            background: `linear-gradient(135deg, ${current.swatch.primary} 0%, ${current.swatch.accent} 100%)`,
          }}
        />
        <span className={`flex-1 truncate whitespace-nowrap ${textClass}`}>{current.label}</span>
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Theme сонголт"
          className={`z-50 w-64 rounded-2xl border border-mood-primary/15 bg-mood-card p-2 shadow-2xl shadow-mood-primary/15 ${
            variant === 'sidebar'
              ? `fixed ${popupStyle ? '' : 'invisible'}`
              : `absolute mt-2 ${align === 'right' ? 'right-0' : 'left-0'}`
          }`}
          style={variant === 'sidebar' ? popupStyle ?? { left: 0, top: 0 } : undefined}
        >
          {THEMES.map((t) => {
            const active = t.id === theme
            return (
              <button
                key={t.id}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => {
                  setTheme(t.id)
                  setOpen(false)
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                  active
                    ? 'bg-mood-primary text-white'
                    : 'text-mood-ink/85 hover:bg-mood-primary/8'
                }`}
              >
                <span
                  className="inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full ring-1 ring-mood-primary/20"
                  style={{
                    background: `linear-gradient(135deg, ${t.swatch.primary} 0%, ${t.swatch.accent} 100%)`,
                  }}
                >
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ background: t.swatch.background }}
                  />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-semibold">{t.label}</span>
                  <span className={`block truncate text-xs ${active ? 'text-white/80' : 'text-mood-muted'}`}>
                    {t.description}
                  </span>
                </span>
                {active && <Check className="h-4 w-4 flex-shrink-0" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
