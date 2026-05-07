'use client'
import { motion, type Variants } from 'framer-motion'
import {
  Wallet,
  Target,
  PieChart,
  TrendingUp,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'
import { useLanding } from '@/lib/landingI18n'

const ICONS: LucideIcon[] = [Wallet, Target, PieChart, TrendingUp, ShieldCheck, Sparkles]

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
}

const card: Variants = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
}

export function Features() {
  const { L } = useLanding()

  return (
    <section id="features" className="relative bg-aureon-cream py-24 lg:py-28">
      <div className="mx-auto max-w-7xl px-5 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full bg-aureon-purple/10 px-3 py-1 text-xs font-semibold text-aureon-purple">
            {L.features.kicker}
          </span>
          <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-aureon-ink sm:text-4xl lg:text-5xl">
            {L.features.heading}
          </h2>
          <p className="mt-4 text-base text-aureon-muted sm:text-lg">{L.features.sub}</p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
          className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {L.features.items.map((f, i) => {
            const Icon = ICONS[i]
            return (
              <motion.div
                key={f.title}
                variants={card}
                whileHover={{ y: -6 }}
                className="group rounded-3xl border border-aureon-purple/8 bg-aureon-ivory p-7 shadow-[0_4px_24px_-12px_rgba(76,29,149,0.10)] transition-all hover:border-aureon-purple/20 hover:shadow-[0_18px_40px_-18px_rgba(76,29,149,0.30)]"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-aureon-purple/10 text-aureon-purple transition-colors group-hover:bg-aureon-purple group-hover:text-white">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 font-display text-lg font-bold text-aureon-ink">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-aureon-muted">{f.desc}</p>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
