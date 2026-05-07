'use client'
import { motion, type Variants } from 'framer-motion'
import { useLanding } from '@/lib/landingI18n'

const item: Variants = {
  hidden: { opacity: 0, y: 18 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
}

export function Stats() {
  const { L } = useLanding()
  return (
    <section className="bg-aureon-cream pb-4">
      <div className="mx-auto max-w-7xl px-5 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-aureon-deep via-aureon-purple to-aureon-deep p-8 shadow-2xl shadow-aureon-purple/30 sm:p-10"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-30"
            style={{
              background:
                'radial-gradient(circle at 20% 20%, rgba(255,248,238,0.25), transparent 50%), radial-gradient(circle at 80% 80%, rgba(255,200,120,0.20), transparent 50%)',
            }}
          />
          <motion.ul
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-60px' }}
            variants={{ show: { transition: { staggerChildren: 0.08 } } }}
            className="relative grid grid-cols-2 gap-6 text-white sm:gap-8 lg:grid-cols-4"
          >
            {L.stats.items.map((s) => (
              <motion.li key={s.label} variants={item} className="text-center">
                <div className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
                  {s.value}
                </div>
                <div className="mt-1 text-sm text-white/75 sm:text-base">{s.label}</div>
              </motion.li>
            ))}
          </motion.ul>
        </motion.div>
      </div>
    </section>
  )
}
