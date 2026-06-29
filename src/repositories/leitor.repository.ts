import { prisma } from '@/lib/prisma'
import { LeitorCreate, LeitorUpdate } from '@/src/types/leitor'

export class LeitorRepository {
  async create(data: LeitorCreate) {
    return prisma.$transaction(async (tx) => {
      // Incremento atômico via upsert na tabela Sequencia (idêntico ao codigoExemplar).
      // INSERT ... ON CONFLICT DO UPDATE no PostgreSQL é atômico — elimina race condition.
      // Na ausência da linha 'usuario', inicializa em 1 (fresh deploy).
      // Para ambientes com usuários pré-existentes, executar: npm run seed:usuario-seq
      const seq = await tx.sequencia.upsert({
        where: { nome: 'usuario' },
        update: { valor: { increment: 1 } },
        create: { nome: 'usuario', valor: 1 },
      })
      const numeroCadastro = `US${String(seq.valor).padStart(6, '0')}`

      return tx.usuario.create({
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
}

export const leitorRepository = new LeitorRepository()
