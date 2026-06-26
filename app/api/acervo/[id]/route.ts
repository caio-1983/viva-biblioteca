import { NextRequest, NextResponse } from 'next/server'
import { exemplarService } from '@/src/services/exemplar.service'
import { ExemplarUpdateSchema } from '@/src/types/exemplar'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params
    const id = parseInt(idStr, 10)
    if (isNaN(id)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })

    const exemplar = await exemplarService.buscarPorId(id)
    return NextResponse.json(exemplar)
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
    if (isNaN(id)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })

    const body = await request.json()
    const parsed = ExemplarUpdateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const exemplar = await exemplarService.atualizar(id, parsed.data)
    return NextResponse.json(exemplar)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao atualizar exemplar'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params
    const id = parseInt(idStr, 10)
    if (isNaN(id)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })

    await exemplarService.inativar(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao deletar exemplar'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
