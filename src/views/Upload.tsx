'use client'
import { useCallback, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload as UploadIcon, ImagePlus, Loader2, ScanLine, ArrowLeft, Check } from 'lucide-react'
import { useLanguage } from '@/components/LanguageProvider'
import { addTransaction } from '@/lib/data'
import { EXPENSE_CATEGORIES } from '@/types'
import { getToken } from '@/lib/clientAuth'

const MAX_BYTES = 5 * 1024 * 1024
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp']

interface ParsedResponse {
  receiptUrl: string
  parsed: {
    vendor: string | null
    date: string | null
    totalAmount: number | null
    currency: string | null
    suggestedCategory: string | null
    mappedCategory: string
    items: Array<{ name: string; price: number | null; qty: number | null }>
    confidence: 'high' | 'medium' | 'low'
  }
}

type Stage = 'idle' | 'scanning' | 'review' | 'saving'

function todayIso(): string {
  return new Date().toISOString().split('T')[0]
}

export default function Upload() {
  const { t, tc } = useLanguage()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [stage, setStage] = useState<Stage>('idle')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [errorKey, setErrorKey] = useState<string | null>(null)
  const [errorDetail, setErrorDetail] = useState<string | null>(null)
  const [parsed, setParsed] = useState<ParsedResponse | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  // Editable form fields (pre-filled from AI)
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [date, setDate] = useState(todayIso())
  const [description, setDescription] = useState('')

  const reset = useCallback(() => {
    setStage('idle')
    setPreviewUrl(null)
    setParsed(null)
    setErrorKey(null)
    setErrorDetail(null)
    setTitle(''); setAmount(''); setCategory(''); setDate(todayIso()); setDescription('')
  }, [])

  const handleFile = useCallback(async (file: File) => {
    setErrorKey(null); setErrorDetail(null)
    if (!ACCEPTED.includes(file.type)) { setErrorKey('upload.errType'); return }
    if (file.size > MAX_BYTES) { setErrorKey('upload.errTooBig'); return }

    setPreviewUrl(URL.createObjectURL(file))
    setStage('scanning')

    const formData = new FormData()
    formData.append('file', file)

    const token = getToken()
    const headers: Record<string, string> = {}
    if (token) headers.Authorization = `Bearer ${token}`

    let res: Response
    try {
      res = await fetch('/api/upload-receipt', { method: 'POST', headers, body: formData })
    } catch (e) {
      setErrorKey('upload.errGeneric')
      setErrorDetail(e instanceof Error ? e.message : String(e))
      setStage('idle')
      return
    }

    if (res.status === 429) { setErrorKey('upload.errRate');   setStage('idle'); return }
    if (res.status === 413) { setErrorKey('upload.errTooBig'); setStage('idle'); return }
    if (res.status === 415) { setErrorKey('upload.errType');   setStage('idle'); return }
    if (res.status === 503) { setErrorKey('upload.errNoKey');  setStage('idle'); return }

    let data: (ParsedResponse & { error?: string; message?: string }) | null = null
    try { data = await res.json() } catch { /* fall through */ }

    if (!res.ok || !data || !('parsed' in data)) {
      setErrorKey('upload.errGeneric')
      const detail = data?.message || data?.error || `HTTP ${res.status}`
      setErrorDetail(detail)
      console.error('[upload] server error', res.status, data)
      setStage('idle')
      return
    }

    setParsed(data)
    setTitle(data.parsed.vendor ?? '')
    setAmount(data.parsed.totalAmount != null ? String(data.parsed.totalAmount) : '')
    setCategory(data.parsed.mappedCategory || '')
    // Default to today so the new transaction sorts to the top of the list.
    // The receipt's printed date is kept in `parsed` and offered as a one-click
    // override below the date input.
    setDate(todayIso())
    setDescription(
      data.parsed.items.length > 0
        ? data.parsed.items.slice(0, 5).map((i) => i.name).join(', ')
        : '',
    )
    setStage('review')
  }, [])

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) void handleFile(file)
  }, [handleFile])

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) void handleFile(file)
    e.target.value = ''
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!title || !amount || !category || !date) return
    setStage('saving')
    addTransaction({
      title,
      amount: Number(amount),
      category,
      date,
      type: 'expense',
      description: description || undefined,
    })
    router.push('/transactions')
  }

  const confidenceLabel: Record<'high'|'medium'|'low', string> = {
    high: t('upload.confHigh'),
    medium: t('upload.confMed'),
    low: t('upload.confLow'),
  }
  const confidenceTone: Record<'high'|'medium'|'low', string> = {
    high: 'bg-emerald-100 text-emerald-700',
    medium: 'bg-amber-100 text-amber-700',
    low: 'bg-rose-100 text-rose-700',
  }

  return (
    <div className="p-4 lg:p-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-mood-ink lg:text-3xl">
              {t('upload.title')}
            </h1>
            <p className="mt-0.5 text-sm text-mood-muted">{t('upload.subtitle')}</p>
          </div>
          {stage !== 'idle' && (
            <button
              onClick={reset}
              className="inline-flex items-center gap-1.5 rounded-full border border-mood-primary/15 bg-white px-3 py-2 text-xs font-semibold text-mood-ink/80 transition-colors hover:border-mood-primary/40 hover:text-mood-primary"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {t('upload.tryAgain')}
            </button>
          )}
        </header>

        <AnimatePresence mode="wait">
          {stage === 'idle' && (
            <motion.div
              key="dropzone"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-4"
            >
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={onDrop}
                className={`relative min-h-[34rem] overflow-hidden rounded-3xl border-2 border-dashed p-4 transition-colors ${
                  isDragging
                    ? 'border-mood-primary bg-mood-primary/5'
                    : 'border-mood-primary/25 bg-mood-card hover:border-mood-primary/50 hover:bg-mood-cream/50'
                }`}
              >
                <label className="absolute inset-0 flex cursor-pointer items-center justify-center px-8 pb-24 pt-12 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-mood-primary/10 text-mood-primary">
                      <ImagePlus className="h-8 w-8" />
                    </div>
                    <div>
                      <p className="font-display text-base font-bold text-mood-ink">{t('upload.dropHere')}</p>
                      <p className="mt-1 text-sm text-mood-muted">{t('upload.orClick')}</p>
                    </div>
                    <p className="text-xs text-mood-muted/80">{t('upload.fileHint')}</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={ACCEPTED.join(',')}
                      onChange={onPick}
                      className="hidden"
                    />
                    <span className="mt-2 inline-flex items-center gap-2 rounded-full bg-mood-primary px-4 py-2 text-sm font-semibold text-white shadow-md shadow-mood-primary/25">
                      <UploadIcon className="h-4 w-4" />
                      {t('upload.choose')}
                    </span>
                  </div>
                </label>

                <div className="absolute bottom-4 left-2">
                  <div className="relative h-[26rem] w-[22rem] overflow-hidden rounded-2xl bg-transparent shadow-none sm:h-[32rem] sm:w-[28rem]">
                    <Image
                      src="/23.png"
                      alt="Upload illustration"
                      fill
                      sizes="448px"
                      className="object-contain object-left-bottom p-2"
                      priority
                    />
                  </div>
                </div>
              </div>

              {errorKey && (
                <div className="space-y-1 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  <p className="font-semibold">{t(errorKey as any)}</p>
                  {errorDetail && (
                    <p className="break-all font-mono text-xs text-rose-600/80">{errorDetail}</p>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {stage === 'scanning' && (
            <motion.div
              key="scanning"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid gap-6 rounded-3xl border border-mood-primary/10 bg-mood-card p-6 sm:grid-cols-[1fr_1.2fr]"
            >
              {previewUrl && (
                <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-mood-cream">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={previewUrl} alt="" className="h-full w-full object-cover" />
                  <motion.div
                    aria-hidden
                    initial={{ y: '0%' }}
                    animate={{ y: ['0%', '100%', '0%'] }}
                    transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-transparent via-mood-primary/30 to-transparent"
                  />
                </div>
              )}
              <div className="flex flex-col items-start justify-center gap-3">
                <div className="inline-flex items-center gap-2 rounded-full bg-mood-primary/10 px-3 py-1.5 text-xs font-semibold text-mood-primary">
                  <ScanLine className="h-3.5 w-3.5" />
                  AI
                </div>
                <h2 className="font-display text-xl font-bold text-mood-ink">{t('upload.scanning')}</h2>
                <p className="text-sm text-mood-muted">{t('upload.subtitle')}</p>
                <Loader2 className="h-6 w-6 animate-spin text-mood-primary" />
              </div>
            </motion.div>
          )}

          {stage === 'review' && parsed && (
            <motion.form
              key="review"
              onSubmit={handleSave}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="grid gap-6 rounded-3xl border border-mood-primary/10 bg-mood-card p-6 sm:grid-cols-[1fr_1.4fr]"
            >
              <div className="space-y-3">
                <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-mood-cream">
                  <Image
                    src={parsed.receiptUrl}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 100vw, 320px"
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold uppercase tracking-wider text-mood-muted">
                    {t('upload.confidence')}
                  </span>
                  <span className={`rounded-full px-2.5 py-1 font-semibold ${confidenceTone[parsed.parsed.confidence]}`}>
                    {confidenceLabel[parsed.parsed.confidence]}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h2 className="font-display text-lg font-bold text-mood-ink">{t('upload.confirmTitle')}</h2>
                  <p className="mt-0.5 text-xs text-mood-muted">{t('upload.confirmHint')}</p>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-mood-muted">
                    {t('upload.vendor')}
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={t('txModal.titlePlaceholder')}
                    className="w-full rounded-xl border border-mood-primary/15 bg-white px-4 py-3 text-sm text-mood-ink placeholder:text-mood-muted/60 transition-all focus:border-mood-primary focus:outline-none focus:ring-4 focus:ring-mood-primary/15"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-mood-muted">
                    {t('common.amount')}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0"
                      className="w-full rounded-xl border border-mood-primary/15 bg-white px-4 py-3 pr-10 text-lg font-semibold text-mood-ink placeholder:text-mood-muted/50 transition-all focus:border-mood-primary focus:outline-none focus:ring-4 focus:ring-mood-primary/15"
                      required
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-mood-muted">₮</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-mood-muted">
                      {t('common.category')}
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full rounded-xl border border-mood-primary/15 bg-white px-4 py-3 text-sm text-mood-ink transition-all focus:border-mood-primary focus:outline-none focus:ring-4 focus:ring-mood-primary/15"
                      required
                    >
                      <option value="">{t('common.choose')}</option>
                      {EXPENSE_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{tc(cat)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-mood-muted">
                      {t('common.date')}
                    </label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full rounded-xl border border-mood-primary/15 bg-white px-4 py-3 text-sm text-mood-ink transition-all focus:border-mood-primary focus:outline-none focus:ring-4 focus:ring-mood-primary/15"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-mood-muted">
                    {t('txModal.descLabel')}
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t('txModal.descPlaceholder')}
                    rows={3}
                    className="w-full resize-none rounded-xl border border-mood-primary/15 bg-white px-4 py-3 text-sm text-mood-ink placeholder:text-mood-muted/60 transition-all focus:border-mood-primary focus:outline-none focus:ring-4 focus:ring-mood-primary/15"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={reset}
                    className="flex-1 rounded-full border border-mood-primary/15 bg-white py-3 text-sm font-semibold text-mood-ink/80 transition-colors hover:border-mood-primary/40 hover:text-mood-primary"
                  >
                    {t('common.cancel')}
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="flex flex-1 items-center justify-center gap-2 rounded-full bg-mood-primary py-3 text-sm font-semibold text-white shadow-lg shadow-mood-primary/25 transition-colors hover:bg-mood-deep"
                  >
                    <Check className="h-4 w-4" />
                    {t('common.save')}
                  </motion.button>
                </div>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
