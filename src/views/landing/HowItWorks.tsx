'use client'
import { motion, type Variants } from 'framer-motion'
import { Link2, Activity, Sprout } from 'lucide-react'
import { useLanding } from '@/lib/landingI18n'
import { MASCOT_SRC } from './mascot'

const stepIcons = [Link2, Activity, Sprout]

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut' } },
}

export function HowItWorks() {
  const { L } = useLanding()

  return (
    <section id="how" className="relative bg-aureon-ivory py-24 lg:py-28">
      <div className="mx-auto max-w-7xl px-5 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full bg-aureon-purple/10 px-3 py-1 text-xs font-semibold text-aureon-purple">
            {L.how.kicker}
          </span>
          <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-aureon-ink sm:text-4xl lg:text-5xl">
            {L.how.heading}
          </h2>
        </motion.div>

        <div className="relative mt-16 grid grid-cols-1 gap-10 lg:grid-cols-3 lg:gap-6">
          <div className="pointer-events-none absolute left-[12%] right-[12%] top-10 hidden h-px bg-gradient-to-r from-transparent via-aureon-purple/40 to-transparent lg:block" />

          {L.how.steps.map((s, i) => {
            const Icon = stepIcons[i] ?? Link2
            const isLast = i === L.how.steps.length - 1
            return (
              <motion.div
                key={s.title}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: '-60px' }}
                transition={{ delay: i * 0.12 }}
                className="relative flex flex-col items-center text-center"
              >
                <div className="relative">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-lg shadow-aureon-purple/15 ring-1 ring-aureon-purple/15">
                    <Icon className="h-8 w-8 text-aureon-purple" />
                  </div>
                  <span className="absolute -right-2 -top-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-aureon-purple text-xs font-bold text-white shadow">
                    {i + 1}
                  </span>
                </div>
                <h3 className="mt-6 font-display text-xl font-bold text-aureon-ink">{s.title}</h3>
                <p className="mt-2 max-w-xs text-sm leading-relaxed text-aureon-muted">{s.desc}</p>

                {/*                */}
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
