'use client'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { useLanding } from '@/lib/landingI18n'

const CTA_MASCOT_SRC = '/17.png'

export function CTA() {
  const router = useRouter()
  const { L } = useLanding()

  return (
    <section className="bg-aureon-cream pb-24 pt-8 lg:pb-28">
      <div className="mx-auto max-w-7xl px-5 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-aureon-purple via-aureon-deep to-aureon-purple px-7 py-14 shadow-2xl shadow-aureon-purple/30 sm:px-12 sm:py-16 lg:px-16 lg:py-20"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              background:
                'radial-gradient(circle at 12% 20%, rgba(255,200,120,0.20), transparent 45%), radial-gradient(circle at 90% 90%, rgba(255,248,238,0.18), transparent 50%)',
            }}
          />

          <div className="relative grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <h2 className="font-display text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
                {L.cta.heading}
              </h2>
              <div className="mt-8">
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => router.push('/register')}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-base font-bold text-aureon-deep shadow-xl shadow-black/20 transition-colors hover:bg-aureon-cream"
                >
                  {L.cta.button}
                  <ArrowRight className="h-4 w-4" />
                </motion.button>
              </div>
            </div>

            <div className="relative hidden lg:col-span-4 lg:block">
              <motion.img
                src={CTA_MASCOT_SRC}
                alt="Moko waving"
                animate={{ y: [0, -8, 0], rotate: [-2, 2, -2] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="ml-auto h-80 w-[28rem] max-w-full object-contain drop-shadow-[0_24px_28px_rgba(0,0,0,0.25)]"
              />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
