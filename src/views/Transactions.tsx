'use client'
import { useState, useMemo, useEffect } from 'react'
import { motion, type Variants } from 'framer-motion'
import {
  Search,
  Plus,
  TrendingUp,
  TrendingDown,
  Pencil,
  Trash2,
  Filter,
  ArrowUpDown,
  Receipt,
} from 'lucide-react'
import {
  getTransactions,
  deleteTransaction,
} from '@/lib/data'
import TransactionModal from '@/components/TransactionModal'
import type { Transaction } from '@/types'
import { useLanguage } from '@/components/LanguageProvider'

type SortField = 'date' | 'amount' | 'category'
type SortOrder = 'asc' | 'desc'

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
}

export default function Transactions() {
  const { t, tc } = useLanguage()
  const [transactions, setTransactions] = useState<Transaction[]>(getTransactions())
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all')
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)

  const filteredTransactions = useMemo(() => {
    let result = [...transactions]

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q)
      )
    }

    if (filterType !== 'all') {
      result = result.filter((t) => t.type === filterType)
    }

    result.sort((a, b) => {
      let comparison = 0
      switch (sortField) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime()
          break
        case 'amount':
          comparison = a.amount - b.amount
          break
        case 'category':
          comparison = a.category.localeCompare(b.category)
          break
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })

    return result
  }, [transactions, searchQuery, filterType, sortField, sortOrder])

  function refreshData() {
    setTransactions(getTransactions())
  }

  useEffect(() => {
    const sync = () => refreshData()
    window.addEventListener('dataUpdated', sync)
    window.addEventListener('profileUpdated', sync)
    return () => {
      window.removeEventListener('dataUpdated', sync)
      window.removeEventListener('profileUpdated', sync)
    }
  }, [])

  function handleDelete(id: string) {
    if (confirm(t('transactions.confirmDelete'))) {
      deleteTransaction(id)
      refreshData()
    }
  }

  function handleEdit(transaction: Transaction) {
    setEditingTransaction(transaction)
    setIsModalOpen(true)
  }

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  return (
    <div className="p-4 lg:p-8">
      <motion.div
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.06 } } }}
        className="space-y-6"
      >
        {/* Header */}
        <motion.header variants={fadeUp} className="flex items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-mood-ink lg:text-3xl">
              {t('transactions.title')}
            </h1>
            <p className="mt-0.5 text-sm text-mood-muted">{t('transactions.subtitle')}</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              setEditingTransaction(null)
              setIsModalOpen(true)
            }}
            className="inline-flex items-center gap-2 rounded-full bg-mood-primary px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-mood-primary/25 transition-colors hover:bg-mood-deep"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">{t('transactions.add')}</span>
          </motion.button>
        </motion.header>

        {/* Search & filters */}
        <motion.div
          variants={fadeUp}
          className="space-y-4 rounded-3xl border border-mood-primary/10 bg-mood-card p-4 shadow-[0_4px_24px_-12px_rgba(var(--mood-shadow-rgb),0.10)]"
        >
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-mood-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('common.search')}
                className="w-full rounded-xl border border-mood-primary/15 bg-white py-2.5 pl-10 pr-4 text-sm text-mood-ink placeholder:text-mood-muted/60 transition-all focus:border-mood-primary focus:outline-none focus:ring-4 focus:ring-mood-primary/15"
              />
            </div>

            <div className="flex gap-2">
              {(['all', 'income', 'expense'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                    filterType === type
                      ? 'bg-mood-primary text-white shadow-md shadow-mood-primary/20'
                      : 'border border-mood-primary/10 bg-white text-mood-ink/70 hover:border-mood-primary/30 hover:text-mood-ink'
                  }`}
                >
                  {type === 'all' ? t('common.all') : type === 'income' ? t('common.income') : t('common.expense')}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Filter className="h-4 w-4 text-mood-muted" />
            <span className="text-xs font-semibold uppercase tracking-wider text-mood-muted">
              {t('transactions.sortBy')}
            </span>
            {(['date', 'amount', 'category'] as const).map((field) => (
              <button
                key={field}
                onClick={() => toggleSort(field)}
                className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  sortField === field
                    ? 'bg-mood-primary text-white'
                    : 'border border-mood-primary/10 bg-white text-mood-ink/70 hover:border-mood-primary/30'
                }`}
              >
                {field === 'date' ? t('common.date') : field === 'amount' ? t('common.amount') : t('common.category')}
                {sortField === field && (
                  <ArrowUpDown className={`h-3 w-3 transition-transform ${sortOrder === 'asc' ? 'rotate-180' : ''}`} />
                )}
              </button>
            ))}
          </div>
        </motion.div>

        {/* List */}
        <motion.div
          variants={fadeUp}
          className="overflow-hidden rounded-3xl border border-mood-primary/10 bg-mood-card shadow-[0_4px_24px_-12px_rgba(var(--mood-shadow-rgb),0.10)]"
        >
          {/* Desktop table */}
          <div className="hidden md:block">
            <div className="grid grid-cols-[1fr_1fr_1fr_auto_auto] gap-4 bg-mood-cream/60 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-mood-muted">
              <span>{t('common.title')}</span>
              <span>{t('common.category')}</span>
              <span>{t('common.date')}</span>
              <span className="text-right">{t('common.amount')}</span>
              <span></span>
            </div>
            <div className="divide-y divide-mood-primary/8">
              {filteredTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="grid grid-cols-[1fr_1fr_1fr_auto_auto] items-center gap-4 px-6 py-4 transition-colors hover:bg-mood-cream/50"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                        tx.type === 'income'
                          ? 'bg-emerald-100 text-emerald-600'
                          : 'bg-rose-100 text-rose-600'
                      }`}
                    >
                      {tx.type === 'income' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    </div>
                    <span className="truncate text-sm font-semibold text-mood-ink">{tx.title}</span>
                  </div>
                  <span className="text-sm text-mood-muted">{tc(tx.category)}</span>
                  <span className="text-sm text-mood-muted">{tx.date}</span>
                  <span
                    className={`text-right font-display text-sm font-bold tabular-nums ${
                      tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {tx.type === 'income' ? '+' : '-'}{tx.amount.toLocaleString()} ₮
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEdit(tx)}
                      aria-label="Edit"
                      className="rounded-lg p-2 text-mood-muted transition-colors hover:bg-mood-primary/8 hover:text-mood-primary"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(tx.id)}
                      aria-label="Delete"
                      className="rounded-lg p-2 text-mood-muted transition-colors hover:bg-rose-50 hover:text-rose-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile cards */}
          <div className="divide-y divide-mood-primary/8 md:hidden">
            {filteredTransactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between gap-3 px-4 py-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${
                      tx.type === 'income'
                        ? 'bg-emerald-100 text-emerald-600'
                        : 'bg-rose-100 text-rose-600'
                    }`}
                  >
                    {tx.type === 'income' ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-mood-ink">{tx.title}</p>
                    <p className="truncate text-xs text-mood-muted">{tc(tx.category)} · {tx.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`font-display text-sm font-bold tabular-nums ${
                      tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {tx.type === 'income' ? '+' : '-'}{tx.amount.toLocaleString()} ₮
                  </span>
                  <div className="flex flex-col gap-0.5">
                    <button
                      onClick={() => handleEdit(tx)}
                      aria-label="Edit"
                      className="rounded-md p-1 text-mood-muted hover:text-mood-primary"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(tx.id)}
                      aria-label="Delete"
                      className="rounded-md p-1 text-mood-muted hover:text-rose-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredTransactions.length === 0 && (
            <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-mood-primary/10">
                <Receipt className="h-7 w-7 text-mood-primary" />
              </div>
              <p className="text-sm text-mood-muted">{t('transactions.empty')}</p>
            </div>
          )}
        </motion.div>
      </motion.div>

      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingTransaction(null)
        }}
        onSuccess={refreshData}
        transaction={editingTransaction}
      />
    </div>
  )
}
