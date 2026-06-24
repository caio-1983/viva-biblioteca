import { NextRequest, NextResponse } from 'next/server'
import { acervoService } from '@/src/services/acervo.service'
import { validateAcervoCreate } from '@/src/validators/acervo'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = validateAcervoCreate(body)

    if (!validation.valid || !validation.data) {
      return NextResponse.json({ error: validation.errors }, { status: 400 })
    }

    const acervo = await acervoService.createAcervo(validation.data)
    return NextResponse.json(acervo, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao criar exemplar'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const titulo = searchParams.get('titulo') || undefined
    const autor = searchParams.get('autor') || undefined
    const assunto = searchParams.get('assunto') || undefined
    const status = searchParams.get('status') || undefined
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)

    const result = await acervoService.listAcervos(
      { titulo, autor, assunto, status },
      page,
      limit
    )

    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao listar exemplares'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
