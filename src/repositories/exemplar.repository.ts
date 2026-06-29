import { StatusExemplar } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { ExemplarCreate, ExemplarUpdate, ExemplarFilters } from '@/src/types/exemplar'
import { ExemplarComObra, ExemplarListItemDTO, ExemplarDetailDTO, toExemplarListItemDTO, toExemplarDetailDTO } from '@/src/dto/exemplar.dto'

const INCLUDE_OBRA = { obra: true } as const

export class ExemplarRepository {
  async create(data: ExemplarCreate): Promise<ExemplarComObra> {
    return prisma.$transaction(async (tx) => {
      // TODO: implementar deduplicação completa de Obra (ADR-001/002):
      //   - Estratégia ISBN: buscar Obra existente por ISBN normalizado antes de criar
      //   - Estratégia COMPOSTA: buscar por (titulo, autor, editora, edicao) normalizados
      //   - Estratégia INDIVIDUAL: criar sempre uma Obra nova (comportamento atual)
      // Por ora, cada cadastro cria uma Obra nova sem verificação de duplicata.
      const obra = await tx.obra.create({
        data: {
          isbn: data.isbn ?? null,
          tipoPublicacao: data.tipoPublicacao ?? null,
          classificacao: data.classificacao ?? null,
          cutter: data.cutter ?? null,
          titulo: data.titulo,
          subtitulo: data.subtitulo ?? null,
          autor: data.autor ?? null,
          edicao: data.edicao ?? null,
          editora: data.editora ?? null,
          anoPublicacao: data.anoPublicacao ?? null,
          assunto1: data.assunto1 ?? null,
          assunto2: data.assunto2 ?? null,
          assunto3: data.assunto3 ?? null,
          colecao: data.colecao ?? null,
        },
      })

      // Incremento atômico da Sequencia para gerar codigoExemplar único
      const seq = await tx.sequencia.update({
        where: { nome: 'exemplar' },
        data: { valor: { increment: 1 } },
      })
      const codigoExemplar = `EX${String(seq.valor).padStart(6, '0')}`

      return tx.exemplar.create({
        data: {
          obraId: obra.id,
          codigoExemplar,
          tombo: data.tombo ?? null,
          observacao: data.observacao ?? null,
          status: 'DISPONIVEL',
          ativo: true,
        },
        include: INCLUDE_OBRA,
      })
    })
  }

  async findById(id: number): Promise<ExemplarComObra | null> {
    return prisma.exemplar.findUnique({ where: { id }, include: INCLUDE_OBRA })
  }

  async findByCodigoExemplar(codigo: string): Promise<ExemplarComObra | null> {
    return prisma.exemplar.findUnique({ where: { codigoExemplar: codigo }, include: INCLUDE_OBRA })
  }

  async findByTombo(tombo: string): Promise<ExemplarComObra | null> {
    return prisma.exemplar.findFirst({ where: { tombo }, include: INCLUDE_OBRA })
  }

  async findMany(
    filters?: ExemplarFilters,
    page = 1,
    limit = 20,
  ): Promise<{ data: ExemplarDetailDTO[]; total: number; pages: number }> {
    const skip = (page - 1) * limit
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { ativo: filters?.ativo !== false }

    if (filters?.titulo) where.obra = { ...where.obra, titulo: { contains: filters.titulo, mode: 'insensitive' } }
    if (filters?.autor)  where.obra = { ...where.obra, autor:  { contains: filters.autor,  mode: 'insensitive' } }
    if (filters?.assunto) {
      where.obra = {
        ...where.obra,
        OR: [
          { assunto1: { contains: filters.assunto, mode: 'insensitive' } },
          { assunto2: { contains: filters.assunto, mode: 'insensitive' } },
          { assunto3: { contains: filters.assunto, mode: 'insensitive' } },
        ],
      }
    }
    if (filters?.status) where.status = filters.status

    const [rows, total] = await Promise.all([
      prisma.exemplar.findMany({ where, skip, take: limit, orderBy: { obra: { titulo: 'asc' } }, include: INCLUDE_OBRA }),
      prisma.exemplar.count({ where }),
    ])

    return { data: rows.map(toExemplarDetailDTO), total, pages: Math.ceil(total / limit) }
  }

  async findAll(): Promise<ExemplarListItemDTO[]> {
    const rows = await prisma.exemplar.findMany({
      where: { ativo: true },
      orderBy: { obra: { titulo: 'asc' } },
      include: INCLUDE_OBRA,
    })
    return rows.map(toExemplarListItemDTO)
  }

  async update(id: number, data: ExemplarUpdate): Promise<ExemplarComObra> {
    const exemplar = await prisma.exemplar.findUniqueOrThrow({ where: { id } })

    const { tombo, observacao, status, ativo, codigoBarras, localizacao, estadoFisico, ...obraFields } = data
    const { anoPublicacao, tipoPublicacao, isbn, classificacao, titulo, subtitulo,
            autor, edicao, editora, assunto1, assunto2, assunto3, colecao } = obraFields

    await prisma.$transaction(async (tx) => {
      if (Object.keys(obraFields).length > 0) {
        await tx.obra.update({
          where: { id: exemplar.obraId },
          data: {
            ...(isbn !== undefined           && { isbn }),
            ...(tipoPublicacao !== undefined && { tipoPublicacao }),
            ...(classificacao !== undefined  && { classificacao }),
            ...(titulo !== undefined         && { titulo }),
            ...(subtitulo !== undefined      && { subtitulo }),
            ...(autor !== undefined          && { autor }),
            ...(edicao !== undefined         && { edicao }),
            ...(editora !== undefined        && { editora }),
            ...(anoPublicacao !== undefined  && { anoPublicacao }),
            ...(assunto1 !== undefined       && { assunto1 }),
            ...(assunto2 !== undefined       && { assunto2 }),
            ...(assunto3 !== undefined       && { assunto3 }),
            ...(colecao !== undefined        && { colecao }),
          },
        })
      }
      await tx.exemplar.update({
        where: { id },
        data: {
          ...(tombo !== undefined        && { tombo }),
          ...(observacao !== undefined   && { observacao }),
          ...(status !== undefined       && { status }),
          ...(ativo !== undefined        && { ativo }),
          ...(codigoBarras !== undefined && { codigoBarras }),
          ...(localizacao !== undefined  && { localizacao }),
          ...(estadoFisico !== undefined && { estadoFisico }),
        },
      })
    })

    return prisma.exemplar.findUniqueOrThrow({ where: { id }, include: INCLUDE_OBRA })
  }

  async updateStatus(id: number, status: StatusExemplar): Promise<void> {
    await prisma.exemplar.update({ where: { id }, data: { status } })
  }

  async softDelete(id: number): Promise<void> {
    await prisma.exemplar.update({ where: { id }, data: { ativo: false } })
  }

  async countAll(): Promise<number> {
    return prisma.exemplar.count({ where: { ativo: true } })
  }

  async countByStatus(status: StatusExemplar): Promise<number> {
    return prisma.exemplar.count({ where: { status, ativo: true } })
  }

  async getNextSequence(): Promise<number> {
    const seq = await prisma.sequencia.findUnique({ where: { nome: 'exemplar' } })
    return (seq?.valor ?? 0) + 1
  }
}

export const exemplarRepository = new ExemplarRepository()
