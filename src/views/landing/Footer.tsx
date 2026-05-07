'use client'
import { Instagram, Facebook, Phone } from 'lucide-react'
import { useLanding } from '@/lib/landingI18n'
import { Wordmark } from './Navbar'

export function Footer() {
  const { L } = useLanding()
  const socials = [
    { Icon: Instagram, label: 'Instagram', href: 'https://www.instagram.com/sulde4wy?igsh=MWx2ejNocnM3NmoyMw%3D%3D&utm_source=qr' },
    { Icon: Facebook,  label: 'Facebook',  href: 'https://www.facebook.com/share/18QpZYMPQz/?mibextid=wwXIfr' },
  ]

  return (
    <footer className="bg-aureon-ivory py-10">
      <div className="mx-auto max-w-7xl px-5 lg:px-10">
        <div className="flex flex-col items-center justify-between gap-5 sm:flex-row">
          <Wordmark className="text-base" />

          <a
            href="tel:+97695661893"
            className="inline-flex items-center gap-2 text-sm font-medium text-aureon-ink/80 transition-colors hover:text-aureon-purple"
          >
            <Phone className="h-4 w-4" />
            <span>Холбоо барих:</span>
            <span className="font-semibold tracking-wide">9566 1893</span>
          </a>

          <p className="text-center text-xs text-aureon-muted sm:text-left">{L.footer.copy}</p>

          <div className="flex items-center gap-2">
            {socials.map(({ Icon, label, href }) => {
              const external = href.startsWith('http')
              return (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-aureon-purple/15 text-aureon-ink/70 transition-colors hover:border-aureon-purple hover:text-aureon-purple"
                >
                  <Icon className="h-4 w-4" />
                </a>
              )
            })}
          </div>
        </div>
      </div>
    </footer>
  )
}
