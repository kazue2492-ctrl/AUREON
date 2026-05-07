'use client'
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, X, Send, Bot, User as UserIcon, Loader2, Sparkles } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const suggestions = [
  'Хэрхэн хадгаламж нэмэгдүүлэх вэ?',
  'Сарын төсвөө хэрхэн зохицуулах вэ?',
  'Зардлаа хэрхэн бууруулах вэ?',
  'Санхүүгийн зорилго тавих зөвлөмж',
]

export default function ChatBot() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: 'Сайн байна уу! Би Моко — таны санхүүгийн ухаалаг туслах. Юу асуухыг хүсэж байна вэ? 🌰',
      }])
    }
    if (open) setTimeout(() => inputRef.current?.focus(), 100)
  }, [open])

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
      setMessages(prev => [...prev, { role: 'assistant', content: data.content }])
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
        className="fixed bottom-20 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-mood-primary to-mood-deep text-white shadow-2xl shadow-mood-primary/40 ring-4 ring-white/40 transition-shadow hover:shadow-mood-primary/60 lg:bottom-6 lg:right-6"
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
            className="fixed bottom-40 right-4 z-50 flex h-[min(560px,calc(100vh-12rem))] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-3xl border border-mood-primary/15 bg-mood-card shadow-2xl shadow-mood-primary/25 lg:bottom-24 lg:right-6 lg:h-[min(560px,calc(100vh-7rem))]"
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
                onClick={() => setOpen(false)}
                aria-label="Close chat"
                className="rounded-lg p-1 text-white/70 transition hover:bg-white/15 hover:text-white"
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
                  <div className={`max-w-[76%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    msg.role === 'assistant'
                      ? 'rounded-tl-sm bg-white text-mood-ink/90 ring-1 ring-mood-primary/8'
                      : 'rounded-tr-sm bg-mood-primary text-white'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-mood-primary/15">
                    <Bot className="h-3.5 w-3.5 text-mood-primary" />
                  </div>
                  <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm bg-white px-4 py-3 ring-1 ring-mood-primary/8">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-mood-primary/50 [animation-delay:0ms]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-mood-primary/50 [animation-delay:150ms]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-mood-primary/50 [animation-delay:300ms]" />
                  </div>
                </div>
              )}

              {messages.length === 1 && !loading && (
                <div className="space-y-2 pt-1">
                  <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-mood-muted">
                    <Sparkles className="h-3 w-3 text-mood-primary" /> Санал болгох асуултууд
                  </p>
                  {suggestions.map(s => (
                    <button
                      key={s}
                      onClick={() => sendMessage(s)}
                      className="w-full rounded-xl border border-mood-primary/15 bg-white px-3 py-2 text-left text-xs text-mood-ink/80 transition hover:border-mood-primary/40 hover:bg-mood-primary/5 hover:text-mood-primary"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              <div ref={bottomRef} />
            </div>

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
                  className="flex-1 rounded-xl border border-mood-primary/15 bg-white px-3.5 py-2.5 text-sm text-mood-ink placeholder:text-mood-muted/60 transition-all focus:border-mood-primary focus:outline-none focus:ring-2 focus:ring-mood-primary/15 disabled:opacity-50"
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
