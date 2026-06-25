import { NextRequest, NextResponse } from 'next/server'
import { leitorService } from '@/src/services/leitor.service'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const leitor = await leitorService.buscarPorId(Number(id))
    return NextResponse.json(leitor)
  } catch (error) {
    const message = error instanceof Error ? error.message : ''
    return NextResponse.json(
      { error: message || 'Erro ao buscar usuário' },
      { status: message.includes('não encontrado') ? 404 : 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await request.json()
    const leitor = await leitorService.atualizar(Number(id), {
      nomeCompleto: data.nomeCompleto,
      cpf: data.cpf,
      dataNascimento: data.dataNascimento ? new Date(data.dataNascimento) : null,
      celular: data.celular,
      email: data.email,
      membro: data.membro,
    })
    return NextResponse.json(leitor)
  } catch (error) {
    const message = error instanceof Error ? error.message : ''
    if ((error as { code?: string }).code === 'P2002') {
      return NextResponse.json({ error: 'CPF já cadastrado' }, { status: 400 })
    }
    return NextResponse.json(
      { error: message || 'Erro ao atualizar usuário' },
      { status: message.includes('não encontrado') ? 404 : 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await leitorService.inativar(Number(id))
    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : ''
    return NextResponse.json(
      { error: message || 'Erro ao deletar usuário' },
      { status: message.includes('não encontrado') ? 404 : 500 }
    )
  }
}
