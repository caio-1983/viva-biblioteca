import { NextRequest, NextResponse } from 'next/server'
import { emprestimoService } from '@/src/services/emprestimo.service'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const emprestimos = await emprestimoService.buscarPorLeitor(Number(id))

    // Achata estrutura aninhada para manter contrato com o frontend
    const result = emprestimos.map((e) => ({
      id: e.id,
      dataEmprestimo: e.dataEmprestimo,
      dataPrevistaDevolucao: e.dataPrevistaDevolucao,
      dataDevolucao: e.dataDevolucao,
      status: e.status,
      titulo: e.acervo.titulo,
      autor: e.acervo.autor,
      numeroExemplar: e.acervo.numeroExemplar,
    }))

    return NextResponse.json(result)
  } catch (error) {
    console.error('Erro ao buscar empréstimos do usuário:', error)
    return NextResponse.json({ error: 'Erro ao buscar histórico' }, { status: 500 })
  }
}
