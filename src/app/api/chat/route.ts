import { NextRequest, NextResponse } from 'next/server'

const GEMINI_MODEL = 'gemini-2.5-flash'
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`

const EXPENSE_CATEGORIES = ['Хоол', 'Тээвэр', 'Дэлгүүр', 'Төлбөр', 'Зугаа цэнгэл', 'Бусад']
const INCOME_CATEGORIES = ['Цалин', 'Фриланс', 'Бусад']

function plusMonthsIso(months: number, today: string): string {
  const d = new Date(today)
  d.setMonth(d.getMonth() + months)
  return d.toISOString().split('T')[0]
}

function buildSystemPrompt(today: string) {
  const sixMonths = plusMonthsIso(6, today)
  return `Та "Моко" — WalletHub санхүүгийн апп-ийн ухаалаг туслах.
Өнөөдөр: ${today}.

ҮРГЭЛЖ ЯГ ДАРААХ ХЭЛБЭРТ ЦЭВЭР JSON буцаа (өөр текст бүү бич):

{
  "reply": "<1 өгүүлбэрийн товч хариулт>",
  "actions": [<үйлдлүүд эсвэл хоосон>]
}

ДҮРЭМ:
- "reply" зөвхөн 1 өгүүлбэр. Дүн, нэр, огноог нь товч баталгаажуул. Асуулт давтахгүй, тэмдэгт давтахгүй.
- Хэрэглэгч "төсөв", "зорилго", "гүйлгээ", "хадгаламж", "зарлуулсан", "оруул" гэх мэт хүсэлт гаргавал actions-д нэмж шууд гүйцэтгүүл.
- Мэдээлэл дутуу бол (жнь дүн алга) actions хоосон үлдээ, reply дотор тодруулга асуу.
- Зөвлөгөө/асуулт бол actions хоосон үлдээ, товч зөвлө.

ҮЙЛДЭЛИЙН ҮНДСЭН 3 ТӨРӨЛ — ЯГ ДОР ДУРДСАН ТАЛБАРУУДЫГ ЛЭХ АШИГЛА (өөр талбар нэмэхгүй):

1) ТӨСӨВ:
{"type":"create_budget","category":"<нэг>","amount":<тоо>}
category утга: ${EXPENSE_CATEGORIES.join(' | ')}

2) ЗОРИЛГО:
{"type":"create_goal","name":"<нэр>","targetAmount":<тоо>,"deadline":"YYYY-MM-DD"}
deadline хэрэглэгч хэлээгүй бол: "${sixMonths}"

3) ГҮЙЛГЭЭ:
{"type":"add_transaction","title":"<нэр>","amount":<тоо>,"category":"<нэг>","kind":"expense","date":"YYYY-MM-DD"}
kind: "expense" эсвэл "income"
expense category: ${EXPENSE_CATEGORIES.join(' | ')}
income category: ${INCOME_CATEGORIES.join(' | ')}
date хэрэглэгч хэлээгүй бол: "${today}"

ЖИШЭЭ 1 — Хэрэглэгч: "Машин авах гэсэн 15 сая төгрөгийн зорилго үүсгээрэй"
Хариу (ЯГ ИЙМ ХЭМЖЭЭТЭЙ):
{"reply":"Машин авах 15,000,000₮ зорилгыг ${sixMonths} хүртэл үүсгэлээ.","actions":[{"type":"create_goal","name":"Машин авах","targetAmount":15000000,"deadline":"${sixMonths}"}]}

ЖИШЭЭ 2 — Хэрэглэгч: "Хоолны төсөв 500,000₮"
Хариу:
{"reply":"Хоолны 500,000₮ төсөв нэмлээ.","actions":[{"type":"create_budget","category":"Хоол","amount":500000}]}

ЖИШЭЭ 3 — Хэрэглэгч: "Өнөөдөр 25,000₮ дэлгүүр зарлуулсан"
Хариу:
{"reply":"Дэлгүүрийн 25,000₮ гүйлгээ бүртгэлээ.","actions":[{"type":"add_transaction","title":"Дэлгүүр","amount":25000,"category":"Дэлгүүр","kind":"expense","date":"${today}"}]}

ЖИШЭЭ 4 — Хэрэглэгч: "Сайн уу"
Хариу:
{"reply":"Сайн байна уу! Юу хийхийг хүсэж байна вэ?","actions":[]}`
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

// Try to recover a usable JSON object from a possibly-truncated Gemini reply.
// Gemini sometimes loops on a phrase until it runs out of tokens, leaving an
// unterminated string. We scan back to the last balanced top-level object.
function recoverJson(raw: string): { reply: string; actions: unknown[] } {
  // Strip code fences if present.
  const stripped = raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim()

  try {
    const parsed = JSON.parse(stripped) as { reply?: unknown; actions?: unknown }
    return {
      reply: typeof parsed.reply === 'string' ? parsed.reply : '',
      actions: Array.isArray(parsed.actions) ? parsed.actions : [],
    }
  } catch {
    // fall through to recovery
  }

  // Try to pull out actions even if the surrounding JSON is broken.
  const actions: unknown[] = []
  const actionRegex = /\{\s*"type"\s*:\s*"(?:create_budget|create_goal|add_transaction)"[\s\S]*?\}/g
  let match: RegExpExecArray | null
  while ((match = actionRegex.exec(stripped)) !== null) {
    try {
      actions.push(JSON.parse(match[0]))
    } catch {
      // ignore malformed
    }
  }

  // Pull just the reply (first sentence up to a quote) if possible.
  const replyMatch = stripped.match(/"reply"\s*:\s*"([^"\\]{1,300})/)
  const reply = replyMatch?.[1] ?? ''

  return { reply, actions }
}

export async function POST(req: NextRequest) {
  try {
    const { messages } = (await req.json()) as { messages: ChatMessage[] }
    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY тохируулаагүй байна. aistudio.google.com/app/apikey дээрээс үнэгүй API key аваад .env.local-д нэмнэ үү.' },
        { status: 400 },
      )
    }

    const contents = messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }))

    const today = new Date().toISOString().split('T')[0]

    const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: buildSystemPrompt(today) }],
        },
        contents,
        generationConfig: {
          // Low temperature kills the "Таныг хүлээж байна" runaway loop.
          temperature: 0.15,
          maxOutputTokens: 512,
          responseMimeType: 'application/json',
        },
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      return NextResponse.json({ error: errText || `Gemini API ${response.status}` }, { status: response.status })
    }

    const data = (await response.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[]
    }
    const raw = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('').trim() ?? ''

    const { reply, actions } = recoverJson(raw)

    return NextResponse.json({ reply, actions })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
