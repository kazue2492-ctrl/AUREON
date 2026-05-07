'use client'
import { motion, type Variants } from 'framer-motion'
import { Heart, Sparkles, ShieldCheck } from 'lucide-react'
import { useLanding } from '@/lib/landingI18n'

const MASCOT_INTRO_SRC = '/24.png'

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
}

export function MascotIntro() {
  const { L } = useLanding()
  const badgeIcons = [Heart, Sparkles, ShieldCheck]

  return (
    <section id="about" className="relative bg-aureon-ivory py-32 lg:py-44">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -left-40 top-1/2 h-[700px] w-[700px] -translate-y-1/2 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.18), rgba(109,40,217,0.10) 55%, transparent 75%)' }}
        />
        <div
          className="absolute right-0 top-10 h-[420px] w-[420px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.16), transparent 70%)' }}
        />
      </div>

      <div className="mx-auto grid max-w-[88rem] grid-cols-1 items-center gap-16 px-5 lg:grid-cols-12 lg:gap-20 lg:px-12">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          className="order-2 lg:order-1 lg:col-span-5"
        >
          <div className="relative mx-auto aspect-square w-full max-w-[640px]">
            <div
              className="absolute inset-0 -z-10 rounded-full"
              style={{
                background:
                  'radial-gradient(closest-side, rgba(245,158,11,0.28), rgba(139,90,43,0.18) 45%, rgba(109,40,217,0.10) 70%, transparent 80%)',
              }}
            />
            <div className="absolute inset-0 lg:scale-[2]">
              <img
                src={MASCOT_INTRO_SRC}
                alt="Moko celebrating"
                draggable={false}
                className="h-full w-full object-contain drop-shadow-[0_24px_36px_rgba(245,158,11,0.35)]"
              />
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          className="order-1 lg:order-2 lg:col-span-7"
        >
          <span className="inline-flex items-center gap-2 rounded-full bg-aureon-purple/10 px-5 py-2 text-sm font-semibold text-aureon-purple sm:text-base">
            🌰 {L.mascot.title}
          </span>

          <h2 className="mt-6 font-display text-5xl font-extrabold tracking-tight text-aureon-ink sm:text-6xl lg:text-7xl">
            {L.mascot.name}
          </h2>

          <div className="relative mt-8">
            <div className="relative rounded-3xl bg-white px-8 py-8 text-aureon-ink shadow-[0_20px_40px_-20px_rgba(76,29,149,0.25)] ring-1 ring-aureon-purple/10 sm:px-10 sm:py-10">
              <span
                aria-hidden
                className="absolute -left-3 top-12 hidden h-7 w-7 rotate-45 rounded-sm bg-white ring-1 ring-aureon-purple/10 lg:block"
                style={{ clipPath: 'polygon(0 0, 100% 0, 0 100%)' }}
              />
              <p className="text-lg leading-relaxed sm:text-xl lg:text-2xl">{L.mascot.bubble}</p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            {L.mascot.badges.map((b, i) => {
              const Icon = badgeIcons[i] ?? Heart
              return (
                <span
                  key={b}
                  className="inline-flex items-center gap-2 rounded-full border border-aureon-purple/15 bg-aureon-cream px-5 py-2.5 text-base font-semibold text-aureon-ink/85"
                >
                  <Icon className="h-4 w-4 text-aureon-purple" />
                  {b}
                </span>
              )
            })}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
