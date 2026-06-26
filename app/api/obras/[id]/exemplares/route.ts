import { NextRequest, NextResponse } from 'next/server'
import { obraService } from '@/src/services/obra.service'
import { ExemplarParaObraSchema } from '@/src/types/obra'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params
    const obraId = parseInt(idStr, 10)
    if (isNaN(obraId)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })

    const body = await request.json()
    const parsed = ExemplarParaObraSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const exemplar = await obraService.adicionarExemplar(obraId, parsed.data)
    return NextResponse.json(exemplar, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao adicionar exemplar'
    return NextResponse.json({ error: message }, { status: message.includes('não encontrada') ? 404 : 500 })
  }
}
