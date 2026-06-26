import { prisma } from '@/lib/prisma'
import { ObraComExemplares } from '@/src/dto/obra.dto'
import { ObraUpdate, ExemplarParaObra } from '@/src/types/obra'

const INCLUDE_EXEMPLARES = { exemplares: true } as const

export class ObraRepository {
  async findById(id: number): Promise<ObraComExemplares | null> {
    return prisma.obra.findFirst({
      where: { id, ativo: true },
      include: INCLUDE_EXEMPLARES,
    })
  }

  async update(id: number, data: ObraUpdate): Promise<ObraComExemplares> {
    await prisma.obra.update({ where: { id }, data })
    return prisma.obra.findUniqueOrThrow({ where: { id }, include: INCLUDE_EXEMPLARES })
  }

  async addExemplar(obraId: number, data: ExemplarParaObra) {
    return prisma.$transaction(async (tx) => {
      const seq = await tx.sequencia.update({
        where: { nome: 'exemplar' },
        data: { valor: { increment: 1 } },
      })
      const codigoExemplar = `EX${String(seq.valor).padStart(6, '0')}`

      return tx.exemplar.create({
        data: {
          obraId,
          codigoExemplar,
          tombo: data.tombo ?? null,
          codigoBarras: data.codigoBarras ?? null,
          localizacao: data.localizacao ?? null,
          estadoFisico: data.estadoFisico ?? null,
          observacao: data.observacao ?? null,
          origem: data.origem ?? null,
          dataAquisicao: data.dataAquisicao ?? null,
          valor: data.valor ?? null,
          status: 'DISPONIVEL',
          ativo: true,
        },
        include: { obra: true },
      })
    })
  }
}

export const obraRepository = new ObraRepository()
