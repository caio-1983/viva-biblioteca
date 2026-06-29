import { NextRequest, NextResponse } from 'next/server'
import { emprestimoService } from '@/src/services/emprestimo.service'
import { toEmprestimoListItemDTO } from '@/src/dto/emprestimo.dto'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params
    const id = parseInt(idStr, 10)
    if (isNaN(id)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })

    let dataVencimento: Date | undefined
    try {
      const body = await request.json()
      if (body?.dataPrevistaDevolucao) {
        dataVencimento = new Date(body.dataPrevistaDevolucao)
      }
    } catch { /* body vazio é ok */ }

    const emprestimo = await emprestimoService.renovar(id, dataVencimento)
    return NextResponse.json(toEmprestimoListItemDTO(emprestimo))
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao renovar empréstimo'
    const status = message.includes('não encontrado') ? 404
      : (message.includes('devolvido') || message.includes('cancelado')) ? 409
      : 500
    return NextResponse.json({ error: message }, { status })
  }
}
