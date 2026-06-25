import { NextRequest, NextResponse } from 'next/server'
import { emprestimoService } from '@/src/services/emprestimo.service'
import { devolucaoService } from '@/src/services/devolucao.service'

export async function GET(request: NextRequest) {
  const codigoExemplar = request.nextUrl.searchParams.get('exemplar')?.trim()

  if (!codigoExemplar) {
    return NextResponse.json({ error: 'Informe o número do exemplar' }, { status: 400 })
  }

  try {
    const emprestimo = await emprestimoService.buscarAtivoByCodigoExemplar(codigoExemplar)

    // Retorna estrutura plana para compatibilidade com returns-form.tsx
    return NextResponse.json({
      emprestimoId: emprestimo.id,
      dataEmprestimo: emprestimo.dataEmprestimo,
      dataPrevistaDevolucao: emprestimo.dataPrevistaDevolucao,
      statusEmprestimo: emprestimo.status,
      acervoId: emprestimo.acervo?.id,
      numeroExemplar: emprestimo.acervo?.numeroExemplar,
      titulo: emprestimo.acervo?.titulo,
      usuarioId: emprestimo.usuario?.id,
      nomeCompleto: emprestimo.usuario?.nomeCompleto,
      numeroCadastro: emprestimo.usuario?.numeroCadastro,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao buscar empréstimo'
    const isNotFound = message.includes('não encontrado')
    return NextResponse.json({ error: message }, { status: isNotFound ? 404 : 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { emprestimoId, acervoId } = await request.json()

    if (!emprestimoId || !acervoId) {
      return NextResponse.json(
        { error: 'emprestimoId e acervoId são obrigatórios' },
        { status: 400 }
      )
    }

    const result = await devolucaoService.registrar(Number(emprestimoId), Number(acervoId))
    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao registrar devolução'
    const isNotFound = message.includes('não encontrado')
    return NextResponse.json({ error: message }, { status: isNotFound ? 404 : 500 })
  }
}
