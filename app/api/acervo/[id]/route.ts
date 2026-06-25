import { NextRequest, NextResponse } from 'next/server'
import { acervoService } from '@/src/services/acervo.service'
import { validateAcervoUpdate } from '@/src/validators/acervo'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params
    const id = parseInt(idStr, 10)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const acervo = await acervoService.getAcervoById(id)
    return NextResponse.json(acervo)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao obter exemplar'
    return NextResponse.json({ error: message }, { status: 404 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params
    const id = parseInt(idStr, 10)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const body = await request.json()
    const validation = validateAcervoUpdate(body)

    if (!validation.valid || !validation.data) {
      return NextResponse.json({ error: 'Dados inválidos', details: validation.errors }, { status: 400 })
    }

    const acervo = await acervoService.updateAcervo(id, validation.data)
    return NextResponse.json(acervo)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao atualizar exemplar'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params
    const id = parseInt(idStr, 10)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    await acervoService.deleteAcervo(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao deletar exemplar'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
