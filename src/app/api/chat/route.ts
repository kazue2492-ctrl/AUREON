import { NextRequest, NextResponse } from 'next/server'

const GEMINI_MODEL = 'gemini-2.5-flash'
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`

const SYSTEM_PROMPT = `Та WalletHub санхүүгийн апп-ийн ухаалаг туслах "Моко" байна.
Хэрэглэгчийн санхүүгийн асуултад товч, практик, найрсаг байдлаар монгол хэлээр хариулна уу.
Зөвхөн санхүүгийн сэдвүүд: зарлага, хадгаламж, төсөв, зорилго, орлого, хөрөнгө оруулалт зэрэгт тусална уу.
Бусад сэдвээр асуувал эелдгээр санхүүгийн асуулт асуухыг санал болго.
Хариулт нь 3-4 өгүүлбэрээс хэтрэхгүй байх хэрэгтэй.`

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
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

    const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: SYSTEM_PROMPT }],
        },
        contents,
        generationConfig: {
          temperature: 0.6,
          maxOutputTokens: 512,
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
    const content = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('').trim() ?? ''
    return NextResponse.json({ content })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
