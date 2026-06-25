import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const ConfiguracaoUpdateSchema = z.object({
  prazoEmprestimoDias: z.number().int().min(1).max(365).optional(),
  maxEmprestimos: z.number().int().min(1).max(99).optional(),
  pastaBackup: z.string().nullable().optional(),
  pastaExportacao: z.string().nullable().optional(),
})

async function getOrCreate() {
  const existing = await prisma.configuracao.findFirst()
  if (existing) return existing
  return prisma.configuracao.create({
    data: { prazoEmprestimoDias: 14, maxEmprestimos: 3 },
  })
}

export async function GET() {
  try {
    const config = await getOrCreate()
    return NextResponse.json(config)
  } catch (error) {
    console.error('Erro ao buscar configurações:', error)
    return NextResponse.json({ error: 'Erro ao buscar configurações' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = ConfiguracaoUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const config = await getOrCreate()
    const updated = await prisma.configuracao.update({
      where: { id: config.id },
      data: parsed.data,
    })
    return NextResponse.json(updated)
  } catch (error) {
    console.error('Erro ao salvar configurações:', error)
    return NextResponse.json({ error: 'Erro ao salvar configurações' }, { status: 500 })
  }
}
