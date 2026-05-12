'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Clock } from 'lucide-react'
import { useLanguage } from './LanguageProvider'

interface DateTimePickerProps {
  value: string  // "YYYY-MM-DDTHH:mm" or empty
  onChange: (next: string) => void
  placeholder?: string
}

const pad2 = (n: number) => String(n).padStart(2, '0')

function toLocalDateTime(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

function parseLocalDateTime(s: string): Date | null {
  if (!s) return null
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/)
  if (!m) return null
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5]))
  return Number.isNaN(d.getTime()) ? null : d
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear()
      && a.getMonth()    === b.getMonth()
      && a.getDate()     === b.getDate()
}

// Build a 6-row × 7-col grid that always starts on Sunday so the calendar
// layout never shifts size when navigating across months with different
// starting weekdays.
function getMonthGrid(year: number, month: number): Array<{ date: Date; outside: boolean }> {
  const first = new Date(year, month, 1)
  const startDow = first.getDay()
  const grid: Array<{ date: Date; outside: boolean }> = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(year, month, 1 - startDow + i)
    grid.push({ date: d, outside: d.getMonth() !== month })
  }
  return grid
}

const WEEK_LABELS_MN = ['Ня', 'Да', 'Мя', 'Лх', 'Пү', 'Ба', 'Бя']
const WEEK_LABELS_EN = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

export default function DateTimePicker({ value, onChange, placeholder }: DateTimePickerProps) {
  const { lang } = useLanguage()
  const parsed = parseLocalDateTime(value)
  const today = useMemo(() => new Date(), [])
  const [open, setOpen] = useState(false)
  const [viewMonth, setViewMonth] = useState<{ y: number; m: number }>(() => {
    const ref = parsed ?? today
    return { y: ref.getFullYear(), m: ref.getMonth() }
  })
  const [hour, setHour] = useState<number>(parsed ? parsed.getHours() : 9)
  const [minute, setMinute] = useState<number>(parsed ? parsed.getMinutes() : 0)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close popover when clicking outside.
  useEffect(() => {
    if (!open) return
    const onDocClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  // Sync internal view + time when `value` is updated by a quick-pick chip
  // or by the parent (e.g. when editing an existing goal).
  useEffect(() => {
    const next = parseLocalDateTime(value)
    if (next) {
      setViewMonth({ y: next.getFullYear(), m: next.getMonth() })
      setHour(next.getHours())
      setMinute(next.getMinutes())
    }
  }, [value])

  const days = useMemo(() => getMonthGrid(viewMonth.y, viewMonth.m), [viewMonth])
  const weekLabels = lang === 'mn' ? WEEK_LABELS_MN : WEEK_LABELS_EN
  const monthLabel = new Date(viewMonth.y, viewMonth.m, 1).toLocaleDateString(
    lang === 'mn' ? 'mn-MN' : 'en-US',
    { year: 'numeric', month: 'long' }
  )

  function pickDay(date: Date) {
    const d = new Date(date)
    d.setHours(hour, minute, 0, 0)
    onChange(toLocalDateTime(d))
  }

  function setTimeAndPropagate(nextHour: number, nextMinute: number) {
    setHour(nextHour)
    setMinute(nextMinute)
    if (parsed) {
      const d = new Date(parsed)
      d.setHours(nextHour, nextMinute, 0, 0)
      onChange(toLocalDateTime(d))
    }
  }

  function selectToday() {
    const t = new Date()
    t.setHours(hour, minute, 0, 0)
    onChange(toLocalDateTime(t))
    setViewMonth({ y: t.getFullYear(), m: t.getMonth() })
  }

  function clear() {
    onChange('')
    setOpen(false)
  }

  function prevMonth() {
    setViewMonth((v) => {
      const d = new Date(v.y, v.m - 1, 1)
      return { y: d.getFullYear(), m: d.getMonth() }
    })
  }
  function nextMonth() {
    setViewMonth((v) => {
      const d = new Date(v.y, v.m + 1, 1)
      return { y: d.getFullYear(), m: d.getMonth() }
    })
  }

  const displayLabel = parsed
    ? parsed.toLocaleString(
        lang === 'mn' ? 'mn-MN' : 'en-US',
        { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
      )
    : (placeholder ?? (lang === 'mn' ? 'Огноо ба цаг сонгоно уу' : 'Pick date & time'))

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 rounded-xl bg-white/70 px-3 py-2 text-left text-sm shadow-sm shadow-mood-primary/5 transition-all hover:bg-white focus:outline-none"
      >
        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-mood-primary/12 text-mood-primary">
          <Calendar className="h-4 w-4" />
        </span>
        <span className={`flex-1 truncate tabular-nums ${parsed ? 'font-semibold text-mood-ink' : 'font-medium text-mood-muted/80'}`}>
          {displayLabel}
        </span>
        <ChevronDown
          className={`h-4 w-4 flex-shrink-0 text-mood-muted transition-transform ${open ? 'rotate-180 text-mood-primary' : ''}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute left-0 top-[calc(100%+8px)] z-50 w-[300px] max-w-[calc(100vw-2rem)] origin-top-left overflow-hidden rounded-2xl border border-mood-primary/15 bg-mood-card shadow-[0_18px_50px_-18px_rgba(var(--mood-shadow-rgb),0.45)]"
          >
            {/* Month header */}
            <div className="flex items-center justify-between px-3 pb-2 pt-3">
              <span className="font-display text-sm font-bold text-mood-ink">{monthLabel}</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={prevMonth}
                  aria-label="Previous month"
                  className="rounded-lg p-1.5 text-mood-muted transition-colors hover:bg-mood-primary/10 hover:text-mood-primary"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={nextMonth}
                  aria-label="Next month"
                  className="rounded-lg p-1.5 text-mood-muted transition-colors hover:bg-mood-primary/10 hover:text-mood-primary"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Weekday labels */}
            <div className="grid grid-cols-7 px-3">
              {weekLabels.map((label) => (
                <div
                  key={label}
                  className="py-1 text-center text-[10px] font-semibold uppercase tracking-wider text-mood-muted"
                >
                  {label}
                </div>
              ))}
            </div>

            {/* Day grid */}
            <div className="grid grid-cols-7 gap-0.5 px-3 pb-3">
              {days.map(({ date, outside }) => {
                const selected = parsed && sameDay(date, parsed)
                const isToday  = sameDay(date, today)
                const tone = selected
                  ? 'bg-mood-primary text-white font-bold shadow-md shadow-mood-primary/30'
                  : outside
                  ? 'text-mood-muted/40 hover:bg-mood-cream'
                  : isToday
                  ? 'text-mood-primary font-bold hover:bg-mood-primary/10'
                  : 'text-mood-ink/85 hover:bg-mood-primary/10 hover:text-mood-primary'
                return (
                  <button
                    key={date.toISOString()}
                    type="button"
                    onClick={() => pickDay(date)}
                    className={`relative aspect-square rounded-lg text-xs tabular-nums transition-colors ${tone}`}
                  >
                    {date.getDate()}
                    {isToday && !selected && (
                      <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-mood-primary" />
                    )}
                  </button>
                )
              })}
            </div>

            {/* Time row */}
            <div className="border-t border-mood-primary/10 bg-mood-cream/50 px-3 py-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-mood-primary/12 text-mood-primary">
                  <Clock className="h-3.5 w-3.5" />
                </span>
                <TimeSpinner
                  value={hour}
                  max={23}
                  onChange={(v) => setTimeAndPropagate(v, minute)}
                  ariaLabel={lang === 'mn' ? 'Цаг' : 'Hour'}
                />
                <span className="font-display text-base font-bold text-mood-ink/70">:</span>
                <TimeSpinner
                  value={minute}
                  max={59}
                  onChange={(v) => setTimeAndPropagate(hour, v)}
                  ariaLabel={lang === 'mn' ? 'Минут' : 'Minute'}
                />
                <div className="ml-auto flex items-center gap-1">
                  <button
                    type="button"
                    onClick={selectToday}
                    className="rounded-full bg-mood-primary px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm shadow-mood-primary/25 transition-colors hover:bg-mood-deep"
                  >
                    {lang === 'mn' ? 'Өнөөдөр' : 'Today'}
                  </button>
                  <button
                    type="button"
                    onClick={clear}
                    className="rounded-full border border-mood-primary/15 bg-white px-2.5 py-1 text-[11px] font-semibold text-mood-muted transition-colors hover:border-mood-primary/40 hover:text-mood-ink"
                  >
                    {lang === 'mn' ? 'Цэвэрлэх' : 'Clear'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function TimeSpinner({
  value, max, onChange, ariaLabel,
}: {
  value: number
  max: number
  onChange: (v: number) => void
  ariaLabel: string
}) {
  const wrap = (v: number) => ((v % (max + 1)) + (max + 1)) % (max + 1)
  return (
    <div className="flex items-center gap-0.5">
      <input
        type="text"
        inputMode="numeric"
        aria-label={ariaLabel}
        value={String(value).padStart(2, '0')}
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, '').slice(0, 2)
          if (digits === '') { onChange(0); return }
          const n = Number(digits)
          onChange(Math.max(0, Math.min(max, n)))
        }}
        className="w-9 rounded-lg border border-mood-primary/15 bg-white py-1 text-center font-display text-sm font-bold tabular-nums text-mood-ink transition-colors focus:border-mood-primary focus:outline-none focus:ring-2 focus:ring-mood-primary/20"
      />
      <div className="flex flex-col">
        <button
          type="button"
          onClick={() => onChange(wrap(value + 1))}
          aria-label="Increment"
          className="rounded p-0.5 text-mood-muted transition-colors hover:bg-mood-primary/10 hover:text-mood-primary"
        >
          <ChevronUp className="h-3 w-3" />
        </button>
        <button
          type="button"
          onClick={() => onChange(wrap(value - 1))}
          aria-label="Decrement"
          className="rounded p-0.5 text-mood-muted transition-colors hover:bg-mood-primary/10 hover:text-mood-primary"
        >
          <ChevronDown className="h-3 w-3" />
        </button>
      </div>
    </div>
  )
}
