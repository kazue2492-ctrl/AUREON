'use client'
import { useRouter } from 'next/navigation'
import { motion, type Variants } from 'framer-motion'
import {
  Check,
  Sparkles,
  GraduationCap,
  Heart,
  Users,
  Crown,
  type LucideIcon,
} from 'lucide-react'
import { useLanding } from '@/lib/landingI18n'
import type { AccountKey } from '@/lib/accountThemes'

// Plan metadata kept here (price + per-tier visual accent) so landing copy
// stays in landingI18n.ts and only the visual tokens live with the component.
const PLAN_META: Record<AccountKey, { price: { mn: string; en: string }; icon: LucideIcon; accent: string; ring: string }> = {
  engiin: {
    price: { mn: '0₮',       en: '$0'      },
    icon:  Sparkles,
    accent: '#6D28D9',
    ring:   'rgba(109, 40, 217, 0.18)',
  },
  oyutan: {
    price: { mn: '0₮',       en: '$0'      },
    icon:  GraduationCap,
    accent: '#0EA5E9',
    ring:   'rgba(14, 165, 233, 0.18)',
  },
  khos: {
    price: { mn: '₮4,900',   en: '$1.90'   },
    icon:  Heart,
    accent: '#EC4899',
    ring:   'rgba(236, 72, 153, 0.18)',
  },
  gerbul: {
    price: { mn: '₮14,900',  en: '$5.90'   },
    icon:  Crown,
    accent: '#F59E0B',
    ring:   'rgba(245, 158, 11, 0.20)',
  },
}

const card: Variants = {
  hidden: { opacity: 0, y: 24 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut' } },
}

export function Pricing() {
  const router = useRouter()
  const { lang, L } = useLanding()
  const isFree = (id: string) => id === 'engiin' || id === 'oyutan'

  return (
    <section id="pricing" className="relative overflow-hidden bg-aureon-cream py-16 sm:py-24 lg:py-28">
      <div className="pointer-events-none absolute inset-0 bg-aureon-dots opacity-50" />
      <img
        src="/25.png"
        alt="Moko pointing at prices"
        draggable={false}
        aria-hidden
        className="pointer-events-none absolute -bottom-10 -left-24 z-10 hidden h-[28rem] w-[28rem] select-none object-contain drop-shadow-[0_18px_28px_rgba(76,29,149,0.20)] md:block lg:-bottom-14 lg:-left-32 lg:h-[40rem] lg:w-[40rem]"
      />
      <div className="relative mx-auto max-w-7xl px-5 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full bg-aureon-purple/10 px-3 py-1 text-xs font-semibold text-aureon-purple">
            {L.pricing.kicker}
          </span>
          <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-aureon-ink sm:text-4xl lg:text-5xl">
            {L.pricing.heading}
          </h2>
          <p className="mt-4 text-base text-aureon-muted sm:text-lg">{L.pricing.sub}</p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
          variants={{ show: { transition: { staggerChildren: 0.08 } } }}
          className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          {L.pricing.plans.map((plan) => {
            const id = plan.id as AccountKey
            const meta = PLAN_META[id]
            const Icon = meta.icon
            const free = isFree(id)
            const highlight = (plan as { highlight?: boolean }).highlight === true
            const badge = (plan as { badge?: string }).badge

            return (
              <motion.article
                key={id}
                variants={card}
                whileHover={{ y: -6 }}
                className={`relative flex flex-col rounded-3xl bg-aureon-ivory p-5 transition-all sm:p-7 ${
                  highlight
                    ? 'border-2 ring-4 shadow-2xl'
                    : 'border border-aureon-purple/8 shadow-[0_4px_24px_-12px_rgba(76,29,149,0.10)] hover:shadow-[0_18px_40px_-18px_rgba(76,29,149,0.30)]'
                }`}
                style={
                  highlight
                    ? {
                        borderColor: meta.accent,
                        boxShadow: `0 24px 60px -24px ${meta.ring}, 0 0 0 4px ${meta.ring}`,
                      }
                    : undefined
                }
              >
                {highlight && (
                  <span
                    className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold text-white shadow-md"
                    style={{ background: meta.accent }}
                  >
                    <Sparkles className="h-3 w-3" />
                    {L.pricing.popular}
                  </span>
                )}

                <div
                  className="flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-md"
                  style={{ background: meta.accent, boxShadow: `0 8px 20px -8px ${meta.ring}` }}
                >
                  <Icon className="h-6 w-6" />
                </div>

                <div className="mt-5">
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-lg font-bold text-aureon-ink">{plan.name}</h3>
                    {badge && (
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                        style={{
                          background: `${meta.accent}1A`,
                          color: meta.accent,
                        }}
                      >
                        {badge}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-aureon-muted">{plan.tagline}</p>
                </div>

                <div className="mt-5 flex items-baseline gap-1">
                  <span className="font-display text-3xl font-extrabold tracking-tight text-aureon-ink sm:text-4xl">
                    {free ? L.pricing.free : meta.price[lang]}
                  </span>
                  {!free && (
                    <span className="text-sm font-medium text-aureon-muted">
                      {L.pricing.perMonth}
                    </span>
                  )}
                </div>

                <ul className="mt-6 flex-1 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-aureon-ink/85">
                      <span
                        className="mt-0.5 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full"
                        style={{ background: `${meta.accent}1A`, color: meta.accent }}
                      >
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => router.push('/register')}
                  className={`mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold transition-colors ${
                    highlight
                      ? 'text-white shadow-lg'
                      : 'border-2'
                  }`}
                  style={
                    highlight
                      ? { background: meta.accent, boxShadow: `0 12px 24px -8px ${meta.ring}` }
                      : { borderColor: `${meta.accent}55`, color: meta.accent }
                  }
                >
                  {free ? L.pricing.ctaFree : L.pricing.ctaPaid}
                </motion.button>
              </motion.article>
            )
          })}
        </motion.div>

        <p className="mt-8 text-center text-xs text-aureon-muted">
          <Users className="mr-1 inline h-3.5 w-3.5" />
          {L.hero.trustUsers} · <span className="opacity-70">{L.hero.trustSecurity}</span>
        </p>
      </div>
    </section>
  )
}
