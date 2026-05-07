'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import {
  Plus,
  AlertTriangle,
  CheckCircle2,
  Pencil,
  Trash2,
  PiggyBank,
} from 'lucide-react'
import {
  getBudgets,
  addBudget,
  updateBudget,
  deleteBudget,
  getCategoryExpenses,
} from '@/lib/data'
import type { Budget as BudgetType } from '@/types'
import { EXPENSE_CATEGORIES } from '@/types'
import { useLanguage } from '@/components/LanguageProvider'

const PALETTE = ['#6D28D9', '#8B5CF6', '#A78BFA', '#8B5A2B', '#D97706', '#4C1D95']

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
}

export default function Budget() {
  const { t, tc } = useLanguage()
  const [budgets, setBudgets] = useState<BudgetType[]>([])
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newCategory, setNewCategory] = useState('')
  const [newAmount, setNewAmount] = useState('')
  const [totalBudget, setTotalBudget] = useState(0)
  const [totalSpent, setTotalSpent] = useState(0)

  useEffect(() => {
    refreshData()
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
    const allBudgets = getBudgets()
    const catExp = getCategoryExpenses()
    const updated = allBudgets.map((b) => ({ ...b, spent: catExp[b.category] || 0 }))
    setBudgets(updated)
    setTotalBudget(updated.reduce((acc, b) => acc + b.amount, 0))
    setTotalSpent(updated.reduce((acc, b) => acc + b.spent, 0))
  }

  function handleAdd() {
    if (!newCategory || !newAmount) return

    if (editingId) {
      updateBudget(editingId, { category: newCategory, amount: Number(newAmount) })
    } else {
      const now = new Date()
      addBudget({
        category: newCategory,
        amount: Number(newAmount),
        month: String(now.getMonth() + 1).padStart(2, '0'),
        year: now.getFullYear(),
      })
    }

    setNewCategory('')
    setNewAmount('')
    setEditingId(null)
    setIsAdding(false)
    refreshData()
  }

  function handleEdit(budget: BudgetType) {
    setNewCategory(budget.category)
    setNewAmount(budget.amount.toString())
    setEditingId(budget.id)
    setIsAdding(true)
  }

  function handleDelete(id: string) {
    if (confirm(t('budget.confirmDelete'))) {
      deleteBudget(id)
      refreshData()
    }
  }

  function getProgressBg(percent: number): string {
    if (percent >= 100) return 'bg-gradient-to-r from-rose-400 to-rose-600'
    if (percent >= 80) return 'bg-gradient-to-r from-amber-400 to-amber-500'
    return 'bg-gradient-to-r from-mood-primary to-mood-deep'
  }

  function getStatusIcon(percent: number) {
    if (percent >= 100) return <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
    if (percent >= 80) return <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
    return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
  }

  const availableCategories = EXPENSE_CATEGORIES.filter(
    (cat) => !budgets.some((b) => b.category === cat)
  )

  const remaining = totalBudget - totalSpent

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
              {t('budget.title')}
            </h1>
            <p className="mt-0.5 text-sm text-mood-muted">{t('budget.subtitle')}</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              setIsAdding(!isAdding)
              setEditingId(null)
              setNewCategory('')
              setNewAmount('')
            }}
            className="inline-flex items-center gap-2 rounded-full bg-mood-primary px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-mood-primary/25 transition-colors hover:bg-mood-deep"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">{t('budget.add')}</span>
          </motion.button>
        </motion.header>

        {/* Summary */}
        <motion.div variants={fadeUp} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-mood-primary via-mood-deep to-mood-primary p-5 text-white shadow-xl shadow-mood-primary/30">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{ background: 'radial-gradient(circle at 80% 100%, rgba(255,200,120,0.20), transparent 50%)' }}
            />
            <p className="relative text-xs font-medium text-white/80">{t('budget.totalBudget')}</p>
            <p className="relative mt-1 font-display text-2xl font-extrabold tracking-tight lg:text-3xl">
              {totalBudget.toLocaleString()} ₮
            </p>
          </div>
          <div className="rounded-3xl border border-mood-primary/10 bg-mood-card p-5 shadow-[0_4px_24px_-12px_rgba(var(--mood-shadow-rgb),0.10)]">
            <p className="text-xs font-medium text-mood-muted">{t('budget.totalSpent')}</p>
            <p className="mt-1 font-display text-2xl font-extrabold tracking-tight text-rose-600 lg:text-3xl">
              {totalSpent.toLocaleString()} ₮
            </p>
          </div>
          <div className="rounded-3xl border border-mood-primary/10 bg-mood-card p-5 shadow-[0_4px_24px_-12px_rgba(var(--mood-shadow-rgb),0.10)]">
            <p className="text-xs font-medium text-mood-muted">{t('budget.remaining')}</p>
            <p className={`mt-1 font-display text-2xl font-extrabold tracking-tight lg:text-3xl ${remaining >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {remaining.toLocaleString()} ₮
            </p>
          </div>
        </motion.div>

        {/* Add/Edit form */}
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
                  {editingId ? t('budget.editBudget') : t('budget.newBudget')}
                </h3>
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-mood-muted">
                      {t('common.category')}
                    </label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full rounded-xl border border-mood-primary/15 bg-white px-4 py-3 text-sm text-mood-ink transition-all focus:border-mood-primary focus:outline-none focus:ring-4 focus:ring-mood-primary/15"
                    >
                      <option value="">{t('common.choose')}</option>
                      {(editingId ? EXPENSE_CATEGORIES : availableCategories).map((cat) => (
                        <option key={cat} value={cat}>{tc(cat)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-mood-muted">
                      {t('common.amount')} (₮)
                    </label>
                    <input
                      type="number"
                      value={newAmount}
                      onChange={(e) => setNewAmount(e.target.value)}
                      placeholder="500000"
                      className="w-full rounded-xl border border-mood-primary/15 bg-white px-4 py-3 text-sm font-semibold text-mood-ink placeholder:text-mood-muted/60 transition-all focus:border-mood-primary focus:outline-none focus:ring-4 focus:ring-mood-primary/15"
                    />
                  </div>
                </div>
                <div className="mt-5 flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleAdd}
                    className="rounded-full bg-mood-primary px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-mood-primary/25 transition-colors hover:bg-mood-deep"
                  >
                    {t('common.save')}
                  </motion.button>
                  <button
                    onClick={() => { setIsAdding(false); setEditingId(null) }}
                    className="rounded-full border border-mood-primary/15 bg-white px-6 py-2.5 text-sm font-semibold text-mood-ink/80 transition-colors hover:border-mood-primary/40"
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Budget cards */}
        <motion.div variants={fadeUp} className="space-y-4">
          {budgets.map((budget, index) => {
            const percent = budget.amount > 0
              ? Math.min(100, Math.round((budget.spent / budget.amount) * 100))
              : 0
            const remaining = budget.amount - budget.spent
            const color = PALETTE[index % PALETTE.length]

            return (
              <motion.div
                key={budget.id}
                whileHover={{ y: -3 }}
                className="rounded-3xl border border-mood-primary/10 bg-mood-card p-5 shadow-[0_4px_24px_-12px_rgba(var(--mood-shadow-rgb),0.10)] transition-shadow hover:shadow-[0_18px_40px_-18px_rgba(var(--mood-shadow-rgb),0.30)] sm:p-6"
              >
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-2xl text-sm font-bold text-white"
                      style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)` }}
                    >
                      {tc(budget.category).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-display text-base font-bold text-mood-ink">{tc(budget.category)}</h3>
                      <div className="mt-0.5 flex items-center gap-1.5 text-xs">
                        {getStatusIcon(percent)}
                        <span className={`font-medium ${
                          percent >= 100 ? 'text-rose-600'
                          : percent >= 80 ? 'text-amber-600'
                          : 'text-emerald-600'
                        }`}>
                          {percent >= 100 ? t('budget.statusOver') : percent >= 80 ? t('budget.statusWarn') : t('budget.statusOk')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEdit(budget)}
                      aria-label="Edit"
                      className="rounded-lg p-2 text-mood-muted transition-colors hover:bg-mood-primary/8 hover:text-mood-primary"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(budget.id)}
                      aria-label="Delete"
                      className="rounded-lg p-2 text-mood-muted transition-colors hover:bg-rose-50 hover:text-rose-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mb-3 h-2.5 w-full overflow-hidden rounded-full bg-mood-cream">
                  <motion.div
                    className={`h-full rounded-full ${getProgressBg(percent)}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${percent}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-mood-muted">
                    {budget.spent.toLocaleString()} ₮ / {budget.amount.toLocaleString()} ₮
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="font-display font-semibold text-mood-ink">{percent}%</span>
                    <span className={`text-xs font-semibold ${remaining >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {remaining >= 0 ? '+' : ''}{remaining.toLocaleString()} ₮
                    </span>
                  </div>
                </div>
              </motion.div>
            )
          })}

          {budgets.length === 0 && (
            <div className="flex flex-col items-center gap-4 rounded-3xl border border-mood-primary/10 bg-mood-card px-6 py-12 text-center shadow-[0_4px_24px_-12px_rgba(var(--mood-shadow-rgb),0.10)]">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-mood-primary/10">
                <PiggyBank className="h-7 w-7 text-mood-primary" />
              </div>
              <p className="text-sm text-mood-muted">{t('budget.empty')}</p>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setIsAdding(true)}
                className="rounded-full bg-mood-primary px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-mood-primary/25 transition-colors hover:bg-mood-deep"
              >
                {t('budget.add')}
              </motion.button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  )
}
