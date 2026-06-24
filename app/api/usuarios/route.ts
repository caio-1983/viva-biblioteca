import { getPrisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const prisma = getPrisma()
    const usuarios = await prisma.usuario.findMany({
      where: { ativo: true },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { emprestimos: true } },
      },
    })
    return NextResponse.json(usuarios)
  } catch (error: any) {
    console.error('[GET /api/usuarios]', error?.message)
    return NextResponse.json({ error: 'Erro ao listar usuários' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const prisma = getPrisma()

    // Validar nome completo (obrigatório)
    if (!data.nomeCompleto?.trim()) {
      return NextResponse.json(
        { error: 'Nome completo é obrigatório' },
        { status: 400 }
      )
    }

    // Gerar número de cadastro único (US000001, US000002, etc)
    const lastUsuario = await prisma.usuario.findFirst({
      orderBy: { createdAt: 'desc' },
    })
    const nextNumber = (lastUsuario ? parseInt(lastUsuario.numeroCadastro.slice(2)) : 0) + 1
    const numeroCadastro = `US${String(nextNumber).padStart(6, '0')}`

    const usuario = await prisma.usuario.create({
      data: {
        numeroCadastro,
        nomeCompleto: data.nomeCompleto.trim(),
        cpf: data.cpf?.trim() || null,
        dataNascimento: data.dataNascimento ? new Date(data.dataNascimento) : null,
        celular: data.celular?.trim() || null,
        email: data.email?.trim() || null,
        membro: data.membro !== false,
        ativo: true,
      },
    })

    return NextResponse.json(usuario, { status: 201 })
  } catch (error: any) {
    console.error('POST /api/usuarios error:', error)
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'CPF já cadastrado' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Erro ao criar usuário' },
      { status: 500 }
    )
  }
}
