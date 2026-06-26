import { NextRequest, NextResponse } from 'next/server'
import { obraService } from '@/src/services/obra.service'
import { ObraUpdateSchema } from '@/src/types/obra'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params
    const id = parseInt(idStr, 10)
    if (isNaN(id)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })

    const obra = await obraService.buscarPorId(id)
    return NextResponse.json(obra)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao buscar obra'
    return NextResponse.json({ error: message }, { status: message.includes('não encontrada') ? 404 : 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params
    const id = parseInt(idStr, 10)
    if (isNaN(id)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })

    const body = await request.json()
    const parsed = ObraUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const obra = await obraService.atualizar(id, parsed.data)
    return NextResponse.json(obra)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao atualizar obra'
    return NextResponse.json({ error: message }, { status: message.includes('não encontrada') ? 404 : 500 })
  }
}
