'use client'
import { useState, useEffect } from 'react'
import {
  Download,
  TrendingUp,
  TrendingDown,
  PiggyBank,
} from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  Legend,
} from 'recharts'
import {
  getCategoryExpenses,
  getLast6MonthsData,
  getSavingsGrowth,
  getMonthlyIncome,
  getMonthlyExpense,
  getGoalSavings,
} from '@/lib/data'
import { useLanguage } from '@/components/LanguageProvider'

const COLORS = ['#4F46E5', '#8B5CF6', '#6366F1', '#A78BFA', '#7C3AED', '#818CF8']

export default function Reports() {
  const { t } = useLanguage()
  const [categoryData, setCategoryData] = useState<{ name: string; value: number }[]>([])
  const [monthlyData, setMonthlyData] = useState<{ months: string[]; income: number[]; expenses: number[] }>({ months: [], income: [], expenses: [] })
  const [savingsData, setSavingsData] = useState<{ months: string[]; savings: number[] }>({ months: [], savings: [] })
  const hasCategoryData = categoryData.length > 0

  useEffect(() => {
    function refresh() {
      const catExp = getCategoryExpenses()
      setCategoryData(Object.entries(catExp).map(([name, value]) => ({ name, value })))
      setMonthlyData(getLast6MonthsData())
      setSavingsData(getSavingsGrowth())
    }
    refresh()
    window.addEventListener('dataUpdated', refresh)
    return () => window.removeEventListener('dataUpdated', refresh)
  }, [])

  const barData = monthlyData.months.map((m, i) => ({
    month: m,
    income: monthlyData.income[i],
    expense: monthlyData.expenses[i],
  }))

  const lineData = savingsData.months.map((m, i) => ({
    month: m,
    savings: savingsData.savings[i],
  }))

  const totalIncome = getMonthlyIncome()
  const totalExpense = getMonthlyExpense()
  const totalSavings = getGoalSavings()

  function handleDownloadPDF() {
    const content = `
САНХҮҮГИЙН ТАЙЛАН
Generated: ${new Date().toLocaleDateString()}

САРЫН ХУРААНГУЙ
- Нийт орлого: ${totalIncome.toLocaleString()} ₮
- Нийт зарлага: ${totalExpense.toLocaleString()} ₮
- Хэмнэлт: ${totalSavings.toLocaleString()} ₮

КАТЕГОРИОР ЗАРЛАГА
${categoryData.map(c => `- ${c.name}: ${c.value.toLocaleString()} ₮`).join('\n')}

Сүүлийн 6 сарын өгөгдөл:
${monthlyData.months.map((m, i) => `${m}: Орлого ${monthlyData.income[i].toLocaleString()} ₮, Зарлага ${monthlyData.expenses[i].toLocaleString()} ₮`).join('\n')}
`
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sanhuu-report-${new Date().toISOString().split('T')[0]}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-3 sm:p-4 lg:p-8 page-transition">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-5 sm:mb-6">
        <div className="min-w-0">
          <h1 className="truncate text-xl sm:text-2xl lg:text-3xl font-bold text-[#1A1A1A] dark:text-white">
            {t('reports.title')}
          </h1>
          <p className="text-[#8D99AE] mt-1 truncate text-xs sm:text-base">{t('reports.subtitle')}</p>
        </div>
        <button
          onClick={handleDownloadPDF}
          aria-label={t('reports.download')}
          className="flex flex-shrink-0 items-center gap-2 px-3 sm:px-4 py-2.5 theme-btn-primary rounded-xl text-sm font-medium transition-colors"
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">{t('reports.download')}</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 sm:p-5 rounded-2xl border border-emerald-100 dark:border-emerald-800">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            <span className="text-sm text-emerald-600 dark:text-emerald-400">{t('common.income')}</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold font-space tabular-nums text-emerald-700 dark:text-emerald-300">
            {totalIncome.toLocaleString()} ₮
          </p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 p-4 sm:p-5 rounded-2xl border border-red-100 dark:border-red-800">
          <div className="flex items-center gap-3 mb-2">
            <TrendingDown className="w-5 h-5 text-red-500" />
            <span className="text-sm text-red-600 dark:text-red-400">{t('common.expense')}</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold font-space tabular-nums text-red-700 dark:text-red-300">
            {totalExpense.toLocaleString()} ₮
          </p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 sm:p-5 rounded-2xl border border-blue-100 dark:border-blue-800">
          <div className="flex items-center gap-3 mb-2">
            <PiggyBank className="w-5 h-5 text-blue-500" />
            <span className="text-sm text-blue-600 dark:text-blue-400">{t('common.savings')}</span>
          </div>
          <p className={`text-xl sm:text-2xl font-bold font-space tabular-nums ${totalSavings >= 0 ? 'text-blue-700 dark:text-blue-300' : 'text-red-700 dark:text-red-300'}`}>
            {totalSavings.toLocaleString()} ₮
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Pie Chart */}
        <div className="bg-white dark:bg-[#1A1D26] p-4 sm:p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm fade-in-up">
          <h3 className="text-lg font-semibold text-[#1A1A1A] dark:text-white mb-4">
            {t('reports.expenseByCategory')}
          </h3>
          {hasCategoryData ? (
            <div className="flex flex-col xl:flex-row xl:items-center gap-4 sm:gap-5">
              <img
                src="/13.png"
                alt="Report mascot"
                className="mx-auto xl:mx-0 w-64 sm:w-80 lg:w-96 xl:w-[26rem] h-auto object-contain drop-shadow-[0_18px_30px_rgba(var(--mood-shadow-rgb),0.25)] flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      outerRadius="80%"
                      dataKey="value"
                      animationBegin={200}
                      animationDuration={800}
                      labelLine={false}
                      label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                        if (percent < 0.06) return null
                        const RADIAN = Math.PI / 180
                        const radius = innerRadius + (outerRadius - innerRadius) * 0.6
                        const x = cx + radius * Math.cos(-midAngle * RADIAN)
                        const y = cy + radius * Math.sin(-midAngle * RADIAN)
                        return (
                          <text
                            x={x}
                            y={y}
                            fill="#ffffff"
                            textAnchor="middle"
                            dominantBaseline="central"
                            fontSize={12}
                            fontWeight={600}
                          >
                            {`${(percent * 100).toFixed(0)}%`}
                          </text>
                        )
                      }}
                    >
                      {categoryData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number, name) => [`${value.toLocaleString()} ₮`, String(name)]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5">
                  {categoryData.map((cat, i) => {
                    const total = categoryData.reduce((s, c) => s + c.value, 0)
                    const pct = total > 0 ? (cat.value / total) * 100 : 0
                    return (
                      <div key={cat.name} className="inline-flex items-center gap-1.5 text-xs text-[#8D99AE]">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: COLORS[i % COLORS.length] }}
                        />
                        <span>{cat.name}</span>
                        <span className="tabular-nums text-[#A1A8B8]">{pct.toFixed(0)}%</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 bg-gray-50/60 dark:bg-white/5 px-6 py-10 text-center gap-4">
              <img
                src="/14.png"
                alt="Empty report illustration"
                className="w-72 sm:w-80 lg:w-96 h-auto object-contain drop-shadow-[0_18px_30px_rgba(var(--mood-shadow-rgb),0.25)]"
              />
              <div>
                <p className="text-lg font-semibold text-[#1A1A1A] dark:text-white">
                  {t('reports.empty')}
                </p>
                <p className="mt-1 text-sm text-[#8D99AE]">
                  {t('reports.emptyHint')}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Bar Chart */}
        <div className="bg-white dark:bg-[#1A1D26] p-4 sm:p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm fade-in-up">
          <h3 className="text-lg font-semibold text-[#1A1A1A] dark:text-white mb-4">
            {t('reports.monthlyIncomeExpense')}
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
              <XAxis dataKey="month" tick={{ fill: '#8D99AE', fontSize: 12 }} />
              <YAxis tick={{ fill: '#8D99AE', fontSize: 12 }} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} />
              <Tooltip
                formatter={(value: number) => `${value.toLocaleString()} ₮`}
              />
              <Legend />
              <Bar dataKey="income" fill="#27AE60" radius={[6, 6, 0, 0]} />
              <Bar dataKey="expense" fill="#E74C3C" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Line Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-[#1A1D26] p-4 sm:p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm fade-in-up">
          <h3 className="text-lg font-semibold text-[#1A1A1A] dark:text-white mb-4">
            {t('reports.savingsGrowth')}
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
              <XAxis dataKey="month" tick={{ fill: '#8D99AE', fontSize: 12 }} />
              <YAxis tick={{ fill: '#8D99AE', fontSize: 12 }} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} />
              <Tooltip
                formatter={(value: number) => `${value.toLocaleString()} ₮`}
                contentStyle={{ borderRadius: 12, border: '1px solid #E0E0E0' }}
              />
              <Line
                type="monotone"
                dataKey="savings"
                stroke="#6366F1"
                strokeWidth={3}
                dot={{ fill: '#6366F1', r: 5 }}
                activeDot={{ r: 7 }}
                animationDuration={1200}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

