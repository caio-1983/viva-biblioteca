import { prisma } from '@/lib/prisma'
import { LeitorCreate, LeitorUpdate } from '@/src/types/leitor'

export class LeitorRepository {
  async create(data: LeitorCreate) {
    const numeroCadastro = await this.generateNumeroCadastro()
    return prisma.usuario.create({
      data: {
        numeroCadastro,
        nomeCompleto: data.nomeCompleto.trim(),
        cpf: data.cpf?.trim() || null,
        dataNascimento: data.dataNascimento ?? null,
        celular: data.celular?.trim() || null,
        email: data.email?.trim() || null,
        membro: data.membro !== false,
        ativo: true,
      },
    })
  }

  async findById(id: number) {
    return prisma.usuario.findUnique({ where: { id } })
  }

  async findMany() {
    return prisma.usuario.findMany({
      where: { ativo: true },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { emprestimos: true } } },
    })
  }

  async update(id: number, data: LeitorUpdate) {
    return prisma.usuario.update({
      where: { id },
      data: {
        nomeCompleto: data.nomeCompleto?.trim(),
        cpf: data.cpf?.trim() || null,
        dataNascimento: data.dataNascimento ?? null,
        celular: data.celular?.trim() || null,
        email: data.email?.trim() || null,
        membro: data.membro,
      },
    })
  }

  async softDelete(id: number) {
    return prisma.usuario.update({ where: { id }, data: { ativo: false } })
  }

  async countAtivos() {
    return prisma.usuario.count({ where: { ativo: true } })
  }

  private async generateNumeroCadastro(): Promise<string> {
    const last = await prisma.usuario.findFirst({ orderBy: { createdAt: 'desc' } })
    const next = last ? parseInt(last.numeroCadastro.slice(2), 10) + 1 : 1
    return `US${String(next).padStart(6, '0')}`
  }
}

export const leitorRepository = new LeitorRepository()
