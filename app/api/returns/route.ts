import { NextRequest, NextResponse } from 'next/server'
import { emprestimoService } from '@/src/services/emprestimo.service'
import { devolucaoService } from '@/src/services/devolucao.service'
import { toEmprestimoAtivoDTO } from '@/src/dto/emprestimo.dto'

export async function GET(request: NextRequest) {
  const codigoExemplar = request.nextUrl.searchParams.get('exemplar')?.trim()

  if (!codigoExemplar) {
    return NextResponse.json({ error: 'Informe o código do exemplar' }, { status: 400 })
  }

  try {
    const emprestimo = await emprestimoService.buscarAtivoByCodigoExemplar(codigoExemplar)
    return NextResponse.json(toEmprestimoAtivoDTO(emprestimo))
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao buscar empréstimo'
    const isNotFound = message.includes('não encontrado')
    return NextResponse.json({ error: message }, { status: isNotFound ? 404 : 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { emprestimoId, exemplarId } = await request.json()

    if (!emprestimoId || !exemplarId) {
      return NextResponse.json(
        { error: 'emprestimoId e exemplarId são obrigatórios' },
        { status: 400 }
      )
    }

    const result = await devolucaoService.registrar(Number(emprestimoId), Number(exemplarId))
    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao registrar devolução'
    const isNotFound = message.includes('não encontrado')
    return NextResponse.json({ error: message }, { status: isNotFound ? 404 : 500 })
  }
}
