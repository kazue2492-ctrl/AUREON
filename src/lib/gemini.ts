// Server-only helper for calling Gemini vision on a receipt image.
// Do NOT import this from client components — it reads GEMINI_API_KEY.

import { GoogleGenerativeAI } from '@google/generative-ai'

const SYSTEM_PROMPT = `You are an expert receipt OCR + parser specialised in Mongolian, Russian and English receipts. Read the image carefully and return ONLY one valid JSON object — no markdown, no code fences, no commentary.

Mongolian receipt conventions you must know:
- Currency symbol "₮" or words "төгрөг" / "MNT" mean Mongolian Tugrik. Currency code is "MNT".
- Numbers may use thousands separators: comma (,), period (.) or space. Always return a plain number with no separators (e.g. "12,500" -> 12500, "1.250,00" -> 1250).
- "Нийт", "Нийт дүн", "Төлөх дүн", "ДҮН", "TOTAL", "Итого" all mean the FINAL total. Always pick the FINAL total, never a subtotal, change ("хариулт"), tax line ("НӨАТ" / "VAT") or per-item price.
- "ХХК", "ТББ", "хоршоо" are company suffixes — keep them in the vendor name.
- Dates may appear as "2024.05.15", "15/05/2024", "15-05-2024", "2024 оны 5 сарын 15". Normalise to YYYY-MM-DD. If only two-digit year (e.g. "24.05.15"), assume 20xx. If you are not sure of the date, return null.
- Common vendor types: "Номин", "Миний дэлгүүр", "Минимарт", "Юнител", "Mobicom", "Skytel", "UB Cab", "Petrovis", "Magicnet", "Toko" are dealer/store names. Pick the merchant brand, not the address.
- If multiple items appear, list them in "items". Truncate names to under 80 characters. If you cannot read an item line, skip it.

Category guidance — pick the closest match for "suggested_category":
- "Хоол хүнс" — restaurants, cafés, bakeries, supermarkets, food delivery
- "Тээвэр" — taxi, fuel/petrol stations (Petrovis, NIC, Magnai), bus, parking
- "Орон сууц" — rent, utilities (цахилгаан, ус, дулаан, гааз, интернэт, телевиз)
- "Хувцас" — clothing, shoes, accessories
- "Эрүүл мэнд" — pharmacy, hospital, clinic, dental, vitamins
- "Зугаа цэнгэл" — cinema, bars, games, streaming, concerts, hobbies
- "Боловсрол" — schools, courses, books, stationery
- "Бусад зардал" — anything that doesn't clearly match the above

Confidence:
- "high" — every field is clearly readable and unambiguous
- "medium" — total is clear but vendor/date/category are inferred
- "low" — image is blurry, partially cropped, or you had to guess most fields

If a field cannot be determined, return null for that field (do not invent values).`

const USER_PROMPT = `Read this receipt image and return JSON in exactly this shape:
{
  "vendor": string | null,
  "date": "YYYY-MM-DD" | null,
  "total_amount": number | null,
  "currency": "MNT" | "USD" | "EUR" | "RUB" | "CNY" | "KRW" | "JPY" | null,
  "suggested_category": "Хоол хүнс" | "Тээвэр" | "Орон сууц" | "Хувцас" | "Эрүүл мэнд" | "Зугаа цэнгэл" | "Боловсрол" | "Бусад зардал" | null,
  "items": [{ "name": string, "price": number | null, "qty": number | null }],
  "confidence": "high" | "medium" | "low"
}

Examples of correct outputs (for reference only — read the actual image):

Example 1 (a Petrovis fuel receipt printed "2024.03.18  Petrovis ХХК  Нийт дүн: 75,000₮"):
{"vendor":"Petrovis ХХК","date":"2024-03-18","total_amount":75000,"currency":"MNT","suggested_category":"Тээвэр","items":[],"confidence":"high"}

Example 2 (a small grocery receipt "Mini Mart  15/05/24  Талх 2x1500  Сүү 1x3200  Нийт: 6,200T"):
{"vendor":"Mini Mart","date":"2024-05-15","total_amount":6200,"currency":"MNT","suggested_category":"Хоол хүнс","items":[{"name":"Талх","price":1500,"qty":2},{"name":"Сүү","price":3200,"qty":1}],"confidence":"high"}

Now read the receipt and respond.`

// Free-tier vision-capable model. Override with GEMINI_MODEL env var if needed.
// Current options (as of 2026): gemini-2.5-flash, gemini-2.0-flash, gemini-flash-latest.
// Older 1.5-* models were retired by Google in late 2025.
const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash'

export type SuggestedCategory =
  | 'Хоол хүнс'
  | 'Тээвэр'
  | 'Орон сууц'
  | 'Хувцас'
  | 'Эрүүл мэнд'
  | 'Зугаа цэнгэл'
  | 'Боловсрол'
  | 'Бусад зардал'

export interface ReceiptItem {
  name: string
  price: number | null
  qty: number | null
}

export interface ParsedReceipt {
  vendor: string | null
  date: string | null
  total_amount: number | null
  currency: string | null
  suggested_category: SuggestedCategory | null
  items: ReceiptItem[]
  confidence: 'high' | 'medium' | 'low'
}

export type SupportedMediaType = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif'

const VALID_CATEGORIES: ReadonlySet<string> = new Set([
  'Хоол хүнс', 'Тээвэр', 'Орон сууц', 'Хувцас',
  'Эрүүл мэнд', 'Зугаа цэнгэл', 'Боловсрол', 'Бусад зардал',
])

function coerceString(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const trimmed = v.trim()
  return trimmed.length > 0 ? trimmed : null
}

function coerceNumber(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string') {
    const cleaned = v.replace(/[^\d.,-]/g, '').replace(/,/g, '')
    const n = Number(cleaned)
    return Number.isFinite(n) ? n : null
  }
  return null
}

function coerceItems(v: unknown): ReceiptItem[] {
  if (!Array.isArray(v)) return []
  return v
    .map((raw) => {
      if (!raw || typeof raw !== 'object') return null
      const r = raw as Record<string, unknown>
      const name = coerceString(r.name)
      if (!name) return null
      return {
        name: name.slice(0, 200),
        price: coerceNumber(r.price),
        qty: coerceNumber(r.qty),
      }
    })
    .filter((x): x is ReceiptItem => x !== null)
    .slice(0, 50)
}

function coerceConfidence(v: unknown): 'high' | 'medium' | 'low' {
  return v === 'high' || v === 'low' ? v : 'medium'
}

function coerceCategory(v: unknown): SuggestedCategory | null {
  if (typeof v !== 'string') return null
  const trimmed = v.trim()
  return VALID_CATEGORIES.has(trimmed) ? (trimmed as SuggestedCategory) : null
}

// Strip code fences if the model ignored the "no markdown" instruction.
function stripJsonFences(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  return (fenced ? fenced[1] : text).trim()
}

function sanitize(raw: unknown): ParsedReceipt {
  const obj = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const vendor = coerceString(obj.vendor)
  const dateRaw = coerceString(obj.date)
  // Only accept YYYY-MM-DD; reject anything else so we don't trust garbage.
  const date = dateRaw && /^\d{4}-\d{2}-\d{2}$/.test(dateRaw) ? dateRaw : null
  return {
    vendor: vendor ? vendor.slice(0, 200) : null,
    date,
    total_amount: coerceNumber(obj.total_amount),
    currency: coerceString(obj.currency)?.toUpperCase().slice(0, 6) ?? null,
    suggested_category: coerceCategory(obj.suggested_category),
    items: coerceItems(obj.items),
    confidence: coerceConfidence(obj.confidence),
  }
}

export class MissingApiKeyError extends Error {
  constructor() { super('GEMINI_API_KEY is not set'); this.name = 'MissingApiKeyError' }
}

export async function parseReceiptImage(args: {
  base64: string
  mediaType: SupportedMediaType
}): Promise<{ parsed: ParsedReceipt; raw: unknown }> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new MissingApiKeyError()

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({
    model: MODEL,
    systemInstruction: SYSTEM_PROMPT,
    generationConfig: {
      // Forcing JSON mime type makes Gemini skip markdown wrapping.
      responseMimeType: 'application/json',
      // Long receipts with many items can blow past 1k tokens — give headroom.
      maxOutputTokens: 4096,
      temperature: 0,
      topP: 0.1,
    },
  })

  const result = await model.generateContent([
    { inlineData: { mimeType: args.mediaType, data: args.base64 } },
    { text: USER_PROMPT },
  ])

  const text = result.response.text()
  if (!text) {
    return { parsed: sanitize({}), raw: { error: 'no-text-block' } }
  }

  const cleaned = stripJsonFences(text)
  let raw: unknown
  try {
    raw = JSON.parse(cleaned)
  } catch {
    return { parsed: sanitize({}), raw: { error: 'invalid-json', text } }
  }

  return { parsed: sanitize(raw), raw }
}

// Map Gemini's spec-defined category labels to the existing app's category vocabulary
// so suggested categories actually match what budget tracking and reports expect.
const CATEGORY_MAP: Record<SuggestedCategory, string> = {
  'Хоол хүнс':     'Хоол',
  'Тээвэр':        'Тээвэр',
  'Орон сууц':     'Төлбөр',
  'Хувцас':        'Дэлгүүр',
  'Эрүүл мэнд':    'Бусад',
  'Зугаа цэнгэл':  'Зугаа цэнгэл',
  'Боловсрол':     'Бусад',
  'Бусад зардал':  'Бусад',
}

export function mapToAppCategory(c: SuggestedCategory | null): string {
  if (!c) return ''
  return CATEGORY_MAP[c] ?? ''
}
