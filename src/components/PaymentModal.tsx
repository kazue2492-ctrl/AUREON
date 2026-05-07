'use client'
import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Lock, ShieldCheck, Loader2, AlertTriangle, CheckCircle2, CreditCard } from 'lucide-react'
import { apiFetch } from '@/lib/clientAuth'
import { useLanguage } from './LanguageProvider'

export type PaymentPlan = 'khos' | 'gerbul'

interface PaymentModalProps {
  isOpen: boolean
  plan: PaymentPlan
  planName: string
  priceLabel: string  // e.g. "₮9,900/сар"
  onClose: () => void
  onSuccess: () => void
}

type CardBrand = 'visa' | 'mastercard' | 'amex' | 'discover' | 'unknown'

// ── Luhn algorithm: even a "real" payment processor verifies this client-side
// before round-tripping to the server. Required for any genuine card flow.
function luhnValid(num: string): boolean {
  const digits = num.replace(/\D/g, '')
  if (digits.length < 12) return false
  let sum = 0
  let alt = false
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits[i], 10)
    if (alt) { n *= 2; if (n > 9) n -= 9 }
    sum += n
    alt = !alt
  }
  return sum % 10 === 0
}

function detectBrand(num: string): CardBrand {
  const n = num.replace(/\D/g, '')
  if (/^4/.test(n)) return 'visa'
  if (/^(5[1-5]|2[2-7])/.test(n)) return 'mastercard'
  if (/^3[47]/.test(n)) return 'amex'
  if (/^(6011|65|64[4-9])/.test(n)) return 'discover'
  return 'unknown'
}

function formatCardNumber(raw: string): string {
  const n = raw.replace(/\D/g, '').slice(0, 19)
  // Amex grouping: 4-6-5
  if (/^3[47]/.test(n)) return n.replace(/(\d{4})(\d{0,6})(\d{0,5})/, (_, a, b, c) =>
    [a, b, c].filter(Boolean).join(' ')
  )
  // Visa/MC/Discover: 4-4-4-4
  return n.replace(/(\d{4})(?=\d)/g, '$1 ').trim()
}

function formatExpiry(raw: string): string {
  const n = raw.replace(/\D/g, '').slice(0, 4)
  if (n.length < 3) return n
  return `${n.slice(0, 2)}/${n.slice(2)}`
}

const BRAND_LABEL: Record<CardBrand, string> = {
  visa: 'VISA',
  mastercard: 'Mastercard',
  amex: 'Amex',
  discover: 'Discover',
  unknown: 'CARD',
}

export default function PaymentModal({
  isOpen,
  plan,
  planName,
  priceLabel,
  onClose,
  onSuccess,
}: PaymentModalProps) {
  const { lang } = useLanguage()
  const [holder, setHolder] = useState('')
  const [number, setNumber] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvc, setCvc] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const T = {
    title:        lang === 'mn' ? 'Төлбөрийн мэдээлэл'                   : 'Payment details',
    subtitle:     lang === 'mn' ? 'Аюулгүй төлбөрийн систем'             : 'Secure payment',
    holder:       lang === 'mn' ? 'Картны эзэмшигч'                       : 'Cardholder',
    holderPh:     lang === 'mn' ? 'БАТ-ЭРДЭНЭ Б.'                        : 'JANE DOE',
    number:       lang === 'mn' ? 'Картны дугаар'                         : 'Card number',
    expiry:       lang === 'mn' ? 'Дуусах огноо'                          : 'Expiry',
    cvc:          'CVC',
    pay:          lang === 'mn' ? `${priceLabel} төлөх`                   : `Pay ${priceLabel}`,
    paying:       lang === 'mn' ? 'Төлбөр хийгдэж байна...'              : 'Processing payment...',
    paid:         lang === 'mn' ? 'Төлбөр амжилттай'                      : 'Payment successful',
    cancel:       lang === 'mn' ? 'Цуцлах'                                : 'Cancel',
    securityNote: lang === 'mn' ? '256-bit шифрлэлт. Картын мэдээлэл сервер дээр хадгалагдахгүй.'
                                : 'Encrypted with 256-bit TLS. Card details are not stored.',
    invalidCard:  lang === 'mn' ? 'Картны дугаар буруу байна'             : 'Invalid card number',
    invalidExp:   lang === 'mn' ? 'Дуусах огноо буруу эсвэл хугацаа дууссан' : 'Invalid or expired date',
    invalidCvc:   lang === 'mn' ? 'CVC буруу байна'                       : 'Invalid CVC',
    needHolder:   lang === 'mn' ? 'Эзэмшигчийн нэр шаардлагатай'          : 'Cardholder name is required',
    apiFailed:    lang === 'mn' ? 'Төлбөр хийгдсэнгүй. Дахин оролдоно уу.' : 'Payment failed. Please try again.',
    testHint:     lang === 'mn' ? 'Туршилт: 4242 4242 4242 4242 / 12/30 / 123'
                                : 'Test card: 4242 4242 4242 4242 / 12/30 / 123',
  }

  const brand = useMemo(() => detectBrand(number), [number])
  const planAccent = plan === 'khos' ? '#EC4899' : '#F59E0B'

  useEffect(() => {
    if (!isOpen) {
      setHolder(''); setNumber(''); setExpiry(''); setCvc('')
      setSubmitting(false); setSuccess(false); setError('')
    }
  }, [isOpen])

  function validate(): string | null {
    if (!holder.trim())   return T.needHolder
    if (!luhnValid(number)) return T.invalidCard
    const m = expiry.match(/^(\d{2})\/(\d{2})$/)
    if (!m) return T.invalidExp
    const month = parseInt(m[1], 10)
    const year = 2000 + parseInt(m[2], 10)
    if (month < 1 || month > 12) return T.invalidExp
    const eom = new Date(year, month, 0)  // last day of expiry month
    if (eom.getTime() < Date.now())       return T.invalidExp
    const cvcLen = brand === 'amex' ? 4 : 3
    if (!new RegExp(`^\\d{${cvcLen}}$`).test(cvc)) return T.invalidCvc
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const v = validate()
    if (v) { setError(v); return }

    setSubmitting(true)
    try {
      // The server pretends to be a payment processor here.
      // Swap this endpoint for a real Stripe/QPay/etc. flow without changing the UI.
      await apiFetch<{ ok: true }>('/api/subscription/checkout', {
        method: 'POST',
        body: JSON.stringify({
          plan,
          last4: number.replace(/\D/g, '').slice(-4),
          brand,
          holder: holder.trim(),
        }),
      })
      setSuccess(true)
      setTimeout(() => { onSuccess(); onClose() }, 900)
    } catch (err) {
      setError(err instanceof Error ? err.message : T.apiFailed)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[120] flex items-center justify-center p-4"
        >
          <div
            className="absolute inset-0 bg-aureon-ink/45 backdrop-blur-sm"
            onClick={!submitting && !success ? onClose : undefined}
          />
          <motion.div
            initial={{ scale: 0.94, y: 16, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl bg-aureon-ivory shadow-2xl shadow-aureon-purple/25 ring-1 ring-aureon-purple/10"
          >
            {/* Header */}
            <div className="relative bg-gradient-to-br from-aureon-purple to-aureon-deep px-6 pb-12 pt-6 text-white">
              <button
                onClick={onClose}
                disabled={submitting || success}
                aria-label="Close"
                className="absolute right-3 top-3 rounded-full p-1.5 text-white/80 transition-colors hover:bg-white/15 hover:text-white disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                <span className="text-[11px] font-semibold uppercase tracking-wider">{T.subtitle}</span>
              </div>
              <h3 className="mt-2 font-display text-xl font-bold">{T.title}</h3>
              <div className="mt-1 flex items-center gap-2 text-xs text-white/85">
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold text-white"
                  style={{ background: planAccent }}
                >
                  {planName}
                </span>
                <span>•</span>
                <span className="font-semibold">{priceLabel}</span>
              </div>
            </div>

            {/* Card preview — overlaps the header */}
            <div className="-mt-8 px-6">
              <div
                className="relative h-44 overflow-hidden rounded-2xl p-5 text-white shadow-xl"
                style={{
                  background: brand === 'visa'
                    ? 'linear-gradient(135deg, #1a1f71 0%, #0f1559 100%)'
                    : brand === 'mastercard'
                    ? 'linear-gradient(135deg, #eb001b 0%, #f79e1b 100%)'
                    : brand === 'amex'
                    ? 'linear-gradient(135deg, #2e77bb 0%, #006fcf 100%)'
                    : brand === 'discover'
                    ? 'linear-gradient(135deg, #ff6000 0%, #d04a00 100%)'
                    : 'linear-gradient(135deg, #4C1D95 0%, #1A1535 100%)',
                }}
              >
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 opacity-30"
                  style={{
                    background: 'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.35), transparent 50%)',
                  }}
                />
                <div className="relative flex items-start justify-between">
                  <div className="h-7 w-10 rounded-md bg-yellow-300/90 shadow-inner" />
                  <span className="font-display text-base font-extrabold tracking-wide">
                    {BRAND_LABEL[brand]}
                  </span>
                </div>
                <div className="relative mt-6 font-mono text-lg tracking-[0.18em] tabular-nums">
                  {(formatCardNumber(number) || '•••• •••• •••• ••••').padEnd(19, ' ')}
                </div>
                <div className="relative mt-3 flex items-end justify-between text-[11px] uppercase tracking-wider">
                  <div>
                    <p className="text-white/60">Holder</p>
                    <p className="font-semibold tracking-wide">
                      {holder.toUpperCase() || (lang === 'mn' ? 'НЭР · ОВОГ' : 'YOUR NAME')}
                    </p>
                  </div>
                  <div>
                    <p className="text-white/60">Expires</p>
                    <p className="font-semibold tabular-nums">{expiry || 'MM/YY'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4 px-6 pb-6 pt-5">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700"
                >
                  <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}

              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700"
                >
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                  <span>{T.paid}</span>
                </motion.div>
              )}

              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-aureon-muted">
                  {T.holder}
                </label>
                <input
                  type="text"
                  value={holder}
                  onChange={(e) => setHolder(e.target.value)}
                  placeholder={T.holderPh}
                  disabled={submitting || success}
                  autoComplete="cc-name"
                  className="w-full rounded-xl border border-aureon-purple/15 bg-white px-3.5 py-2.5 text-sm text-aureon-ink placeholder:text-aureon-muted/60 transition-all focus:border-aureon-purple focus:outline-none focus:ring-4 focus:ring-aureon-purple/15"
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-aureon-muted">
                  {T.number}
                </label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-aureon-muted" />
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formatCardNumber(number)}
                    onChange={(e) => setNumber(e.target.value.replace(/\D/g, '').slice(0, 19))}
                    placeholder="1234 5678 9012 3456"
                    disabled={submitting || success}
                    autoComplete="cc-number"
                    className="w-full rounded-xl border border-aureon-purple/15 bg-white py-2.5 pl-10 pr-3 font-mono text-sm tabular-nums text-aureon-ink placeholder:text-aureon-muted/60 transition-all focus:border-aureon-purple focus:outline-none focus:ring-4 focus:ring-aureon-purple/15"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-aureon-muted">
                    {T.expiry}
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={expiry}
                    onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                    placeholder="MM/YY"
                    disabled={submitting || success}
                    autoComplete="cc-exp"
                    className="w-full rounded-xl border border-aureon-purple/15 bg-white px-3.5 py-2.5 font-mono text-sm tabular-nums text-aureon-ink placeholder:text-aureon-muted/60 transition-all focus:border-aureon-purple focus:outline-none focus:ring-4 focus:ring-aureon-purple/15"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-aureon-muted">
                    {T.cvc}
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={cvc}
                    onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, brand === 'amex' ? 4 : 3))}
                    placeholder={brand === 'amex' ? '1234' : '123'}
                    disabled={submitting || success}
                    autoComplete="cc-csc"
                    className="w-full rounded-xl border border-aureon-purple/15 bg-white px-3.5 py-2.5 font-mono text-sm tabular-nums text-aureon-ink placeholder:text-aureon-muted/60 transition-all focus:border-aureon-purple focus:outline-none focus:ring-4 focus:ring-aureon-purple/15"
                  />
                </div>
              </div>

              <p className="rounded-xl bg-aureon-cream px-3 py-2 text-[11px] text-aureon-muted">
                💡 {T.testHint}
              </p>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={submitting || success}
                  className="flex-1 rounded-full border border-aureon-purple/15 bg-white py-2.5 text-sm font-semibold text-aureon-ink/80 transition-colors hover:border-aureon-purple/40 hover:text-aureon-purple disabled:opacity-50"
                >
                  {T.cancel}
                </button>
                <motion.button
                  whileHover={{ scale: submitting || success ? 1 : 1.02 }}
                  whileTap={{ scale: submitting || success ? 1 : 0.98 }}
                  type="submit"
                  disabled={submitting || success}
                  className="flex flex-1 items-center justify-center gap-2 rounded-full bg-aureon-purple py-2.5 text-sm font-semibold text-white shadow-lg shadow-aureon-purple/25 transition-colors hover:bg-aureon-deep disabled:opacity-70"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>{T.paying}</span>
                    </>
                  ) : success ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      <span>{T.paid}</span>
                    </>
                  ) : (
                    <>
                      <Lock className="h-3.5 w-3.5" />
                      <span>{T.pay}</span>
                    </>
                  )}
                </motion.button>
              </div>

              <p className="flex items-center justify-center gap-1.5 text-[10px] text-aureon-muted">
                <Lock className="h-3 w-3" />
                {T.securityNote}
              </p>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
