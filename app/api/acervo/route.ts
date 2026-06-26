import { NextRequest, NextResponse } from 'next/server'
import { exemplarService } from '@/src/services/exemplar.service'
import { ExemplarCreateSchema, ExemplarFilters } from '@/src/types/exemplar'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = ExemplarCreateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const exemplar = await exemplarService.criar(parsed.data)
    return NextResponse.json(exemplar, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao criar exemplar'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const filters: ExemplarFilters = {
      titulo: searchParams.get('titulo') || undefined,
      autor: searchParams.get('autor') || undefined,
      assunto: searchParams.get('assunto') || undefined,
      status: searchParams.get('status') || undefined,
    }
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)

    const result = await exemplarService.listar(filters, page, limit)
    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao listar exemplares'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
