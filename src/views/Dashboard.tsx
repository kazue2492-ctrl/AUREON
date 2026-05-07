'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, type Variants } from 'framer-motion'
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Plus,
  Bell,
  ArrowRight,
  Sparkles,
  Mail,
  Users,
  ScanLine,
} from 'lucide-react'
import { apiFetch, getToken } from '@/lib/clientAuth'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import {
  getTransactions,
  getTotalBalance,
  getMonthlyIncome,
  getMonthlyExpense,
  getCategoryExpenses,
  getWeeklyData,
  getNotifications,
  getGoalSavings,
} from '@/lib/data'
import TransactionModal from '@/components/TransactionModal'
import { useLanguage } from '@/components/LanguageProvider'

const PIE_COLORS = ['#6D28D9', '#8B5CF6', '#A78BFA', '#C4B5FD', '#8B5A2B', '#D97706']
const TOTAL_BALANCE_VISUAL_SRC = '/4.png'
const DASHBOARD_HEADER_MASCOT_SRC = '/10.png'
const INCOME_VISUAL_SRC = '/7.png'
const EXPENSE_VISUAL_SRC = '/6.png'
const SAVINGS_VISUAL_SRC = '/11.png'

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
}

const stagger: Variants = {
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
}

export default function Dashboard() {
  const { t, tc } = useLanguage()
  const [transactions, setTransactions] = useState(getTransactions())
  const [balance, setBalance] = useState(0)
  const [income, setIncome] = useState(0)
  const [expense, setExpense] = useState(0)
  const [savings, setSavings] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [weeklyData, setWeeklyData] = useState(getWeeklyData())
  const [categoryData, setCategoryData] = useState<{ name: string; value: number }[]>([])
  const [notifications, setNotifications] = useState(getNotifications().filter(n => !n.read).slice(0, 3))
  const [pendingInvites, setPendingInvites] = useState<Array<{ id: string; familyName: string; inviterName: string }>>([])

  useEffect(() => {
    refreshData()
    loadInvitations()
  }, [])

  async function loadInvitations() {
    if (!getToken()) return
    try {
      const res = await apiFetch<{ invitations: Array<{ id: string; familyName: string; inviterName: string }> }>(
        '/api/family/invitations?direction=incoming'
      )
      setPendingInvites(res.invitations ?? [])
    } catch {
      // silent — dashboard still useful without this
    }
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

  function refreshData() {
    const inc = getMonthlyIncome()
    const exp = getMonthlyExpense()
    setBalance(getTotalBalance())
    setIncome(inc)
    setExpense(exp)
    setSavings(getGoalSavings())
    setTransactions(getTransactions())
    setWeeklyData(getWeeklyData())
    const catExp = getCategoryExpenses()
    setCategoryData(Object.entries(catExp).map(([name, value]) => ({ name, value })))
    setNotifications(getNotifications().filter(n => !n.read).slice(0, 3))
  }

  const stats = [
    {
      title: t('dashboard.totalBalance'),
      value: balance,
      change: '+5.2%',
      icon: Wallet,
      kind: 'hero' as const,
    },
    {
      title: t('common.income'),
      value: income,
      change: '+12%',
      icon: TrendingUp,
      kind: 'income' as const,
    },
    {
      title: t('common.expense'),
      value: expense,
      change: '-3%',
      icon: TrendingDown,
      kind: 'expense' as const,
    },
    {
      title: t('common.savings'),
      value: savings,
      change: '+8%',
      icon: PiggyBank,
      kind: 'savings' as const,
    },
  ]

  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)

  return (
    <div className="p-4 lg:p-8">
      <motion.div
        initial="hidden"
        animate="show"
        variants={stagger}
        className="space-y-6"
      >
        {/* Header */}
        <motion.header variants={fadeUp} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <motion.img
              src={DASHBOARD_HEADER_MASCOT_SRC}
              alt="Moko"
              className="h-16 w-16 flex-shrink-0 object-contain drop-shadow-[0_8px_14px_rgba(var(--mood-shadow-rgb),0.18)] sm:h-18 sm:w-18 lg:h-20 lg:w-20"
            />
            <div className="min-w-0">
              <h1 className="font-display text-2xl font-extrabold tracking-tight text-mood-ink lg:text-3xl">
                {t('dashboard.title')}
              </h1>
              <p className="mt-0.5 text-sm text-mood-muted">{t('dashboard.subtitle')}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              aria-label="Notifications"
              className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-mood-primary/15 bg-white text-mood-ink/80 transition-colors hover:border-mood-primary/40 hover:text-mood-primary"
            >
              <Bell className="h-4.5 w-4.5" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm">
                  {notifications.length}
                </span>
              )}
            </button>
            <Link
              href="/upload"
              className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-colors hover:bg-emerald-600"
            >
              <ScanLine className="h-4 w-4" />
              <span className="hidden sm:inline">{t('upload.title')}</span>
            </Link>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-full bg-mood-primary px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-mood-primary/25 transition-colors hover:bg-mood-deep"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">{t('dashboard.addTransaction')}</span>
            </motion.button>
          </div>
        </motion.header>

        {/* Family invitation banner */}
        {pendingInvites.length > 0 && (
          <motion.div variants={fadeUp} className="space-y-2">
            {pendingInvites.map((inv) => (
              <Link
                key={inv.id}
                href="/family"
                className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 transition hover:border-amber-300 hover:bg-amber-100"
              >
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-amber-200/70 text-amber-700">
                  <Mail className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold">
                    <Users className="mr-1 inline h-3.5 w-3.5" />
                    {inv.inviterName} танд гэр бүлийн урилга илгээлээ
                  </p>
                  <p className="truncate text-xs opacity-80">{inv.familyName}</p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-600 px-3 py-1 text-xs font-semibold text-white">
                  Хариулах <ArrowRight className="h-3 w-3" />
                </span>
              </Link>
            ))}
          </motion.div>
        )}

        {/* Notifications */}
        {notifications.length > 0 && (
          <motion.div variants={fadeUp} className="space-y-2">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm ${
                  n.type === 'warning'
                    ? 'border-amber-200 bg-amber-50 text-amber-800'
                    : n.type === 'success'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                    : 'border-mood-primary/20 bg-mood-primary/5 text-mood-primary'
                }`}
              >
                <Bell className="h-4 w-4 flex-shrink-0" />
                <span className="flex-1">{n.message}</span>
              </div>
            ))}
          </motion.div>
        )}

        {/* Stats grid */}
        <motion.div
          variants={stagger}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          {stats.map((stat) => (
            <motion.div
              key={stat.title}
              variants={fadeUp}
              whileHover={{ y: -3 }}
              className={`relative overflow-hidden rounded-3xl p-5 transition-shadow ${
                stat.kind === 'hero'
                  ? 'bg-gradient-to-br from-mood-primary via-mood-deep to-mood-primary text-white shadow-xl shadow-mood-primary/30'
                  : 'border border-mood-primary/10 bg-mood-card shadow-[0_4px_24px_-12px_rgba(var(--mood-shadow-rgb),0.10)] hover:shadow-[0_18px_40px_-18px_rgba(var(--mood-shadow-rgb),0.30)]'
              }`}
            >
              {stat.kind === 'hero' && (
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      'radial-gradient(circle at 80% 100%, rgba(255,200,120,0.20), transparent 50%)',
                  }}
                />
              )}
              {stat.kind === 'hero' && (
                <img
                  src={TOTAL_BALANCE_VISUAL_SRC}
                  alt=""
                  aria-hidden
                  className="pointer-events-none absolute right-0 bottom-[-39px] h-28 w-28 object-contain sm:h-32 sm:w-32 lg:h-36 lg:w-36"
                />
              )}
              {stat.kind === 'income' && (
                <img
                  src={INCOME_VISUAL_SRC}
                  alt=""
                  aria-hidden
                  className="pointer-events-none absolute right-0 bottom-[-39px] h-28 w-28 object-contain sm:h-32 sm:w-32 lg:h-36 lg:w-36"
                />
              )}
              {stat.kind === 'expense' && (
                <img
                  src={EXPENSE_VISUAL_SRC}
                  alt=""
                  aria-hidden
                  className="pointer-events-none absolute right-0 bottom-[-39px] h-28 w-28 object-contain sm:h-32 sm:w-32 lg:h-36 lg:w-36"
                />
              )}
              {stat.kind === 'savings' && (
                <img
                  src={SAVINGS_VISUAL_SRC}
                  alt=""
                  aria-hidden
                  className="pointer-events-none absolute right-0 bottom-[-39px] h-28 w-28 object-contain sm:h-32 sm:w-32 lg:h-36 lg:w-36"
                />
              )}
              <div className="relative flex items-center justify-between">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
                    stat.kind === 'hero' ? 'bg-white/20' : 'bg-mood-primary/10 text-mood-primary'
                  }`}
                >
                  <stat.icon className="h-5 w-5" />
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    stat.kind === 'hero'
                      ? 'bg-white/20 text-white'
                      : stat.change.startsWith('-')
                      ? 'bg-rose-50 text-rose-600'
                      : 'bg-emerald-50 text-emerald-600'
                  }`}
                >
                  {stat.change}
                </span>
              </div>
              <p
                className={`relative mt-4 text-xs font-medium ${
                  stat.kind === 'hero' ? 'text-white/80' : 'text-mood-muted'
                }`}
              >
                {stat.title}
              </p>
              <p
                className={`relative mt-1 font-display text-2xl font-extrabold tracking-tight lg:text-3xl ${
                  stat.kind === 'hero' ? 'text-white' : 'text-mood-ink'
                }`}
              >
                {stat.value.toLocaleString()} ₮
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* Charts */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <motion.div
            variants={fadeUp}
            className="rounded-3xl border border-mood-primary/10 bg-mood-card p-6 shadow-[0_4px_24px_-12px_rgba(var(--mood-shadow-rgb),0.10)]"
          >
            <h3 className="font-display text-lg font-bold text-mood-ink">
              {t('dashboard.weeklyExpenses')}
            </h3>
            <div className="mt-4">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={weeklyData.days.map((day, i) => ({ name: day, value: weeklyData.expenses[i] }))}>
                  <defs>
                    <linearGradient id="aureonBar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8B5CF6" />
                      <stop offset="100%" stopColor="#6D28D9" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(var(--mood-glow-rgb),0.10)" />
                  <XAxis dataKey="name" tick={{ fill: '#6B6480', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#6B6480', fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    formatter={(value: number) => [`${value.toLocaleString()} ₮`, t('common.expense')]}
                    contentStyle={{
                      borderRadius: 14,
                      border: '1px solid rgba(var(--mood-glow-rgb),0.15)',
                      background: '#FFFDF7',
                      boxShadow: '0 12px 24px -12px rgba(var(--mood-shadow-rgb),0.20)',
                    }}
                  />
                  <Bar dataKey="value" fill="url(#aureonBar)" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div
            variants={fadeUp}
            className="rounded-3xl border border-mood-primary/10 bg-mood-card p-6 shadow-[0_4px_24px_-12px_rgba(var(--mood-shadow-rgb),0.10)]"
          >
            <h3 className="font-display text-lg font-bold text-mood-ink">
              {t('dashboard.expenseByCategory')}
            </h3>
            <div className="mt-4">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    innerRadius={50}
                    paddingAngle={2}
                    dataKey="value"
                    animationBegin={200}
                    animationDuration={800}
                  >
                    {categoryData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => `${value.toLocaleString()} ₮`}
                    contentStyle={{
                      borderRadius: 14,
                      border: '1px solid rgba(var(--mood-glow-rgb),0.15)',
                      background: '#FFFDF7',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
                {categoryData.map((cat, i) => (
                  <div key={cat.name} className="inline-flex items-center gap-1.5 text-xs text-mood-muted">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                    />
                    {tc(cat.name)}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Recent transactions */}
        <motion.div
          variants={fadeUp}
          className="overflow-hidden rounded-3xl border border-mood-primary/10 bg-mood-card shadow-[0_4px_24px_-12px_rgba(var(--mood-shadow-rgb),0.10)]"
        >
          <div className="flex items-center justify-between p-6 pb-3">
            <h3 className="font-display text-lg font-bold text-mood-ink">
              {t('dashboard.recentTransactions')}
            </h3>
            <Link
              href="/transactions"
              className="inline-flex items-center gap-1 text-sm font-semibold text-mood-primary transition-colors hover:text-mood-deep"
            >
              {t('common.viewAll')}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="divide-y divide-mood-primary/8">
            {recentTransactions.length === 0 ? (
              <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
                <Sparkles className="h-6 w-6 text-mood-primary/60" />
                <p className="text-sm text-mood-muted">{t('transactions.empty')}</p>
              </div>
            ) : recentTransactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-mood-cream/50"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
                      tx.type === 'income'
                        ? 'bg-emerald-100 text-emerald-600'
                        : 'bg-rose-100 text-rose-600'
                    }`}
                  >
                    {tx.type === 'income' ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-mood-ink">{tx.title}</p>
                    <p className="text-xs text-mood-muted">{tc(tx.category)} · {tx.date}</p>
                  </div>
                </div>
                <span
                  className={`font-display text-sm font-bold tabular-nums ${
                    tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {tx.type === 'income' ? '+' : '-'}{tx.amount.toLocaleString()} ₮
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>

      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={refreshData}
      />
    </div>
  )
}
