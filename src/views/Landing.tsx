'use client'
import { Navbar }       from './landing/Navbar'
import { Hero }         from './landing/Hero'
import { MascotIntro }  from './landing/MascotIntro'
import { Features }     from './landing/Features'
import { Pricing }      from './landing/Pricing'
import { HowItWorks }   from './landing/HowItWorks'
import { Stats }        from './landing/Stats'
import { Testimonials } from './landing/Testimonials'
import { CTA }          from './landing/CTA'
import { Footer }       from './landing/Footer'
import { useForceLightTheme } from '@/lib/useForceLightTheme'

export default function Landing() {
  useForceLightTheme()
  return (
    <main className="scroll-smooth bg-aureon-cream font-sans text-aureon-ink antialiased">
      <Navbar />
      <Hero />
      <MascotIntro />
      <Features />
      <Pricing />
      <HowItWorks />
      <Stats />
      <Testimonials />
      <CTA />
      <Footer />
    </main>
  )
}
