'use client'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import {
  Plus,
  Target,
  Calendar,
  Pencil,
  Trash2,
  Wallet,
  Check,
  X,
  Upload,
  Link as LinkIcon,
  Coins,
  RotateCcw,
} from 'lucide-react'
import {
  getGoals,
  addGoal,
  updateGoal,
  deleteGoal,
  addTransaction,
} from '@/lib/data'
import { getUser } from '@/lib/clientAuth'
import type { Goal } from '@/types'
import { useLanguage } from '@/components/LanguageProvider'
import { MASCOT_SRC } from '@/views/landing/mascot'

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
}

// Build a "YYYY-MM-DDTHH:mm" string `offset` (months) ahead of now, preserving
// the current local time. Used by the deadline quick-pick chips.
function presetToLocalDateTime(monthsAhead: number, weeksAhead = 0): string {
  const d = new Date()
  if (monthsAhead > 0) d.setMonth(d.getMonth() + monthsAhead)
  if (weeksAhead > 0)  d.setDate(d.getDate() + weeksAhead * 7)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function Goals() {
  const { t } = useLanguage()
  const [goals, setGoals] = useState<Goal[]>([])
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [currentAmount, setCurrentAmount] = useState('')
  const [deadline, setDeadline] = useState('')
  const [image, setImage] = useState('')
  const [imageMode, setImageMode] = useState<'url' | 'file'>('url')
  const [imageError, setImageError] = useState('')
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const [depositingId, setDepositingId] = useState<string | null>(null)
  const [depositAmount, setDepositAmount] = useState('')
  const [editingDailyId, setEditingDailyId] = useState<string | null>(null)
  const [dailyDraft, setDailyDraft] = useState('')
  const currentUserId = getUser()?.id ?? ''

  useEffect(() => { refreshData() }, [])

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const sync = () => refreshData()
    window.addEventListener('dataUpdated', sync)
    window.addEventListener('profileUpdated', sync)
    return () => {
      window.removeEventListener('dataUpdated', sync)
      window.removeEventListener('profileUpdated', sync)
    }
  }, [])

  function refreshData() {
    setGoals(getGoals())
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name || !targetAmount || !deadline) return

    // datetime-local gives "YYYY-MM-DDTHH:MM" but the DB column is DATE.
    // Strict MySQL rejects the time-bearing form and silently drops the row.
    const deadlineDate = deadline.slice(0, 10)

    if (editingId) {
      updateGoal(editingId, {
        name,
        targetAmount: Number(targetAmount),
        currentAmount: Number(currentAmount) || 0,
        deadline: deadlineDate,
        image: image || undefined,
      })
    } else {
      addGoal({
        name,
        targetAmount: Number(targetAmount),
        deadline: deadlineDate,
        image: image || undefined,
      })
    }

    resetForm()
    refreshData()
  }

  function resetForm() {
    setName('')
    setTargetAmount('')
    setCurrentAmount('')
    setDeadline('')
    setImage('')
    setImageMode('url')
    setImageError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
    setIsAdding(false)
    setEditingId(null)
  }

  function handleEdit(goal: Goal) {
    setName(goal.name)
    setTargetAmount(goal.targetAmount.toString())
    setCurrentAmount(goal.currentAmount.toString())
    setDeadline(goal.deadline.length === 10 ? `${goal.deadline}T00:00` : goal.deadline.slice(0, 16))
    setImage(goal.image || '')
    setImageMode(goal.image?.startsWith('data:') ? 'file' : 'url')
    setImageError('')
    setEditingId(goal.id)
    setIsAdding(true)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setImageError(t('goals.imageTooLarge'))
      e.target.value = ''
      return
    }
    setImageError('')
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') setImage(reader.result)
    }
    reader.readAsDataURL(file)
  }

  function clearImage() {
    setImage('')
    setImageError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleDelete(id: string) {
    if (confirm(t('goals.confirmDelete'))) {
      deleteGoal(id)
      refreshData()
    }
  }

  function openDeposit(id: string) {
    setDepositingId(id)
    setDepositAmount('')
  }

  function cancelDeposit() {
    setDepositingId(null)
    setDepositAmount('')
  }

  function handleDeposit(goal: Goal) {
    const amount = Number(depositAmount)
    if (!amount || amount <= 0) return
    // Mirror the goal deposit as an expense transaction so the total balance
    // (computed from transactions) decreases by the same amount.
    addTransaction({
      title: `${t('goals.savingsTitle')}: ${goal.name}`,
      amount,
      category: t('goals.savingsCategory'),
      date: new Date().toISOString().split('T')[0],
      type: 'expense',
    })
    updateGoal(goal.id, { currentAmount: goal.currentAmount + amount })
    cancelDeposit()
    refreshData()
  }

  function getDaysLeft(deadline: string) {
    const ms = new Date(deadline).getTime() - Date.now()
    if (!Number.isFinite(ms) || ms <= 0) return 0
    return Math.max(1, Math.ceil(ms / 86_400_000))
  }

  function getSuggestedDaily(goal: Goal) {
    const remaining = Math.max(0, goal.targetAmount - goal.currentAmount)
    const days = getDaysLeft(goal.deadline)
    if (!days) return remaining
    return Math.ceil(remaining / days)
  }

  function getEffectiveDaily(goal: Goal) {
    return goal.dailyAmount && goal.dailyAmount > 0 ? goal.dailyAmount : getSuggestedDaily(goal)
  }

  function openDailyEditor(goal: Goal) {
    setEditingDailyId(goal.id)
    setDailyDraft(String(getEffectiveDaily(goal)))
  }

  function cancelDailyEditor() {
    setEditingDailyId(null)
    setDailyDraft('')
  }

  function saveDaily(goal: Goal) {
    const amount = Number(dailyDraft)
    updateGoal(goal.id, { dailyAmount: amount > 0 ? amount : undefined })
    cancelDailyEditor()
    refreshData()
  }

  function resetDaily(goal: Goal) {
    updateGoal(goal.id, { dailyAmount: undefined })
    cancelDailyEditor()
    refreshData()
  }

  function saveDailyToGoal(goal: Goal) {
    const amount = getEffectiveDaily(goal)
    if (!amount || amount <= 0) return
    addTransaction({
      title: `${t('goals.savingsTitle')}: ${goal.name}`,
      amount,
      category: t('goals.savingsCategory'),
      date: new Date().toISOString().split('T')[0],
      type: 'expense',
    })
    updateGoal(goal.id, { currentAmount: goal.currentAmount + amount })
    refreshData()
  }

  function getTimeLeft(deadline: string, current: number) {
    const targetMs = new Date(deadline).getTime()
    const diff = targetMs - current
    if (!Number.isFinite(targetMs)) return { expired: true, label: t('common.invalidDate') }
    if (diff <= 0) return { expired: true, label: t('common.expired') }
    const days = Math.floor(diff / 86_400_000)
    const hours = Math.floor((diff % 86_400_000) / 3_600_000)
    const minutes = Math.floor((diff % 3_600_000) / 60_000)
    const seconds = Math.floor((diff % 60_000) / 1000)
    const pad = (n: number) => String(n).padStart(2, '0')
    const label = days > 0
      ? `${days} ${t('common.day')} ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
      : `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
    return { expired: false, label }
  }

  return (
    <div className="p-4 lg:p-8">
      <motion.div
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.06 } } }}
        className="space-y-6"
      >
        <motion.header variants={fadeUp} className="flex items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-mood-ink lg:text-3xl">
              {t('goals.title')}
            </h1>
            <p className="mt-0.5 text-sm text-mood-muted">{t('goals.subtitle')}</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => { resetForm(); setIsAdding(!isAdding) }}
            className="inline-flex items-center gap-2 rounded-full bg-mood-primary px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-mood-primary/25 transition-colors hover:bg-mood-deep"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">{t('goals.add')}</span>
          </motion.button>
        </motion.header>

        <AnimatePresence>
          {isAdding && (
            <motion.div
              initial={{ opacity: 0, y: -8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -8, height: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="overflow-hidden"
            >
              <div className="rounded-3xl border border-mood-primary/10 bg-mood-card p-6 shadow-[0_4px_24px_-12px_rgba(var(--mood-shadow-rgb),0.10)]">
                <h3 className="font-display text-lg font-bold text-mood-ink">
                  {editingId ? t('goals.editGoal') : t('goals.newGoal')}
                </h3>
                <form onSubmit={handleSubmit} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-mood-muted">
                      {t('common.name')}
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t('goals.namePlaceholder')}
                      className="w-full rounded-xl border border-mood-primary/15 bg-white px-4 py-3 text-sm text-mood-ink placeholder:text-mood-muted/60 transition-all focus:border-mood-primary focus:outline-none focus:ring-4 focus:ring-mood-primary/15"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-mood-muted">
                      {t('goals.targetAmount')}
                    </label>
                    <input
                      type="number"
                      value={targetAmount}
                      onChange={(e) => setTargetAmount(e.target.value)}
                      placeholder="5000000"
                      className="w-full rounded-xl border border-mood-primary/15 bg-white px-4 py-3 text-sm font-semibold text-mood-ink placeholder:text-mood-muted/60 transition-all focus:border-mood-primary focus:outline-none focus:ring-4 focus:ring-mood-primary/15"
                      required
                    />
                  </div>
                  {editingId && (
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-mood-muted">
                        {t('goals.currentAmount')}
                      </label>
                      <input
                        type="number"
                        value={currentAmount}
                        onChange={(e) => setCurrentAmount(e.target.value)}
                        placeholder="0"
                        className="w-full rounded-xl border border-mood-primary/15 bg-white px-4 py-3 text-sm font-semibold text-mood-ink placeholder:text-mood-muted/60 transition-all focus:border-mood-primary focus:outline-none focus:ring-4 focus:ring-mood-primary/15"
                      />
                    </div>
                  )}
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-mood-muted">
                      {t('goals.deadlineLabel')}
                    </label>
                    <div className="rounded-2xl border-2 border-mood-primary/15 bg-gradient-to-br from-mood-primary/5 to-mood-cream/40 p-3 transition-all focus-within:border-mood-primary focus-within:ring-4 focus-within:ring-mood-primary/15">
                      <div className="flex items-center gap-3 rounded-xl bg-white/70 px-3 py-2 shadow-sm shadow-mood-primary/5">
                        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-mood-primary/12 text-mood-primary">
                          <Calendar className="h-4 w-4" />
                        </div>
                        <input
                          type="datetime-local"
                          value={deadline}
                          onChange={(e) => setDeadline(e.target.value)}
                          className="w-full bg-transparent text-sm font-semibold tabular-nums text-mood-ink focus:outline-none"
                          required
                        />
                      </div>

                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {([
                          { key: 'goals.quick1w' as const, weeks: 1,  months: 0  },
                          { key: 'goals.quick1m' as const, weeks: 0,  months: 1  },
                          { key: 'goals.quick3m' as const, weeks: 0,  months: 3  },
                          { key: 'goals.quick6m' as const, weeks: 0,  months: 6  },
                          { key: 'goals.quick1y' as const, weeks: 0,  months: 12 },
                        ]).map((qp) => (
                          <button
                            key={qp.key}
                            type="button"
                            onClick={() => setDeadline(presetToLocalDateTime(qp.months, qp.weeks))}
                            className="rounded-full border border-mood-primary/15 bg-white px-2.5 py-1 text-[11px] font-semibold text-mood-ink/75 transition-colors hover:border-mood-primary/45 hover:bg-mood-primary/5 hover:text-mood-primary"
                          >
                            +{t(qp.key)}
                          </button>
                        ))}
                      </div>

                      {deadline && (() => {
                        const ms = new Date(deadline).getTime() - Date.now()
                        if (!Number.isFinite(ms)) return null
                        const days = Math.max(0, Math.ceil(ms / 86_400_000))
                        return (
                          <p className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-mood-muted">
                            <span className="inline-flex h-1.5 w-1.5 rounded-full bg-mood-primary" />
                            <span className="tabular-nums font-semibold text-mood-ink">{days}</span>
                            {t('goals.daysFromNow')}
                          </p>
                        )
                      })()}
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <div className="mb-1.5 flex items-center justify-between gap-3">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-mood-muted">
                        {t('goals.imageSection')}
                      </label>
                      <div className="inline-flex rounded-full border border-mood-primary/15 bg-white p-0.5 text-xs font-semibold">
                        <button
                          type="button"
                          onClick={() => { setImageMode('url'); setImageError('') }}
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-colors ${imageMode === 'url' ? 'bg-mood-primary text-white shadow-sm shadow-mood-primary/25' : 'text-mood-muted hover:text-mood-ink'}`}
                        >
                          <LinkIcon className="h-3.5 w-3.5" />
                          {t('goals.imageTabUrl')}
                        </button>
                        <button
                          type="button"
                          onClick={() => { setImageMode('file'); setImageError('') }}
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-colors ${imageMode === 'file' ? 'bg-mood-primary text-white shadow-sm shadow-mood-primary/25' : 'text-mood-muted hover:text-mood-ink'}`}
                        >
                          <Upload className="h-3.5 w-3.5" />
                          {t('goals.imageTabFile')}
                        </button>
                      </div>
                    </div>

                    {imageMode === 'url' ? (
                      <>
                        <input
                          type="url"
                          value={image.startsWith('data:') ? '' : image}
                          onChange={(e) => { setImage(e.target.value); setImageError('') }}
                          placeholder="https://example.com/picture.jpg"
                          className="w-full rounded-xl border border-mood-primary/15 bg-white px-4 py-3 text-sm text-mood-ink placeholder:text-mood-muted/60 transition-all focus:border-mood-primary focus:outline-none focus:ring-4 focus:ring-mood-primary/15"
                        />
                        <p className="mt-1.5 text-xs text-mood-muted">{t('goals.imageHint')}</p>
                      </>
                    ) : (
                      <>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-mood-primary/30 bg-white px-4 py-3 text-sm font-semibold text-mood-primary transition-colors hover:border-mood-primary/60 hover:bg-mood-primary/5"
                        >
                          <Upload className="h-4 w-4" />
                          {t('goals.imageChoose')}
                        </button>
                        <p className="mt-1.5 text-xs text-mood-muted">{t('goals.imageFileHint')}</p>
                      </>
                    )}

                    {imageError && (
                      <p className="mt-1.5 text-xs font-semibold text-rose-600">{imageError}</p>
                    )}

                    {image && (
                      <div className="relative mt-2 h-40 w-full overflow-hidden rounded-2xl border border-mood-primary/15 bg-mood-cream shadow-inner">
                        <div
                          className="absolute inset-0 scale-110 bg-cover bg-center opacity-40 blur-2xl"
                          style={{ backgroundImage: `url(${image})` }}
                          aria-hidden
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-white/0 via-white/0 to-white/30" aria-hidden />
                        <img
                          src={image}
                          alt="preview"
                          className="relative h-full w-full object-contain p-3 drop-shadow-[0_8px_18px_rgba(var(--mood-shadow-rgb),0.25)]"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                        />
                        <button
                          type="button"
                          onClick={clearImage}
                          aria-label={t('goals.imageRemove')}
                          className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-mood-muted shadow-md backdrop-blur-sm transition-colors hover:bg-white hover:text-rose-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-3 sm:col-span-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      className="rounded-full bg-mood-primary px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-mood-primary/25 transition-colors hover:bg-mood-deep"
                    >
                      {t('common.save')}
                    </motion.button>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="rounded-full border border-mood-primary/15 bg-white px-6 py-2.5 text-sm font-semibold text-mood-ink/80 transition-colors hover:border-mood-primary/40"
                    >
                      {t('common.cancel')}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div variants={fadeUp} className="grid grid-cols-1 justify-items-center gap-6 sm:grid-cols-2 sm:justify-items-stretch lg:grid-cols-3 xl:grid-cols-4">
          {goals.map((goal) => {
            const percent = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100))
            const timeLeft = getTimeLeft(goal.deadline, now)
            const isCompleted = goal.currentAmount >= goal.targetAmount
            const isMine = !goal.ownerId || goal.ownerId === currentUserId

            return (
              <motion.div
                key={goal.id}
                whileHover={{ y: -4 }}
                className="flex w-full max-w-sm flex-col overflow-hidden rounded-3xl border border-mood-primary/10 bg-mood-card shadow-[0_4px_24px_-12px_rgba(var(--mood-shadow-rgb),0.10)] transition-shadow hover:shadow-[0_18px_40px_-18px_rgba(var(--mood-shadow-rgb),0.30)]"
              >
                {goal.image && (
                  <div className="relative flex h-56 items-center justify-center overflow-hidden bg-mood-cream">
                    <div
                      className="absolute inset-0 scale-125 bg-cover bg-center opacity-60 blur-3xl"
                      style={{ backgroundImage: `url(${goal.image})` }}
                      aria-hidden
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-white/0 to-white/50" aria-hidden />
                    <div className="relative h-40 w-40 overflow-hidden rounded-2xl bg-white/40 shadow-[0_18px_40px_-12px_rgba(var(--mood-shadow-rgb),0.35)] ring-1 ring-white/60 backdrop-blur-sm">
                      <img
                        src={goal.image}
                        alt={goal.name}
                        className="h-full w-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex flex-1 flex-col p-5">
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-mood-primary to-mood-deep text-white shadow-md shadow-mood-primary/25">
                        <Target className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-display text-lg font-bold text-mood-ink">{goal.name}</h3>
                        <div className={`mt-0.5 inline-flex items-center gap-1.5 font-mono text-xs tabular-nums ${timeLeft.expired ? 'text-rose-600' : 'text-mood-muted'}`}>
                          <Calendar className="h-3.5 w-3.5" />
                          {timeLeft.label}
                        </div>
                        {!isMine && goal.ownerName && (
                          <div className="mt-1 inline-flex items-center rounded-full bg-mood-primary/10 px-2 py-0.5 text-[10px] font-semibold text-mood-primary">
                            {goal.ownerName}
                          </div>
                        )}
                      </div>
                    </div>
                    {isMine && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEdit(goal)}
                          aria-label="Edit"
                          className="rounded-lg p-2 text-mood-muted transition-colors hover:bg-mood-primary/8 hover:text-mood-primary"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(goal.id)}
                          aria-label="Delete"
                          className="rounded-lg p-2 text-mood-muted transition-colors hover:bg-rose-50 hover:text-rose-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="mb-3 flex items-baseline justify-between">
                    <span className="font-display text-2xl font-extrabold tabular-nums text-mood-ink">
                      {goal.currentAmount.toLocaleString()} ₮
                    </span>
                    <span className="text-sm text-mood-muted">
                      / {goal.targetAmount.toLocaleString()} ₮
                    </span>
                  </div>

                  <div className="mb-3 h-3 w-full overflow-hidden rounded-full bg-mood-cream">
                    <motion.div
                      className={`h-full rounded-full ${isCompleted ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : 'bg-gradient-to-r from-mood-primary to-mood-deep'}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${percent}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-semibold ${isCompleted ? 'text-emerald-600' : 'text-mood-primary'}`}>
                      {percent}% {isCompleted ? t('goals.percentDone') : t('goals.percentReached')}
                    </span>
                    {isCompleted ? (
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                        {t('goals.completed')}
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-mood-muted">
                        {t('goals.remaining')}: <span className="tabular-nums font-semibold text-mood-ink">{Math.max(0, goal.targetAmount - goal.currentAmount).toLocaleString()} ₮</span>
                      </span>
                    )}
                  </div>

                  {!isCompleted && isMine && (
                    <div className="mt-4 rounded-2xl border border-mood-primary/10 bg-mood-cream/40 p-3">
                      <AnimatePresence mode="wait" initial={false}>
                        {editingDailyId === goal.id ? (
                          <motion.div
                            key="daily-form"
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            transition={{ duration: 0.15 }}
                            className="flex flex-wrap items-center gap-2"
                          >
                            <div className="flex w-full flex-1 basis-full items-center gap-2 rounded-xl border border-mood-primary/20 bg-white px-3 py-2 sm:basis-auto">
                              <Coins className="h-4 w-4 shrink-0 text-mood-primary" />
                              <input
                                type="number"
                                autoFocus
                                value={dailyDraft}
                                onChange={(e) => setDailyDraft(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveDaily(goal)
                                  if (e.key === 'Escape') cancelDailyEditor()
                                }}
                                placeholder={String(getSuggestedDaily(goal))}
                                className="w-full bg-transparent text-sm font-semibold text-mood-ink placeholder:text-mood-muted/60 focus:outline-none"
                              />
                              <span className="text-xs font-semibold text-mood-muted">₮</span>
                            </div>
                            <div className="ml-auto flex gap-2">
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => saveDaily(goal)}
                                aria-label="Save"
                                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-mood-primary text-white shadow-md shadow-mood-primary/25 transition-colors hover:bg-mood-deep sm:h-10 sm:w-10"
                              >
                                <Check className="h-4 w-4" />
                              </motion.button>
                              <button
                                onClick={() => resetDaily(goal)}
                                aria-label={t('goals.dailyReset')}
                                title={t('goals.dailyReset')}
                                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-mood-primary/15 bg-white text-mood-muted transition-colors hover:border-mood-primary/40 hover:text-mood-ink sm:h-10 sm:w-10"
                              >
                                <RotateCcw className="h-4 w-4" />
                              </button>
                              <button
                                onClick={cancelDailyEditor}
                                aria-label="Cancel"
                                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-mood-primary/15 bg-white text-mood-muted transition-colors hover:border-mood-primary/40 hover:text-mood-ink sm:h-10 sm:w-10"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          </motion.div>
                        ) : (
                          <motion.div
                            key="daily-display"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-2.5"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-mood-primary/10 text-mood-primary">
                                <Coins className="h-4 w-4" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-[11px] font-semibold uppercase tracking-wider text-mood-muted">
                                  {t('goals.dailyLabel')}
                                  {!goal.dailyAmount && (
                                    <span className="ml-1 normal-case tracking-normal text-mood-muted/70">({t('goals.dailySuggested')})</span>
                                  )}
                                </p>
                                <p className="truncate font-display text-base font-bold tabular-nums text-mood-ink">
                                  {getEffectiveDaily(goal).toLocaleString()} ₮
                                </p>
                              </div>
                              <button
                                onClick={() => openDailyEditor(goal)}
                                aria-label={t('goals.dailyEdit')}
                                title={t('goals.dailyEdit')}
                                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-mood-muted transition-colors hover:bg-mood-primary/8 hover:text-mood-primary"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                            </div>
                            <motion.button
                              whileHover={{ scale: 1.01 }}
                              whileTap={{ scale: 0.99 }}
                              onClick={() => saveDailyToGoal(goal)}
                              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-mood-primary px-4 py-2 text-sm font-semibold text-white shadow-md shadow-mood-primary/25 transition-colors hover:bg-mood-deep"
                            >
                              <Wallet className="h-4 w-4" />
                              {t('goals.dailySaveNow')}
                            </motion.button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {!isCompleted && isMine && (
                    <div className="mt-3">
                      <AnimatePresence mode="wait">
                        {depositingId === goal.id ? (
                          <motion.div
                            key="deposit-form"
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            transition={{ duration: 0.15 }}
                            className="flex flex-wrap items-center gap-2"
                          >
                            <input
                              type="number"
                              autoFocus
                              value={depositAmount}
                              onChange={(e) => setDepositAmount(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleDeposit(goal)
                                if (e.key === 'Escape') cancelDeposit()
                              }}
                              placeholder={t('goals.depositPlaceholder')}
                              className="w-full flex-1 basis-full rounded-xl border border-mood-primary/20 bg-white px-3 py-2 text-sm font-semibold text-mood-ink placeholder:text-mood-muted/60 transition-all focus:border-mood-primary focus:outline-none focus:ring-4 focus:ring-mood-primary/15 sm:basis-auto"
                            />
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleDeposit(goal)}
                              aria-label="Confirm"
                              className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-mood-primary text-white shadow-md shadow-mood-primary/25 transition-colors hover:bg-mood-deep"
                            >
                              <Check className="h-4 w-4" />
                            </motion.button>
                            <button
                              onClick={cancelDeposit}
                              aria-label="Cancel"
                              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-mood-primary/15 bg-white text-mood-muted transition-colors hover:border-mood-primary/40 hover:text-mood-ink"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </motion.div>
                        ) : (
                          <motion.button
                            key="deposit-button"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            onClick={() => openDeposit(goal.id)}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-mood-primary/15 bg-mood-cream/60 px-4 py-2.5 text-sm font-semibold text-mood-primary transition-colors hover:border-mood-primary/40 hover:bg-mood-primary/5"
                          >
                            <Wallet className="h-4 w-4" />
                            {t('goals.addMoney')}
                          </motion.button>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}

          {goals.length === 0 && (
            <div className="sm:col-span-2 lg:col-span-3 xl:col-span-4 rounded-3xl border border-mood-primary/10 bg-mood-card px-6 py-12 text-center shadow-[0_4px_24px_-12px_rgba(var(--mood-shadow-rgb),0.10)]">
              <div className="flex flex-col items-center gap-5">
                <img
                  src={MASCOT_SRC}
                  alt="Moko"
                  className="h-64 w-64 object-contain drop-shadow-[0_18px_28px_rgba(var(--mood-shadow-rgb),0.22)] sm:h-72 sm:w-72 lg:h-80 lg:w-80"
                />
                <div>
                  <p className="font-display text-lg font-bold text-mood-ink">{t('goals.empty')}</p>
                  <p className="mt-1 text-sm text-mood-muted">{t('goals.emptyHint')}</p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setIsAdding(true)}
                  className="rounded-full bg-mood-primary px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-mood-primary/25 transition-colors hover:bg-mood-deep"
                >
                  {t('goals.add')}
                </motion.button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  )
}
