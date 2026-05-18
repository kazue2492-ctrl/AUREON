'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  AlertTriangle,
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  ShieldCheck,
  Sparkles,
  UserPlus,
} from 'lucide-react'
import { apiFetch, setToken, setUser, type AuthUser } from '@/lib/clientAuth'
import { seedProfileFromAuth } from '@/lib/data'
import { useLanding } from '@/lib/landingI18n'
import { useForceLightTheme } from '@/lib/useForceLightTheme'
import { Wordmark } from '@/views/landing/Navbar'
import { LanguageToggle } from '@/views/landing/LanguageToggle'
import { MASCOT_SRC } from '@/views/landing/mascot'

interface RegisterResponse {
  token: string
  user: AuthUser
}

export default function RegisterPage() {
  useForceLightTheme()
  const router = useRouter()
  const { lang, L } = useLanding()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [status, setStatus] = useState<'idle' | 'success'>('idle')

  const T = {
    title:        lang === 'mn' ? 'Шинэ бүртгэл'                                : 'Create your account',
    subtitle:     lang === 'mn' ? 'Хэдхэн алхамаар санхүүгийн аяллаа эхлүүл.'   : 'Start your money journey in a few steps.',
    name:         lang === 'mn' ? 'Нэр'                                          : 'Name',
    namePh:       lang === 'mn' ? 'Бат-Эрдэнэ'                                  : 'Jane Doe',
    email:        lang === 'mn' ? 'И-мэйл'                                       : 'Email',
    emailPh:      'email@example.com',
    password:     lang === 'mn' ? 'Нууц үг'                                      : 'Password',
    passwordPh:   lang === 'mn' ? 'Хамгийн багадаа 6 тэмдэгт'                    : 'At least 6 characters',
    submit:       lang === 'mn' ? 'Бүртгүүлэх'                                   : 'Sign up',
    submitting:   lang === 'mn' ? 'Бүртгэж байна...'                             : 'Creating account...',
    success:      lang === 'mn' ? 'Бүртгэл амжилттай үүслээ. Шилжиж байна...'    : 'Account created. Redirecting...',
    haveAccount:  lang === 'mn' ? 'Аль хэдийн бүртгэлтэй юу?'                    : 'Already have an account?',
    signin:       lang === 'mn' ? 'Нэвтрэх'                                      : 'Sign in',
    fillAll:      lang === 'mn' ? 'Бүх талбарыг бөглөнө үү'                      : 'Please fill in all fields',
    short:        lang === 'mn' ? 'Нууц үг хамгийн багадаа 6 тэмдэгт байна'      : 'Password must be at least 6 characters',
    failure:      lang === 'mn' ? 'Бүртгүүлэхэд алдаа гарлаа'                    : 'Sign-up failed',
    secure:       lang === 'mn' ? 'Нууц үг bcrypt-ээр шифрлэгдэнэ'              : 'Passwords are hashed with bcrypt',
    pitch:        lang === 'mn'
      ? 'Анхны царсан модноосоо бүхэл бүтэн ой ургуулъя.'
      : 'Plant your first acorn — grow a whole forest.',
    perks: lang === 'mn'
      ? ['Үнэгүй эхлэх', 'Картын мэдээлэл шаардахгүй', 'Моко-ийн өдөр тутмын зөвлөгөө']
      : ['Free to start', 'No credit card required', "Moko's daily nudges"],
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    if (!name.trim() || !email.trim() || !password) {
      setError(T.fillAll)
      return
    }
    if (password.length < 6) {
      setError(T.short)
      return
    }

    setIsLoading(true)
    try {
      const { token, user } = await apiFetch<RegisterResponse>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
      })

      setToken(token)
      setUser(user)
      seedProfileFromAuth(user)
      setStatus('success')

      setTimeout(() => {
        router.push('/setup')
      }, 600)
    } catch (err) {
      setError(err instanceof Error ? err.message : T.failure)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-aureon-cream font-sans text-aureon-ink">
      <div className="pointer-events-none absolute inset-0 bg-aureon-dots opacity-60" />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 18% 22%, rgba(109,40,217,0.10), transparent 45%), radial-gradient(circle at 82% 80%, rgba(139,90,43,0.08), transparent 45%)',
        }}
      />

      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 lg:px-10">
        <Link href="/" className="inline-flex items-center gap-2">
          <Wordmark />
        </Link>
        <LanguageToggle />
      </header>

      <section className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-5 pb-16 pt-4 lg:grid-cols-12 lg:gap-12 lg:px-10 lg:pt-6">
        <motion.aside
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="hidden lg:col-span-6 lg:flex lg:flex-col lg:gap-6"
        >
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-aureon-purple/15 bg-white/70 px-3 py-1 text-xs font-semibold text-aureon-purple backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" />
            {L.hero.tagline}
          </span>

          <h1 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-aureon-ink xl:text-5xl">
            {T.pitch}
          </h1>

          <div className="relative mx-auto aspect-square w-full max-w-[400px]">
            <div
              className="absolute inset-0 -z-10 rounded-full"
              style={{
                background:
                  'radial-gradient(closest-side, rgba(109,40,217,0.22), rgba(109,40,217,0.05) 60%, transparent 75%)',
              }}
            />
            <motion.img
              src={MASCOT_SRC}
              alt="Moko"
              draggable={false}
              animate={{ y: [0, -10, 0], rotate: [-2, 2, -2] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              className="h-full w-full object-contain drop-shadow-[0_24px_36px_rgba(76,29,149,0.22)]"
            />
          </div>

          <ul className="space-y-2.5">
            {T.perks.map((p, i) => (
              <motion.li
                key={p}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.08, duration: 0.4, ease: 'easeOut' }}
                className="flex items-center gap-2.5 text-sm font-medium text-aureon-ink/80"
              >
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-aureon-purple/10 text-aureon-purple">
                  <ShieldCheck className="h-3.5 w-3.5" />
                </span>
                {p}
              </motion.li>
            ))}
          </ul>
        </motion.aside>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.05 }}
          className="lg:col-span-6"
        >
          <div className="mx-auto w-full max-w-md rounded-2xl border border-aureon-purple/10 bg-aureon-ivory p-5 shadow-[0_24px_60px_-24px_rgba(76,29,149,0.30)] sm:rounded-3xl sm:p-7 lg:p-9">
            <div className="mb-5 sm:mb-7">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-aureon-purple/10 px-3 py-1 text-xs font-semibold text-aureon-purple">
                <UserPlus className="h-3.5 w-3.5" />
                {T.submit}
              </span>
              <h2 className="mt-3 font-display text-2xl font-bold tracking-tight text-aureon-ink sm:text-3xl">
                {T.title}
              </h2>
              <p className="mt-1.5 text-sm text-aureon-muted">{T.subtitle}</p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-5 flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
              >
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            {status === 'success' && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-5 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
              >
                <ShieldCheck className="h-4 w-4 flex-shrink-0" />
                {T.success}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-aureon-muted">
                  {T.name}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={T.namePh}
                  className="w-full rounded-xl border border-aureon-purple/15 bg-white px-4 py-3 text-sm text-aureon-ink placeholder:text-aureon-muted/60 transition-all focus:border-aureon-purple focus:outline-none focus:ring-4 focus:ring-aureon-purple/15"
                  disabled={isLoading}
                  autoComplete="name"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-aureon-muted">
                  {T.email}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={T.emailPh}
                  className="w-full rounded-xl border border-aureon-purple/15 bg-white px-4 py-3 text-sm text-aureon-ink placeholder:text-aureon-muted/60 transition-all focus:border-aureon-purple focus:outline-none focus:ring-4 focus:ring-aureon-purple/15"
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-aureon-muted">
                  {T.password}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={T.passwordPh}
                    className="w-full rounded-xl border border-aureon-purple/15 bg-white py-3 pl-4 pr-11 text-sm text-aureon-ink placeholder:text-aureon-muted/60 transition-all focus:border-aureon-purple focus:outline-none focus:ring-4 focus:ring-aureon-purple/15"
                    disabled={isLoading}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label="Toggle password visibility"
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-aureon-muted transition-colors hover:text-aureon-purple"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <motion.button
                type="submit"
                disabled={isLoading}
                whileHover={{ scale: isLoading ? 1 : 1.02 }}
                whileTap={{ scale: isLoading ? 1 : 0.98 }}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-aureon-purple py-3.5 text-sm font-semibold text-white shadow-xl shadow-aureon-purple/30 transition-colors hover:bg-aureon-deep disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isLoading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    <span>{T.submitting}</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    <span>{T.submit}</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </motion.button>
            </form>

            <p className="mt-6 text-center text-sm text-aureon-muted">
              {T.haveAccount}{' '}
              <Link
                href="/login"
                className="font-semibold text-aureon-purple transition-colors hover:text-aureon-deep"
              >
                {T.signin}
              </Link>
            </p>

            <div className="mt-6 border-t border-aureon-purple/10 pt-5 text-center">
              <div className="inline-flex items-center gap-1.5 text-xs font-medium text-aureon-muted">
                <Lock className="h-3 w-3 text-aureon-purple" />
                {T.secure}
              </div>
            </div>
          </div>
        </motion.div>
      </section>
    </main>
  )
}
