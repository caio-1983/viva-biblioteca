import { NextResponse } from 'next/server'
import { getPrisma } from '@/lib/prisma'
import pkg from '@/package.json'

const SERVER_START = Date.now()

export async function GET() {
  const environment = process.env.NODE_ENV ?? 'development'

  let database: {
    connected: boolean
    version: string | null
    responseMs: number | null
  } = { connected: false, version: null, responseMs: null }

  try {
    const prisma  = getPrisma()
    const dbStart = Date.now()
    const rows    = await prisma.$queryRaw<[{ version: string }]>`SELECT version()`
    database = {
      connected:  true,
      version:    rows[0]?.version ?? null,
      responseMs: Date.now() - dbStart,
    }
  } catch {
    // banco indisponível — status degradado
  }

  const status = database.connected ? 'ok' : 'degraded'

  return NextResponse.json(
    {
      status,
      version:     pkg.version,
      environment,
      database,
      uptime:      Math.floor((Date.now() - SERVER_START) / 1000),
      timestamp:   new Date().toISOString(),
    },
    { status: database.connected ? 200 : 503 }
  )
}
