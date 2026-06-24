import { prisma } from '@/lib/prisma'
import { AcervoCreate, AcervoUpdate, AcervoFilters } from '@/src/types/acervo'

export class AcervoRepository {
  async create(data: AcervoCreate) {
    return prisma.acervo.create({
      data: {
        ...data,
        numeroExemplar: await this.generateNumeroExemplar(),
        status: 'DISPONIVEL',
        ativo: true,
      },
    })
  }

  async createMany(items: AcervoCreate[]) {
    return prisma.acervo.createMany({
      data: items.map((item) => ({
        ...item,
        numeroExemplar: '',
        status: 'DISPONIVEL' as const,
        ativo: true,
      })),
    })
  }

  async findById(id: number) {
    return prisma.acervo.findUnique({
      where: { id },
    })
  }

  async findByNumeroExemplar(numeroExemplar: string) {
    return prisma.acervo.findUnique({
      where: { numeroExemplar },
    })
  }

  async findByTombo(tombo: string) {
    return prisma.acervo.findFirst({
      where: { tombo },
    })
  }

  async findMany(filters?: AcervoFilters, page = 1, limit = 20) {
    const skip = (page - 1) * limit
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { ativo: filters?.ativo !== false }

    if (filters?.titulo) {
      where.titulo = { contains: filters.titulo, mode: 'insensitive' }
    }
    if (filters?.autor) {
      where.autor = { contains: filters.autor, mode: 'insensitive' }
    }
    if (filters?.assunto) {
      where.OR = [
        { assunto1: { contains: filters.assunto, mode: 'insensitive' } },
        { assunto2: { contains: filters.assunto, mode: 'insensitive' } },
        { assunto3: { contains: filters.assunto, mode: 'insensitive' } },
      ]
    }
    if (filters?.status) {
      where.status = filters.status
    }

    const [data, total] = await Promise.all([
      prisma.acervo.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.acervo.count({ where }),
    ])

    return { data, total, pages: Math.ceil(total / limit) }
  }

  async update(id: number, data: AcervoUpdate) {
    return prisma.acervo.update({
      where: { id },
      data,
    })
  }

  async softDelete(id: number) {
    return prisma.acervo.update({
      where: { id },
      data: { ativo: false },
    })
  }

  async hardDelete(id: number) {
    return prisma.acervo.delete({
      where: { id },
    })
  }

  private async generateNumeroExemplar(): Promise<string> {
    const lastAcervo = await prisma.acervo.findFirst({
      orderBy: { id: 'desc' },
      select: { id: true },
    })

    const nextId = (lastAcervo?.id ?? 0) + 1
    return `EX${String(nextId).padStart(6, '0')}`
  }

  async countAll() {
    return prisma.acervo.count({ where: { ativo: true } })
  }

  async countByStatus(status: string) {
    return prisma.acervo.count({
      where: { status, ativo: true },
    })
  }
}

export const acervoRepository = new AcervoRepository()
