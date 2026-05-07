'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ArrowDown, ArrowUp } from 'lucide-react'
import { addTransaction, updateTransaction } from '@/lib/data'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/types'
import type { Transaction } from '@/types'
import { useLanguage } from './LanguageProvider'

interface TransactionModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  transaction?: Transaction | null
}

export default function TransactionModal({ isOpen, onClose, onSuccess, transaction }: TransactionModalProps) {
  const { t, tc } = useLanguage()
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [type, setType] = useState<'income' | 'expense'>('expense')
  const [description, setDescription] = useState('')

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES

  useEffect(() => {
    if (transaction) {
      setTitle(transaction.title)
      setAmount(transaction.amount.toString())
      setCategory(transaction.category)
      setDate(transaction.date)
      setType(transaction.type)
      setDescription(transaction.description || '')
    } else {
      setTitle('')
      setAmount('')
      setCategory('')
      setDate(new Date().toISOString().split('T')[0])
      setType('expense')
      setDescription('')
    }
  }, [transaction, isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !amount || !category || !date) return

    const data = {
      title,
      amount: Number(amount),
      category,
      date,
      type,
      description,
    }

    if (transaction) {
      updateTransaction(transaction.id, data)
    } else {
      addTransaction(data)
    }

    onSuccess()
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-mood-ink/40 backdrop-blur-sm" />
          <motion.div
            initial={{ scale: 0.94, y: 16, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.96, y: 8, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 w-full max-w-[480px] max-h-[90vh] overflow-y-auto rounded-3xl border border-mood-primary/10 bg-mood-card shadow-2xl shadow-mood-primary/20"
          >
            <div className="relative flex items-start justify-between p-6 pb-3">
              <div>
                <h2 className="font-display text-xl font-bold text-mood-ink">
                  {transaction ? t('txModal.editTitle') : t('txModal.newTitle')}
                </h2>
                <p className="mt-0.5 text-xs text-mood-muted">
                  {type === 'income' ? t('common.income') : t('common.expense')}
                </p>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="relative z-10 rounded-xl p-2 text-mood-muted transition-colors hover:bg-mood-primary/8 hover:text-mood-primary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 p-6 pt-3">
              <div className="flex gap-2 rounded-2xl bg-mood-cream p-1">
                <button
                  type="button"
                  onClick={() => { setType('expense'); setCategory('') }}
                  className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${
                    type === 'expense'
                      ? 'bg-white text-rose-600 shadow-sm'
                      : 'text-mood-muted hover:text-mood-ink'
                  }`}
                >
                  <ArrowDown className="h-4 w-4" />
                  {t('common.expense')}
                </button>
                <button
                  type="button"
                  onClick={() => { setType('income'); setCategory('') }}
                  className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${
                    type === 'income'
                      ? 'bg-white text-emerald-600 shadow-sm'
                      : 'text-mood-muted hover:text-mood-ink'
                  }`}
                >
                  <ArrowUp className="h-4 w-4" />
                  {t('common.income')}
                </button>
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

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-mood-muted">
                  {t('common.title')}
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
                    {categories.map((cat) => (
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
                  onClick={onClose}
                  className="flex-1 rounded-full border border-mood-primary/15 bg-white py-3 text-sm font-semibold text-mood-ink/80 transition-colors hover:border-mood-primary/40 hover:text-mood-primary"
                >
                  {t('common.cancel')}
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="flex-1 rounded-full bg-mood-primary py-3 text-sm font-semibold text-white shadow-lg shadow-mood-primary/25 transition-colors hover:bg-mood-deep"
                >
                  {t('common.save')}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
