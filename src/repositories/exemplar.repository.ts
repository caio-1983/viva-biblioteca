import { StatusExemplar } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { ExemplarCreate, ExemplarUpdate, ExemplarFilters } from '@/src/types/exemplar'

export class ExemplarRepository {
  async create(data: ExemplarCreate) {
    // Insere com código temporário, obtém o ID gerado e atualiza com o código definitivo.
    // Garante que codigoExemplar seja baseado no ID real e não em estimativas concorrentes.
    return prisma.$transaction(async (tx) => {
      const record = await tx.acervo.create({
        data: {
          ...data,
          numeroExemplar: 'TEMP',
          status: 'DISPONIVEL',
          ativo: true,
        },
      })
      const codigoExemplar = `EX${String(record.id).padStart(6, '0')}`
      return tx.acervo.update({
        where: { id: record.id },
        data: { numeroExemplar: codigoExemplar },
      })
    })
  }

  async findById(id: number) {
    return prisma.acervo.findUnique({ where: { id } })
  }

  async findByCodigoExemplar(codigo: string) {
    return prisma.acervo.findUnique({ where: { numeroExemplar: codigo } })
  }

  async findByTombo(tombo: string) {
    return prisma.acervo.findFirst({ where: { tombo } })
  }

  async findMany(filters?: ExemplarFilters, page = 1, limit = 20) {
    const skip = (page - 1) * limit
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { ativo: filters?.ativo !== false }

    if (filters?.titulo) where.titulo = { contains: filters.titulo }
    if (filters?.autor)  where.autor  = { contains: filters.autor }
    if (filters?.assunto) {
      where.OR = [
        { assunto1: { contains: filters.assunto } },
        { assunto2: { contains: filters.assunto } },
        { assunto3: { contains: filters.assunto } },
      ]
    }
    if (filters?.status) where.status = filters.status

    const [data, total] = await Promise.all([
      prisma.acervo.findMany({
        where,
        skip,
        take: limit,
        orderBy: { titulo: 'asc' },
      }),
      prisma.acervo.count({ where }),
    ])

    return { data, total, pages: Math.ceil(total / limit) }
  }

  async findAll() {
    return prisma.acervo.findMany({
      where: { ativo: true },
      orderBy: { titulo: 'asc' },
      select: {
        id: true,
        numeroExemplar: true,
        titulo: true,
        autor: true,
        assunto1: true,
        status: true,
      },
    })
  }

  async update(id: number, data: ExemplarUpdate) {
    return prisma.acervo.update({ where: { id }, data })
  }

  async updateStatus(id: number, status: StatusExemplar) {
    return prisma.acervo.update({ where: { id }, data: { status } })
  }

  async softDelete(id: number) {
    return prisma.acervo.update({ where: { id }, data: { ativo: false } })
  }

  async countAll() {
    return prisma.acervo.count({ where: { ativo: true } })
  }

  async countByStatus(status: StatusExemplar) {
    return prisma.acervo.count({ where: { status, ativo: true } })
  }

  async getNextSequence(): Promise<number> {
    const last = await prisma.acervo.findFirst({
      select: { id: true },
      orderBy: { id: 'desc' },
    })
    return (last?.id ?? 0) + 1
  }
}

export const exemplarRepository = new ExemplarRepository()
