import { NextRequest, NextResponse } from 'next/server'
import { emprestimoService } from '@/src/services/emprestimo.service'

export async function GET() {
  try {
    const emprestimos = await emprestimoService.listar()
    // Achata a estrutura aninhada do Prisma para o formato esperado pelo frontend
    const result = emprestimos.map((e) => ({
      id: e.id,
      dataEmprestimo: e.dataEmprestimo,
      dataPrevistaDevolucao: e.dataPrevistaDevolucao,
      dataDevolucao: e.dataDevolucao,
      status: e.status,
      nomeCompleto: e.usuario.nomeCompleto,
      numeroCadastro: e.usuario.numeroCadastro,
      titulo: e.acervo.titulo,
      numeroExemplar: e.acervo.numeroExemplar,
    }))
    return NextResponse.json(result)
  } catch (error) {
    console.error('Erro ao buscar empréstimos:', error)
    return NextResponse.json({ error: 'Erro ao buscar empréstimos' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { usuarioId, acervoId, dataEmprestimo, dataPrevistaDevolucao } = body

    if (!usuarioId || !acervoId || !dataPrevistaDevolucao) {
      return NextResponse.json(
        { error: 'usuarioId, acervoId e dataPrevistaDevolucao são obrigatórios' },
        { status: 400 }
      )
    }

    const emprestimo = await emprestimoService.registrar({
      usuarioId: Number(usuarioId),
      acervoId: Number(acervoId),
      dataEmprestimo: dataEmprestimo ? new Date(dataEmprestimo) : undefined,
      dataPrevistaDevolucao: new Date(dataPrevistaDevolucao),
    })

    return NextResponse.json(emprestimo, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao registrar empréstimo'
    const isConflict = message.includes('limite') || message.includes('disponível')
    return NextResponse.json({ error: message }, { status: isConflict ? 409 : 500 })
  }
}
