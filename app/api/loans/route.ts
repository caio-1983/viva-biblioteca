import { NextRequest, NextResponse } from 'next/server'
import { emprestimoService } from '@/src/services/emprestimo.service'
import { EmprestimoCreateSchema } from '@/src/types/emprestimo'
import { toEmprestimoListItemDTO } from '@/src/dto/emprestimo.dto'

export async function GET() {
  try {
    const emprestimos = await emprestimoService.listar()
    return NextResponse.json(emprestimos.map(toEmprestimoListItemDTO))
  } catch (error) {
    console.error('Erro ao buscar empréstimos:', error)
    return NextResponse.json({ error: 'Erro ao buscar empréstimos' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = EmprestimoCreateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const emprestimo = await emprestimoService.registrar(parsed.data)
    return NextResponse.json(emprestimo, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao registrar empréstimo'
    const isConflict = message.includes('limite') || message.includes('disponível')
    return NextResponse.json({ error: message }, { status: isConflict ? 409 : 500 })
  }
}
