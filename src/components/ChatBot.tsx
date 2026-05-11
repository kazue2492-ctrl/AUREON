'use client'
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, X, Send, Bot, User as UserIcon, Loader2, Sparkles, CheckCircle2, RotateCcw, Wallet, Target, Receipt, Lightbulb } from 'lucide-react'
import { addBudget, addGoal, addTransaction } from '@/lib/data'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/types'

interface Message {
  role: 'user' | 'assistant'
  content: string
  action?: ActionResult
}

interface ActionResult {
  ok: boolean
  label: string
}

interface SuggestionGroup {
  label: string
  icon: typeof Wallet
  items: string[]
}

const SUGGESTION_GROUPS: SuggestionGroup[] = [
  {
    label: 'Төсөв',
    icon: Wallet,
    items: [
      'Хоолны төсөв 500,000₮ гэж тогтоо',
      'Тээврийн төсөв 200,000₮ нэмээч',
      'Зугаа цэнгэлийн төсөв 150,000₮',
    ],
  },
  {
    label: 'Зорилго',
    icon: Target,
    items: [
      'Машин авах гэсэн 15 сая төгрөгийн зорилго үүсгээрэй',
      'Аялалд зориулж 3,000,000₮ хадгалмаар байна',
      'Шинэ утас авах 2,500,000₮ зорилго нэмээч',
    ],
  },
  {
    label: 'Гүйлгээ',
    icon: Receipt,
    items: [
      'Өнөөдөр 25,000₮ дэлгүүр зарлуулсан',
      '15,000₮ тээвэр зардлаар бүртгээч',
      'Цалин 2,500,000₮ орлогоор нэм',
    ],
  },
  {
    label: 'Зөвлөгөө',
    icon: Lightbulb,
    items: [
      'Сарын төсвөө хэрхэн зохицуулах вэ?',
      'Хадгаламжаа яаж нэмэгдүүлэх вэ?',
      'Зардлаа хэрхэн бууруулах вэ?',
      'Хөрөнгө оруулалт хаанаас эхлэх вэ?',
    ],
  },
]

// Quick-action chips shown above input — always visible for fastest access.
const QUICK_CHIPS = [
  'Төсөв нэмэх',
  'Зорилго үүсгэх',
  'Гүйлгээ бүртгэх',
  'Зөвлөгөө өг',
]

const GREETING_CONTENT = 'Сайн байна уу! Би Моко — таны санхүүгийн ухаалаг туслах. Төсөв, зорилго, гүйлгээ зэргийг шууд хэлэхэд би үүсгэж өгнө. Юу хийхийг хүсэж байна вэ? 🌰'

type ChatAction =
  | { type: 'create_budget'; category: string; amount: number }
  | { type: 'create_goal'; name: string; targetAmount: number; deadline: string }
  | { type: 'add_transaction'; title: string; amount: number; category: string; kind: 'income' | 'expense'; date?: string }

const VALID_ACTION_TYPES = new Set(['create_budget', 'create_goal', 'add_transaction'])

function todayIso(): string {
  return new Date().toISOString().split('T')[0]
}

function plusMonthsIso(months: number): string {
  const d = new Date()
  d.setMonth(d.getMonth() + months)
  return d.toISOString().split('T')[0]
}

function normalizeAction(raw: unknown): ChatAction | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  const t = r.type
  if (typeof t !== 'string' || !VALID_ACTION_TYPES.has(t)) return null
  return raw as ChatAction
}

function executeAction(action: ChatAction): ActionResult {
  if (action.type === 'create_budget') {
    if (!EXPENSE_CATEGORIES.includes(action.category)) {
      return { ok: false, label: `Категори "${action.category}" зөвшөөрөгдөхгүй.` }
    }
    if (!Number.isFinite(action.amount) || action.amount <= 0) {
      return { ok: false, label: 'Дүн буруу байна.' }
    }
    const now = new Date()
    addBudget({
      category: action.category,
      amount: action.amount,
      month: String(now.getMonth() + 1).padStart(2, '0'),
      year: now.getFullYear(),
    })
    return { ok: true, label: `Төсөв нэмэгдлээ: ${action.category} · ${action.amount.toLocaleString()}₮` }
  }

  if (action.type === 'create_goal') {
    if (!action.name || !Number.isFinite(action.targetAmount) || action.targetAmount <= 0) {
      return { ok: false, label: 'Зорилгын нэр эсвэл дүн буруу байна.' }
    }
    const deadline = /^\d{4}-\d{2}-\d{2}$/.test(action.deadline) ? action.deadline : plusMonthsIso(6)
    addGoal({
      name: action.name,
      targetAmount: action.targetAmount,
      deadline,
    })
    return { ok: true, label: `Зорилго үүслээ: ${action.name} · ${action.targetAmount.toLocaleString()}₮ · ${deadline}` }
  }

  if (action.type === 'add_transaction') {
    const valid =
      action.kind === 'income'
        ? INCOME_CATEGORIES.includes(action.category)
        : EXPENSE_CATEGORIES.includes(action.category)
    if (!valid) return { ok: false, label: `Категори "${action.category}" зөвшөөрөгдөхгүй.` }
    if (!Number.isFinite(action.amount) || action.amount <= 0) {
      return { ok: false, label: 'Дүн буруу байна.' }
    }
    addTransaction({
      title: action.title || action.category,
      amount: action.amount,
      category: action.category,
      type: action.kind,
      date: action.date && /^\d{4}-\d{2}-\d{2}$/.test(action.date) ? action.date : todayIso(),
    })
    return { ok: true, label: `Гүйлгээ нэмэгдлээ: ${action.title || action.category} · ${action.amount.toLocaleString()}₮` }
  }

  return { ok: false, label: 'Энэ үйлдлийг таних боломжгүй.' }
}

export default function ChatBot() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{ role: 'assistant', content: GREETING_CONTENT }])
    }
    if (open) setTimeout(() => inputRef.current?.focus(), 100)
  }, [open, messages.length])

  function resetChat() {
    setMessages([{ role: 'assistant', content: GREETING_CONTENT }])
    setInput('')
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function sendMessage(text: string) {
    const trimmed = text.trim()
    if (!trimmed || loading) return

    const userMsg: Message = { role: 'user', content: trimmed }
    const next = [...messages, userMsg]
    setMessages(next)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: next.map(m => ({ role: m.role, content: m.content })),
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)

      const reply = typeof data.reply === 'string' ? data.reply.trim() : ''
      const rawActions: unknown[] = Array.isArray(data.actions) ? data.actions : []
      const actions = rawActions
        .map((a: unknown) => normalizeAction(a))
        .filter((a): a is ChatAction => a !== null)

      let actionResult: ActionResult | undefined
      if (actions.length > 0) {
        const results = actions.map(executeAction)
        const okCount = results.filter(r => r.ok).length
        actionResult = okCount === results.length
          ? { ok: true, label: results.map(r => r.label).join('  •  ') }
          : { ok: false, label: results.map(r => r.label).join('  •  ') }
        // data.ts already fires dataUpdated, but dispatch again here to be
        // robust against future refactors and to refresh views that listen.
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('dataUpdated'))
        }
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: reply || (actionResult?.ok ? 'Бэлэн боллоо.' : 'Юу хийхийг арай тодорхой хэлээч.'),
        action: actionResult,
      }])
    } catch (err: unknown) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: err instanceof Error ? `Уучлаарай, алдаа гарлаа: ${err.message}` : 'Уучлаарай, алдаа гарлаа.',
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setOpen(v => !v)}
        title="Моко AI"
        aria-label="Open Moko AI chat"
        initial={false}
        animate={{ scale: open ? 0.92 : 1 }}
        whileHover={{ scale: open ? 0.92 : 1.05 }}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-[calc(env(safe-area-inset-bottom)+5rem)] right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-mood-primary to-mood-deep text-white shadow-2xl shadow-mood-primary/40 ring-4 ring-white/40 transition-shadow hover:shadow-mood-primary/60 sm:h-14 sm:w-14 sm:right-5 lg:bottom-6 lg:right-6"
      >
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.span
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <X className="h-6 w-6" strokeWidth={2.4} />
            </motion.span>
          ) : (
            <motion.span
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <MessageSquare className="h-6 w-6" strokeWidth={2.2} />
            </motion.span>
          )}
        </AnimatePresence>
        {!open && (
          <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-[9px] font-bold text-white ring-2 ring-white">
            AI
          </span>
        )}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="fixed bottom-[calc(env(safe-area-inset-bottom)+9rem)] right-3 left-3 z-50 flex h-[min(560px,calc(100vh-15rem))] flex-col overflow-hidden rounded-3xl border border-mood-primary/15 bg-mood-card shadow-2xl shadow-mood-primary/25 sm:left-auto sm:right-4 sm:w-[min(380px,calc(100vw-2rem))] lg:bottom-24 lg:right-6 lg:h-[min(560px,calc(100vh-7rem))]"
          >
            <div className="flex items-center gap-3 bg-gradient-to-r from-mood-primary to-mood-deep px-4 py-3 text-white">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                <Bot className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="font-display text-sm font-bold">Моко AI</p>
                <p className="text-[10px] text-white/75">Санхүүгийн ухаалаг туслах</p>
              </div>
              <button
                onClick={resetChat}
                aria-label="Шинээр эхлэх"
                title="Шинээр эхлэх"
                disabled={loading || messages.length <= 1}
                className="rounded-lg p-1.5 text-white/70 transition hover:bg-white/15 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-white/70"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close chat"
                className="rounded-lg p-1.5 text-white/70 transition hover:bg-white/15 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto bg-mood-cream/40 px-4 py-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full ${
                    msg.role === 'assistant' ? 'bg-mood-primary/15' : 'bg-mood-ink/10'
                  }`}>
                    {msg.role === 'assistant'
                      ? <Bot className="h-3.5 w-3.5 text-mood-primary" />
                      : <UserIcon className="h-3.5 w-3.5 text-mood-ink/70" />}
                  </div>
                  <div className={`max-w-[76%] space-y-2 ${msg.role === 'user' ? 'items-end' : ''}`}>
                    <div className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                      msg.role === 'assistant'
                        ? 'rounded-tl-sm bg-mood-card text-mood-ink/90 ring-1 ring-mood-primary/8'
                        : 'rounded-tr-sm bg-mood-primary text-white'
                    }`}>
                      {msg.content}
                    </div>
                    {msg.action && (
                      <div className={`inline-flex items-start gap-1.5 rounded-xl px-2.5 py-1.5 text-[11px] font-semibold leading-snug ${
                        msg.action.ok
                          ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                          : 'bg-rose-50 text-rose-700 ring-1 ring-rose-200'
                      }`}>
                        <CheckCircle2 className="mt-0.5 h-3 w-3 flex-shrink-0" />
                        <span>{msg.action.label}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-mood-primary/15">
                    <Bot className="h-3.5 w-3.5 text-mood-primary" />
                  </div>
                  <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm bg-mood-card px-4 py-3 ring-1 ring-mood-primary/8">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-mood-primary/50 [animation-delay:0ms]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-mood-primary/50 [animation-delay:150ms]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-mood-primary/50 [animation-delay:300ms]" />
                  </div>
                </div>
              )}

              {messages.length === 1 && !loading && (
                <div className="space-y-3 pt-1">
                  <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-mood-muted">
                    <Sparkles className="h-3 w-3 text-mood-primary" /> Санал болгох
                  </p>
                  {SUGGESTION_GROUPS.map((group) => {
                    const Icon = group.icon
                    return (
                      <div key={group.label} className="space-y-1.5">
                        <p className="flex items-center gap-1.5 text-[10px] font-bold text-mood-primary/80">
                          <Icon className="h-3 w-3" />
                          {group.label}
                        </p>
                        {group.items.map((s) => (
                          <button
                            key={s}
                            onClick={() => sendMessage(s)}
                            className="w-full rounded-xl border border-mood-primary/15 bg-mood-card px-3 py-2 text-left text-xs text-mood-ink/80 transition hover:border-mood-primary/40 hover:bg-mood-primary/5 hover:text-mood-primary"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )
                  })}
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {messages.length > 1 && !loading && (
              <div className="border-t border-mood-primary/10 bg-mood-card/80 px-3 pt-2.5">
                <div className="flex gap-1.5 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
                  {QUICK_CHIPS.map((chip) => (
                    <button
                      key={chip}
                      onClick={() => setInput(chip + ' ')}
                      className="flex-shrink-0 rounded-full border border-mood-primary/20 bg-mood-cream/60 px-3 py-1 text-[11px] font-semibold text-mood-ink/75 transition hover:border-mood-primary/50 hover:bg-mood-primary/5 hover:text-mood-primary"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t border-mood-primary/10 bg-mood-card px-3 py-3">
              <form
                onSubmit={e => { e.preventDefault(); sendMessage(input) }}
                className="flex items-center gap-2"
              >
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Асуулт бичнэ үү..."
                  disabled={loading}
                  className="flex-1 rounded-xl border border-mood-primary/15 bg-mood-card px-3.5 py-2.5 text-sm text-mood-ink placeholder:text-mood-muted/60 transition-all focus:border-mood-primary focus:outline-none focus:ring-2 focus:ring-mood-primary/15 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-mood-primary text-white shadow-md shadow-mood-primary/25 transition hover:bg-mood-deep disabled:opacity-40"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
