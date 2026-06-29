import { NextResponse } from 'next/server'
import { getPrisma } from '@/lib/prisma'
import pkg from '@/package.json'

const SERVER_START = Date.now()

interface DbStatus {
  connected: boolean
  version: string | null
  responseMs: number | null
  migrated: boolean
  seeded: boolean
}

async function checkDatabase(): Promise<DbStatus> {
  const status: DbStatus = {
    connected: false,
    version: null,
    responseMs: null,
    migrated: false,
    seeded: false,
  }

  const prisma = getPrisma()
  const t0 = Date.now()

  // Conectividade básica
  const rows = await prisma.$queryRaw<[{ version: string }]>`SELECT version()`
  status.connected = true
  status.version = rows[0]?.version ?? null
  status.responseMs = Date.now() - t0

  // Migrations aplicadas (pelo menos 1 concluída)
  try {
    const mig = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*)::bigint AS count
      FROM _prisma_migrations
      WHERE finished_at IS NOT NULL
    `
    status.migrated = Number(mig[0]?.count ?? 0) > 0
  } catch {
    // tabela ainda não existe — banco não migrado
  }

  // Seed aplicado: Sequencia 'exemplar' e Configuracao existem
  if (status.migrated) {
    const [seqRows, cfgRows] = await Promise.all([
      prisma.$queryRaw<Array<{ nome: string }>>`
        SELECT nome FROM "Sequencia" WHERE nome = 'exemplar'
      `,
      prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*)::bigint AS count FROM "Configuracao"
      `,
    ])
    status.seeded = seqRows.length > 0 && Number(cfgRows[0]?.count ?? 0) > 0
  }

  return status
}

export async function GET() {
  const environment = process.env.NODE_ENV ?? 'development'

  let database: DbStatus = {
    connected: false,
    version: null,
    responseMs: null,
    migrated: false,
    seeded: false,
  }

  try {
    database = await checkDatabase()
  } catch {
    // banco indisponível — status degradado
  }

  const ready = database.connected && database.migrated && database.seeded
  const status = ready
    ? 'ok'
    : database.connected
      ? 'degraded'
      : 'unavailable'

  return NextResponse.json(
    {
      status,
      version: pkg.version,
      environment,
      database,
      uptime: Math.floor((Date.now() - SERVER_START) / 1000),
      timestamp: new Date().toISOString(),
    },
    { status: ready ? 200 : 503 },
  )
}
