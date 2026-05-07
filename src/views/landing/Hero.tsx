'use client'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowRight, Users, ShieldCheck } from 'lucide-react'
import { useLanding } from '@/lib/landingI18n'
import { MASCOT_SRC } from './mascot'

const acorns = [
  { left: '6%',  top: '12%', size: 28, delay: 0,   dur: 7  },
  { left: '88%', top: '20%', size: 22, delay: 1.5, dur: 9  },
  { left: '14%', top: '78%', size: 32, delay: 2.5, dur: 8  },
  { left: '82%', top: '72%', size: 26, delay: 0.8, dur: 10 },
]

export function Hero() {
  const router = useRouter()
  const { L } = useLanding()

  return (
    <section
      id="top"
      className="relative isolate overflow-hidden bg-aureon-cream pt-32 lg:pt-40"
    >
      <div className="pointer-events-none absolute inset-0 -z-10 bg-aureon-dots opacity-70" />
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-gradient-to-b from-aureon-purple/5 to-transparent" />

      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-5 pb-24 lg:grid-cols-12 lg:gap-8 lg:px-10 lg:pb-32">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="lg:col-span-6"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-aureon-purple/15 bg-white/70 px-3 py-1 text-xs font-semibold text-aureon-purple backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-aureon-purple" />
            {L.hero.tagline}
          </span>

          <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-aureon-ink sm:text-5xl lg:text-6xl">
            {L.hero.heading}
          </h1>

          <p className="mt-5 max-w-xl text-base leading-relaxed text-aureon-muted sm:text-lg">
            {L.hero.sub}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => router.push('/register')}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-aureon-purple px-7 py-3.5 text-base font-semibold text-white shadow-xl shadow-aureon-purple/30 transition-colors hover:bg-aureon-deep"
            >
              {L.hero.ctaPrimary}
              <ArrowRight className="h-4 w-4" />
            </motion.button>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-aureon-muted">
            <span className="inline-flex items-center gap-1.5">
              <Users className="h-4 w-4 text-aureon-purple" />
              {L.hero.trustUsers}
            </span>
            <span className="hidden h-1 w-1 rounded-full bg-aureon-muted/40 sm:inline-block" />
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-aureon-purple" />
              {L.hero.trustSecurity}
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
          className="relative lg:col-span-6"
        >
          <div className="relative mx-auto aspect-square w-full max-w-[560px]">
            <div
              className="absolute inset-0 -z-10 rounded-full"
              style={{
                background:
                  'radial-gradient(closest-side, rgba(109,40,217,0.28), rgba(109,40,217,0.06) 60%, transparent 75%)',
              }}
            />

            {acorns.map((a, i) => (
              <motion.span
                key={i}
                aria-hidden
                initial={{ y: 0, rotate: 0 }}
                animate={{ y: [0, -18, 0], rotate: [0, 8, -6, 0] }}
                transition={{
                  duration: a.dur,
                  delay: a.delay,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                style={{ left: a.left, top: a.top, fontSize: a.size }}
                className="absolute select-none drop-shadow-sm"
              >
                🌰
              </motion.span>
            ))}

            <motion.img
              src={MASCOT_SRC}
              alt="Aurin — AUREON mascot"
              draggable={false}
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              whileHover={{ scale: 1.04, rotate: -2 }}
              className="relative mx-auto h-full w-full select-none object-contain drop-shadow-[0_30px_40px_rgba(76,29,149,0.25)]"
            />
          </div>
        </motion.div>
      </div>
    </section>
  )
}
