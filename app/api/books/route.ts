import { NextRequest, NextResponse } from 'next/server'
import { exemplarService } from '@/src/services/exemplar.service'

export async function GET() {
  try {
    const exemplares = await exemplarService.listarTodos()
    return NextResponse.json(exemplares)
  } catch (error) {
    console.error('Erro ao buscar livros:', error)
    return NextResponse.json({ error: 'Erro ao buscar livros' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.titulo || !String(body.titulo).trim()) {
      return NextResponse.json({ error: 'Título é obrigatório' }, { status: 400 })
    }

    const quantidade = Math.max(1, Math.min(99, Number(body.quantidade) || 1))
    const { quantidade: _qty, ...baseData } = body

    const created = []
    for (let i = 0; i < quantidade; i++) {
      const record = await exemplarService.criar({
        tipoPublicacao: baseData.tipoPublicacao || null,
        isbn: baseData.isbn || null,
        classificacao: baseData.classificacao || null,
        titulo: String(baseData.titulo).trim(),
        subtitulo: baseData.subtitulo || null,
        autor: baseData.autor || null,
        edicao: baseData.edicao || null,
        editora: baseData.editora || null,
        dataPublicacao: baseData.dataPublicacao ? new Date(baseData.dataPublicacao) : null,
        tombo: baseData.tombo || null,
        assunto1: baseData.assunto1 || null,
        assunto2: baseData.assunto2 || null,
        assunto3: baseData.assunto3 || null,
        colecao: baseData.colecao || null,
        observacao: baseData.observacao || null,
      })
      created.push(record)
    }

    return NextResponse.json(
      quantidade === 1 ? created[0] : { created, total: quantidade },
      { status: 201 }
    )
  } catch (error) {
    console.error('Erro ao cadastrar livro:', error)
    return NextResponse.json({ error: 'Erro ao cadastrar livro' }, { status: 500 })
  }
}
