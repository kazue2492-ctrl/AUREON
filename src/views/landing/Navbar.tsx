'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLanding } from '@/lib/landingI18n'
import { LanguageToggle } from './LanguageToggle'

export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`font-display text-xl font-extrabold tracking-tight text-aureon-ink ${className}`}>
      AURE
      <span className="relative inline-block">
        O
        <span className="absolute -top-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-aureon-acorn" />
      </span>
      N
    </span>
  )
}

export function Navbar() {
  const router = useRouter()
  const { L } = useLanding()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const links = [
    { label: L.nav.features, href: '#features' },
    { label: L.nav.pricing,  href: '#pricing'  },
    { label: L.nav.about,    href: '#about'    },
    { label: L.nav.help,     href: '#help'     },
  ]

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-aureon-cream/80 backdrop-blur-md shadow-[0_2px_24px_-12px_rgba(76,29,149,0.18)]'
          : 'bg-transparent'
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-10">
        <a href="#top" className="flex items-center gap-2">
          <Wordmark />
        </a>

        <div className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-aureon-ink/70 transition-colors hover:text-aureon-purple"
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <LanguageToggle />
          <button
            onClick={() => router.push('/login')}
            className="rounded-full px-4 py-2 text-sm font-semibold text-aureon-ink/80 transition-colors hover:text-aureon-purple"
          >
            {L.nav.signin}
          </button>
          <button
            onClick={() => router.push('/login')}
            className="rounded-full bg-aureon-purple px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-aureon-purple/25 transition-all hover:bg-aureon-deep hover:shadow-aureon-purple/40 active:scale-[0.98]"
          >
            {L.nav.start}
          </button>
        </div>

        <button
          type="button"
          aria-label="Menu"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-aureon-purple/15 bg-white/70 text-aureon-ink md:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="md:hidden"
          >
            <div className="mx-4 mb-3 rounded-2xl border border-aureon-purple/10 bg-aureon-ivory p-4 shadow-xl shadow-aureon-purple/10">
              <div className="flex flex-col gap-1">
                {links.map((l) => (
                  <a
                    key={l.href}
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="rounded-xl px-3 py-2.5 text-sm font-medium text-aureon-ink/80 hover:bg-aureon-purple/5 hover:text-aureon-purple"
                  >
                    {l.label}
                  </a>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between gap-2 border-t border-aureon-purple/10 pt-3">
                <LanguageToggle />
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => router.push('/login')}
                    className="rounded-full px-3 py-1.5 text-sm font-semibold text-aureon-ink/80"
                  >
                    {L.nav.signin}
                  </button>
                  <button
                    onClick={() => router.push('/login')}
                    className="rounded-full bg-aureon-purple px-4 py-1.5 text-sm font-semibold text-white"
                  >
                    {L.nav.start}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
