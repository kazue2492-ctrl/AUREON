import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET() {
  try {
    const [rows] = await pool.query('SELECT NOW() AS time')

    return NextResponse.json({
      success: true,
      rows,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    )
  }
}
