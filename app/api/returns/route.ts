import { NextRequest, NextResponse } from 'next/server'
import { emprestimoService } from '@/src/services/emprestimo.service'
import { devolucaoService } from '@/src/services/devolucao.service'
import { toEmprestimoAtivoDTO } from '@/src/dto/emprestimo.dto'

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams
  const codigoExemplar = sp.get('exemplar')?.trim()
  const tombo          = sp.get('tombo')?.trim()
  const codigoBarras   = sp.get('codigoBarras')?.trim()

  if (!codigoExemplar && !tombo && !codigoBarras) {
    return NextResponse.json({ error: 'Informe exemplar, tombo ou codigoBarras' }, { status: 400 })
  }

  try {
    let emprestimo

    if (codigoExemplar) {
      emprestimo = await emprestimoService.buscarAtivoByCodigoExemplar(codigoExemplar)
    } else if (tombo) {
      emprestimo = await emprestimoService.buscarAtivoByTombo(tombo)
    } else {
      emprestimo = await emprestimoService.buscarAtivoByCodigoBarras(codigoBarras!)
    }

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
