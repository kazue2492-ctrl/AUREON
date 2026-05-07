import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { requireUser, isAuthUser } from '@/lib/auth'
import {
  parseReceiptImage,
  mapToAppCategory,
  MissingApiKeyError,
  type SupportedMediaType,
} from '@/lib/gemini'

export const runtime = 'nodejs'
// Receipt parsing makes a network call to Anthropic; it should never be cached.
export const dynamic = 'force-dynamic'

const MAX_BYTES = 5 * 1024 * 1024 // 5MB
const ALLOWED: Record<string, { ext: string; media: SupportedMediaType }> = {
  'image/jpeg': { ext: 'jpg', media: 'image/jpeg' },
  'image/jpg':  { ext: 'jpg', media: 'image/jpeg' },
  'image/png':  { ext: 'png', media: 'image/png'  },
  'image/webp': { ext: 'webp', media: 'image/webp' },
}

// In-memory rate limiter: 20 uploads per user per rolling hour.
// Single-instance only — for production, swap for Redis.
const RATE_WINDOW_MS = 60 * 60 * 1000
const RATE_LIMIT = 20
const rateBuckets = new Map<string, number[]>()

function checkRate(userId: string): boolean {
  const now = Date.now()
  const cutoff = now - RATE_WINDOW_MS
  const recent = (rateBuckets.get(userId) ?? []).filter((t) => t > cutoff)
  if (recent.length >= RATE_LIMIT) {
    rateBuckets.set(userId, recent)
    return false
  }
  recent.push(now)
  rateBuckets.set(userId, recent)
  return true
}

export async function POST(req: NextRequest) {
  const auth = await requireUser(req)
  if (!isAuthUser(auth)) return auth

  if (!checkRate(auth.id)) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
  }

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'invalid_form' }, { status: 400 })
  }

  const file = formData.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'no_file' }, { status: 400 })
  }

  const mime = file.type.toLowerCase()
  const allowed = ALLOWED[mime]
  if (!allowed) {
    return NextResponse.json({ error: 'invalid_type' }, { status: 415 })
  }
  if (file.size <= 0 || file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'too_large' }, { status: 413 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())

  // Persist the upload under /public/uploads/{userId}/{timestamp}.{ext}
  const userDir = path.join(process.cwd(), 'public', 'uploads', auth.id)
  await fs.mkdir(userDir, { recursive: true })
  const filename = `${Date.now()}.${allowed.ext}`
  const absPath = path.join(userDir, filename)
  await fs.writeFile(absPath, buffer)
  const receiptUrl = `/uploads/${auth.id}/${filename}`

  // Hand the image to Gemini vision.
  let parsed
  let raw: unknown = null
  try {
    const result = await parseReceiptImage({
      base64: buffer.toString('base64'),
      mediaType: allowed.media,
    })
    parsed = result.parsed
    raw = result.raw
  } catch (err) {
    if (err instanceof MissingApiKeyError) {
      return NextResponse.json({ error: 'missing_api_key', receiptUrl }, { status: 503 })
    }
    const message = err instanceof Error ? err.message : String(err)
    // Surface the real failure in the terminal so it can be diagnosed.
    console.error('[upload-receipt] Gemini call failed:', err)
    return NextResponse.json(
      { error: 'parse_failed', message, receiptUrl },
      { status: 502 },
    )
  }

  return NextResponse.json({
    receiptUrl,
    parsed: {
      vendor: parsed.vendor,
      date: parsed.date,
      totalAmount: parsed.total_amount,
      currency: parsed.currency,
      suggestedCategory: parsed.suggested_category,
      mappedCategory: mapToAppCategory(parsed.suggested_category),
      items: parsed.items,
      confidence: parsed.confidence,
    },
    raw,
  })
}
