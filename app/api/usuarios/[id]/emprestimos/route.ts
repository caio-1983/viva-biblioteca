import { NextRequest, NextResponse } from 'next/server'
import { emprestimoService } from '@/src/services/emprestimo.service'
import { toEmprestimoUsuarioDTO } from '@/src/dto/emprestimo.dto'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const emprestimos = await emprestimoService.buscarPorLeitor(Number(id))
    return NextResponse.json(emprestimos.map(toEmprestimoUsuarioDTO))
  } catch (error) {
    console.error('Erro ao buscar empréstimos do usuário:', error)
    return NextResponse.json({ error: 'Erro ao buscar histórico' }, { status: 500 })
  }
}
