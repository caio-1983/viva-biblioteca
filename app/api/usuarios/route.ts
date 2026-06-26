import { NextRequest, NextResponse } from 'next/server'
import { leitorService } from '@/src/services/leitor.service'

export async function GET() {
  try {
    const leitores = await leitorService.listar()
    return NextResponse.json(leitores)
  } catch (error) {
    console.error('[GET /api/usuarios]', error)
    return NextResponse.json({ error: 'Erro ao listar usuários' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const leitor = await leitorService.criar({
      nomeCompleto: data.nomeCompleto,
      cpf: data.cpf,
      dataNascimento: data.dataNascimento ? new Date(data.dataNascimento) : null,
      celular: data.celular,
      email: data.email,
      membro: data.membro !== false,
    })
    return NextResponse.json(leitor, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao criar usuário'
    if (message.includes('obrigatório')) {
      return NextResponse.json({ error: message }, { status: 400 })
    }
    // P2002 — unique constraint (CPF)
    if ((error as { code?: string }).code === 'P2002') {
      return NextResponse.json({ error: 'CPF já cadastrado' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Erro ao criar usuário' }, { status: 500 })
  }
}
