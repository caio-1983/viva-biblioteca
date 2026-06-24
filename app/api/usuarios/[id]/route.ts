import { getPrisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const prisma = getPrisma()
    const usuario = await prisma.usuario.findUnique({
      where: { id: parseInt(id) },
    })

    if (!usuario) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(usuario)
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao buscar usuário' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const prisma = getPrisma()
    const data = await request.json()

    if (!data.nomeCompleto?.trim()) {
      return NextResponse.json(
        { error: 'Nome completo é obrigatório' },
        { status: 400 }
      )
    }

    const usuario = await prisma.usuario.update({
      where: { id: parseInt(id) },
      data: {
        nomeCompleto: data.nomeCompleto.trim(),
        cpf: data.cpf?.trim() || null,
        dataNascimento: data.dataNascimento ? new Date(data.dataNascimento) : null,
        celular: data.celular?.trim() || null,
        email: data.email?.trim() || null,
        membro: data.membro !== false,
      },
    })

    return NextResponse.json(usuario)
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'CPF já cadastrado' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Erro ao atualizar usuário' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const prisma = getPrisma()
    await prisma.usuario.update({
      where: { id: parseInt(id) },
      data: { ativo: false },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: 'Erro ao deletar usuário' },
      { status: 500 }
    )
  }
}
