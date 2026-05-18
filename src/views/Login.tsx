'use client'

import { useEffect, useRef, useState, useCallback, type FormEvent } from 'react'
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
  Users,
} from 'lucide-react'
import { apiFetch, setToken, setUser, type AuthUser } from '@/lib/clientAuth'
import { seedProfileFromAuth } from '@/lib/data'
import { useLanding } from '@/lib/landingI18n'
import { useForceLightTheme } from '@/lib/useForceLightTheme'
import { Wordmark } from '@/views/landing/Navbar'
import { LanguageToggle } from '@/views/landing/LanguageToggle'

interface LoginResponse {
  token: string
  user: AuthUser
}

interface GoogleCredentialResponse {
  credential: string
}

interface GoogleAccountsId {
  initialize: (config: {
    client_id: string
    callback: (resp: GoogleCredentialResponse) => void
    auto_select?: boolean
    ux_mode?: 'popup' | 'redirect'
  }) => void
  renderButton: (
    parent: HTMLElement,
    options: {
      type?: 'standard' | 'icon'
      theme?: 'outline' | 'filled_blue' | 'filled_black'
      size?: 'large' | 'medium' | 'small'
      text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin'
      shape?: 'rectangular' | 'pill' | 'circle' | 'square'
      width?: number | string
      logo_alignment?: 'left' | 'center'
    },
  ) => void
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleAccountsId } }
  }
}

const GOOGLE_GSI_SRC = 'https://accounts.google.com/gsi/client'

const LOGIN_MASCOT_SRC = '/21.png'

export default function LoginPage() {
  useForceLightTheme()
  const router = useRouter()
  const { lang, L } = useLanding()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoginButtonHovered, setIsLoginButtonHovered] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [status, setStatus] = useState<'idle' | 'scanning' | 'success'>('idle')

  const T = {
    title:        lang === 'mn' ? 'Тавтай морил'                           : 'Welcome back',
    subtitle:     lang === 'mn' ? 'Бүртгэлээрээ нэвтэрч Моко-той уулзаарай.' : "Sign in and say hi to Moko.",
    email:        lang === 'mn' ? 'И-мэйл'                                 : 'Email',
    emailPh:      'email@example.com',
    password:     lang === 'mn' ? 'Нууц үг'                                : 'Password',
    forgot:       lang === 'mn' ? 'Нууц үгээ мартсан уу?'                  : 'Forgot password?',
    forgotMsg:    lang === 'mn' ? 'Нууц үг сэргээх боломж одоохондоо байхгүй байна' : 'Password reset is not available yet',
    submit:       lang === 'mn' ? 'Нэвтрэх'                                : 'Sign in',
    submitting:   lang === 'mn' ? 'Шалгаж байна...'                        : 'Checking...',
    success:      lang === 'mn' ? 'Амжилттай нэвтэрлээ'                    : 'Signed in',
    successRedir: lang === 'mn' ? 'Шилжиж байна...'                        : 'Redirecting...',
    noAccount:    lang === 'mn' ? 'Бүртгэлгүй юу?'                         : "Don't have an account?",
    register:     lang === 'mn' ? 'Бүртгүүлэх'                             : 'Sign up',
    fillAll:      lang === 'mn' ? 'Бүх талбарыг бөглөнө үү'                : 'Please fill in all fields',
    failure:      lang === 'mn' ? 'Нэвтрэхэд алдаа гарлаа'                 : 'Sign-in failed',
    pitch:        lang === 'mn'
      ? 'Анхны царсан модноосоо том ой ургуулъя.'
      : 'From your first acorn to a full forest of savings.',
    secure:       lang === 'mn' ? 'AES-256 шифрлэлтээр хамгаалагдсан'     : 'Protected with AES-256 encryption',
    legal:        lang === 'mn'
      ? 'Нэвтэрснээр үйлчилгээний нөхцөл болон нууцлалын бодлогыг зөвшөөрнө.'
      : 'By signing in you agree to the Terms of Service and Privacy Policy.',
    or:           lang === 'mn' ? 'ЭСВЭЛ'                               : 'OR',
    googleMissing: lang === 'mn'
      ? 'Google нэвтрэлт идэвхгүй байна. GOOGLE_CLIENT_ID-г серверийн .env.local-д нэмнэ үү.'
      : 'Google sign-in is not configured. Add GOOGLE_CLIENT_ID to the server .env.local.',
  }

  const [googleConfig, setGoogleConfig] = useState<{ loading: boolean; clientId: string | null }>({
    loading: true,
    clientId: null,
  })
  const googleClientId = googleConfig.clientId
  const googleBtnRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/auth/google/config')
      .then((r) => (r.ok ? r.json() : { clientId: null }))
      .then((data: { clientId: string | null }) => {
        if (!cancelled) setGoogleConfig({ loading: false, clientId: data.clientId })
      })
      .catch(() => {
        if (!cancelled) setGoogleConfig({ loading: false, clientId: null })
      })
    return () => {
      cancelled = true
    }
  }, [])

  const completeLogin = useCallback(
    async (token: string, user: AuthUser) => {
      setToken(token)
      setUser(user)
      seedProfileFromAuth(user)

      // Restore per-user UI flags from the server profile so the sidebar
      // (which gates the Family menu on walletHubAccountType==='gerbul')
      // and the setup-derived age/gender survive a logout/login cycle.
      const statusToAccount: Record<string, string> = {
        individual: 'engiin', couple: 'khos', student: 'oyutan', family: 'gerbul',
      }
      const u = user as AuthUser & { relationshipStatus?: string | null; age?: number | null; gender?: string | null }
      if (u.relationshipStatus && statusToAccount[u.relationshipStatus]) {
        window.localStorage.setItem('walletHubAccountType', statusToAccount[u.relationshipStatus])
      }
      if (u.age != null) window.localStorage.setItem('walletHubAge', String(u.age))
      if (u.gender) window.localStorage.setItem('walletHubGender', u.gender)
      if (u.subscriptionStatus === 'active') {
        window.localStorage.setItem('walletHubSubscription', u.relationshipStatus === 'couple' ? 'pro' : 'premium')
      }

      // Pre-populate family-membership flag so the sidebar shows the
      // Family menu on the very first dashboard render after login —
      // important for invited members whose own accountType isn't 'gerbul'.
      try {
        const fam = await apiFetch<{ family: { id: string } | null }>('/api/family')
        window.localStorage.setItem('walletHubInFamily', fam.family ? 'true' : 'false')
      } catch {
        // Sidebar's own fallback fetch will catch up later.
      }

      setStatus('success')
      setTimeout(() => {
        router.push(user.setupCompleted ? '/dashboard' : '/setup')
      }, 600)
    },
    [router],
  )

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    if (!identifier || !password) {
      setError(T.fillAll)
      return
    }

    setIsLoading(true)
    setStatus('scanning')

    try {
      const stale = ['walletHubAccountType', 'walletHubSubscription', 'walletHubAge', 'walletHubGender']
      stale.forEach((k) => window.localStorage.removeItem(k))

      const { token, user } = await apiFetch<LoginResponse>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: identifier, password }),
      })

      await completeLogin(token, user)
    } catch (err) {
      setError(err instanceof Error ? err.message : T.failure)
      setStatus('idle')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleCredential = useCallback(
    async (resp: GoogleCredentialResponse) => {
      setError('')
      setIsLoading(true)
      setStatus('scanning')
      try {
        const stale = ['walletHubAccountType', 'walletHubSubscription', 'walletHubAge', 'walletHubGender']
        stale.forEach((k) => window.localStorage.removeItem(k))

        const { token, user } = await apiFetch<LoginResponse>('/api/auth/google', {
          method: 'POST',
          body: JSON.stringify({ credential: resp.credential }),
        })
        await completeLogin(token, user)
      } catch (err) {
        setError(err instanceof Error ? err.message : T.failure)
        setStatus('idle')
      } finally {
        setIsLoading(false)
      }
    },
    [completeLogin, T.failure],
  )

  useEffect(() => {
    if (!googleClientId || !googleBtnRef.current) return

    const renderButton = () => {
      if (!window.google || !googleBtnRef.current) return
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleCredential,
        ux_mode: 'popup',
      })
      googleBtnRef.current.innerHTML = ''
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'pill',
        logo_alignment: 'center',
        width: googleBtnRef.current.offsetWidth || 320,
      })
    }

    if (window.google?.accounts?.id) {
      renderButton()
      return
    }

    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GOOGLE_GSI_SRC}"]`)
    if (existing) {
      existing.addEventListener('load', renderButton, { once: true })
      return () => existing.removeEventListener('load', renderButton)
    }

    const s = document.createElement('script')
    s.src = GOOGLE_GSI_SRC
    s.async = true
    s.defer = true
    s.onload = renderButton
    document.head.appendChild(s)
  }, [googleClientId, handleGoogleCredential])

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

      <section className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 items-center gap-8 px-4 pb-12 pt-2 sm:gap-10 sm:px-5 sm:pb-16 sm:pt-4 lg:grid-cols-12 lg:gap-12 lg:px-10 lg:pt-6">
        <motion.aside
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="hidden lg:col-span-6 lg:flex lg:flex-col lg:gap-8"
        >
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-aureon-purple/15 bg-white/70 px-3 py-1 text-xs font-semibold text-aureon-purple backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-aureon-purple" />
            {L.hero.tagline}
          </span>

          <h1 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-aureon-ink xl:text-5xl">
            {T.pitch}
          </h1>

          <div className="relative mx-auto aspect-square w-full max-w-[420px]">
            <div
              className="absolute inset-0 -z-10 rounded-full"
              style={{
                background:
                  'radial-gradient(closest-side, rgba(109,40,217,0.22), rgba(109,40,217,0.05) 60%, transparent 75%)',
              }}
            />
            <motion.img
              src={LOGIN_MASCOT_SRC}
              alt="Moko"
              draggable={false}
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="h-full w-full object-contain drop-shadow-[0_24px_36px_rgba(76,29,149,0.22)]"
            />
          </div>

          <div className="flex items-center gap-6 text-sm text-aureon-muted">
            <span className="inline-flex items-center gap-1.5">
              <Users className="h-4 w-4 text-aureon-purple" />
              {L.hero.trustUsers}
            </span>
            <span className="h-1 w-1 rounded-full bg-aureon-muted/40" />
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-aureon-purple" />
              {L.hero.trustSecurity}
            </span>
          </div>
        </motion.aside>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.05 }}
          className="lg:col-span-6"
        >
          <div className="mx-auto w-full max-w-md rounded-2xl border border-aureon-purple/10 bg-aureon-ivory p-5 shadow-[0_24px_60px_-24px_rgba(76,29,149,0.30)] sm:rounded-3xl sm:p-7 lg:p-9">
            <div className="mb-5 sm:mb-7">
              <h2 className="font-display text-xl font-bold tracking-tight text-aureon-ink sm:text-2xl lg:text-3xl">
                {T.title}
              </h2>
              <p className="mt-1 text-xs text-aureon-muted sm:mt-1.5 sm:text-sm">{T.subtitle}</p>
            </div>

            {error && (
              <div className="mb-5 flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {status === 'success' && (
              <div className="mb-5 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                <ShieldCheck className="h-4 w-4 flex-shrink-0" />
                {T.success}. {T.successRedir}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-aureon-muted">
                  {T.email}
                </label>
                <input
                  type="email"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={T.emailPh}
                  className="w-full rounded-xl border border-aureon-purple/15 bg-white px-4 py-3 text-sm text-aureon-ink placeholder:text-aureon-muted/60 transition-all focus:border-aureon-purple focus:outline-none focus:ring-4 focus:ring-aureon-purple/15"
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-aureon-muted">
                    {T.password}
                  </label>
                  <button
                    type="button"
                    className="text-xs font-semibold text-aureon-purple transition-colors hover:text-aureon-deep"
                    onClick={() => setError(T.forgotMsg)}
                  >
                    {T.forgot}
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full rounded-xl border border-aureon-purple/15 bg-white py-3 pl-4 pr-11 text-sm text-aureon-ink placeholder:text-aureon-muted/60 transition-all focus:border-aureon-purple focus:outline-none focus:ring-4 focus:ring-aureon-purple/15"
                    disabled={isLoading}
                    autoComplete="current-password"
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

            <div className="relative">
              <motion.button
                type="submit"
                disabled={isLoading}
                whileHover={{ scale: isLoading ? 1 : 1.02 }}
                whileTap={{ scale: isLoading ? 1 : 0.98 }}
                onHoverStart={() => setIsLoginButtonHovered(true)}
                onHoverEnd={() => setIsLoginButtonHovered(false)}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-aureon-purple py-3.5 pl-8 pr-20 text-sm font-semibold text-white shadow-xl shadow-aureon-purple/30 transition-colors hover:bg-aureon-deep disabled:cursor-not-allowed disabled:opacity-70 sm:pr-24"
              >
                {isLoading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />
                    <span>{T.submitting}</span>
                  </>
                ) : status === 'success' ? (
                  <>
                    <ShieldCheck className="h-4 w-4" />
                    <span>{T.success}</span>
                  </>
                ) : (
                  <>
                    <span>{T.submit}</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </motion.button>

              <span
                aria-hidden
                className="pointer-events-none absolute right-1 top-1/2 h-10 w-14 -translate-y-1/2 overflow-hidden sm:right-2 sm:h-12 sm:w-16"
              >
                <motion.img
                  src={
                    isLoading
                      ? '/20.png'
                      : isLoginButtonHovered
                        ? '/19.png'
                        : '/18.png'
                  }
                  alt=""
                  initial={false}
                  animate={isLoading ? { y: [0, -3, 0], rotate: [0, 3, 0] } : { y: 0, rotate: 0 }}
                  transition={
                    isLoading
                      ? { duration: 1.2, repeat: Infinity, ease: 'easeInOut' }
                      : { duration: 0.18, ease: 'easeOut' }
                  }
                  className="h-full w-full object-contain object-right"
                />
              </span>
            </div>
            </form>

            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-aureon-purple/15" />
              <span className="text-[11px] font-semibold tracking-widest text-aureon-muted/80">
                {T.or}
              </span>
              <div className="h-px flex-1 bg-aureon-purple/15" />
            </div>

            {googleConfig.loading ? (
              <div className="h-10" aria-hidden />
            ) : googleClientId ? (
              <div ref={googleBtnRef} className="flex justify-center [&>div]:!w-full" />
            ) : (
              <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-center text-[11px] leading-relaxed text-amber-700">
                {T.googleMissing}
              </p>
            )}

            <p className="mt-6 text-center text-sm text-aureon-muted">
              {T.noAccount}{' '}
              <Link
                href="/register"
                className="font-semibold text-aureon-purple transition-colors hover:text-aureon-deep"
              >
                {T.register}
              </Link>
            </p>

            <div className="mt-6 border-t border-aureon-purple/10 pt-5 text-center">
              <div className="mb-1.5 inline-flex items-center gap-1.5 text-xs font-medium text-aureon-muted">
                <Lock className="h-3 w-3 text-aureon-purple" />
                {T.secure}
              </div>
              <p className="text-[11px] leading-relaxed text-aureon-muted/80">{T.legal}</p>
            </div>
          </div>
        </motion.div>
      </section>
    </main>
  )
}
