'use client'
import { motion, type Variants } from 'framer-motion'
import { Quote } from 'lucide-react'
import { useLanding } from '@/lib/landingI18n'

const avatarColors = [
  'bg-aureon-purple/15 text-aureon-purple',
  'bg-aureon-acorn/20 text-aureon-acorn',
  'bg-aureon-deep/15 text-aureon-deep',
]

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p.replace('.', '').charAt(0))
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

const card: Variants = {
  hidden: { opacity: 0, y: 24 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut' } },
}

export function Testimonials() {
  const { L } = useLanding()

  return (
    <section className="bg-aureon-cream py-24 lg:py-28">
      <div className="mx-auto max-w-7xl px-5 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full bg-aureon-purple/10 px-3 py-1 text-xs font-semibold text-aureon-purple">
            {L.testimonials.kicker}
          </span>
          <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-aureon-ink sm:text-4xl lg:text-5xl">
            {L.testimonials.heading}
          </h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
          variants={{ show: { transition: { staggerChildren: 0.1 } } }}
          className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3"
        >
          {L.testimonials.items.map((t, i) => (
            <motion.figure
              key={t.name}
              variants={card}
              whileHover={{ y: -4 }}
              className="relative flex flex-col rounded-3xl border border-aureon-purple/8 bg-aureon-ivory p-7 shadow-[0_4px_24px_-12px_rgba(76,29,149,0.10)] transition-shadow hover:shadow-[0_18px_40px_-18px_rgba(76,29,149,0.30)]"
            >
              <Quote className="h-7 w-7 text-aureon-purple/40" />
              <blockquote className="mt-3 text-[15px] leading-relaxed text-aureon-ink/90">
                “{t.quote}”
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold ${avatarColors[i % avatarColors.length]}`}
                >
                  {initials(t.name)}
                </div>
                <div>
                  <div className="text-sm font-semibold text-aureon-ink">{t.name}</div>
                  <div className="text-xs text-aureon-muted">{t.role}</div>
                </div>
              </figcaption>
            </motion.figure>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
