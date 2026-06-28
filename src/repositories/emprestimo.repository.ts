import { prisma } from '@/lib/prisma'
import { EmprestimoCreate } from '@/src/types/emprestimo'
import { EmprestimoComRelacoes } from '@/src/dto/emprestimo.dto'

const INCLUDE_FULL = {
  usuario: true,
  exemplar: { include: { obra: true } },
} as const

export class EmprestimoRepository {
  async create(data: EmprestimoCreate) {
    return prisma.emprestimo.create({
      data: {
        usuarioId: data.usuarioId,
        exemplarId: data.exemplarId,
        dataEmprestimo: data.dataEmprestimo ?? new Date(),
        dataPrevistaDevolucao: data.dataPrevistaDevolucao,
        status: 'ATIVO',
      },
    })
  }

  async findById(id: number): Promise<EmprestimoComRelacoes | null> {
    return prisma.emprestimo.findUnique({ where: { id }, include: INCLUDE_FULL })
  }

  async findAtivoByCodigoExemplar(codigoExemplar: string): Promise<EmprestimoComRelacoes | null> {
    return prisma.emprestimo.findFirst({
      where: { status: 'ATIVO', exemplar: { codigoExemplar } },
      include: INCLUDE_FULL,
    })
  }

  async findAtivoByTombo(tombo: string): Promise<EmprestimoComRelacoes | null> {
    return prisma.emprestimo.findFirst({
      where: { status: 'ATIVO', exemplar: { tombo } },
      include: INCLUDE_FULL,
    })
  }

  async findAtivoByCodigoBarras(codigoBarras: string): Promise<EmprestimoComRelacoes | null> {
    return prisma.emprestimo.findFirst({
      where: { status: 'ATIVO', exemplar: { codigoBarras } },
      include: INCLUDE_FULL,
    })
  }

  async findByLeitorId(leitorId: number): Promise<EmprestimoComRelacoes[]> {
    return prisma.emprestimo.findMany({
      where: { usuarioId: leitorId },
      include: INCLUDE_FULL,
      orderBy: { dataEmprestimo: 'desc' },
    })
  }

  async findMany(page = 1, limit = 100): Promise<EmprestimoComRelacoes[]> {
    const skip = (page - 1) * limit
    return prisma.emprestimo.findMany({
      skip,
      take: limit,
      include: INCLUDE_FULL,
      orderBy: { dataEmprestimo: 'desc' },
    })
  }

  async countAtivos(): Promise<number> {
    return prisma.emprestimo.count({ where: { status: 'ATIVO' } })
  }

  async countAtrasados(): Promise<number> {
    return prisma.emprestimo.count({
      where: { status: 'ATIVO', dataPrevistaDevolucao: { lt: new Date() } },
    })
  }

  async countTotal(): Promise<number> {
    return prisma.emprestimo.count()
  }

  async countAtivosByLeitorId(leitorId: number): Promise<number> {
    return prisma.emprestimo.count({ where: { usuarioId: leitorId, status: 'ATIVO' } })
  }

  async devolver(id: number) {
    return prisma.emprestimo.update({
      where: { id },
      data: { dataDevolucao: new Date(), status: 'DEVOLVIDO' },
    })
  }

  async findAtrasados(limit = 20): Promise<EmprestimoComRelacoes[]> {
    return prisma.emprestimo.findMany({
      where: { status: 'ATIVO', dataPrevistaDevolucao: { lt: new Date() } },
      include: INCLUDE_FULL,
      orderBy: { dataPrevistaDevolucao: 'asc' },
      take: limit,
    })
  }

  async findMaisEmprestados(limit = 10) {
    const rows = await prisma.$queryRaw<
      Array<{
        titulo: string
        autor: string | null
        codigoExemplar: string
        totalEmprestimos: number | bigint
      }>
    >`
      SELECT o.titulo, o.autor, ex."codigoExemplar", COUNT(*) AS "totalEmprestimos"
      FROM "Emprestimo" e
      JOIN "Exemplar" ex ON ex.id = e."exemplarId"
      JOIN "Obra" o ON o.id = ex."obraId"
      GROUP BY ex."codigoExemplar", o.titulo, o.autor
      ORDER BY COUNT(*) DESC
      LIMIT ${limit}
    `
    return rows.map((r) => ({
      ...r,
      totalEmprestimos: Number(r.totalEmprestimos),
    }))
  }

  async renovar(id: number, novaData: Date) {
    return prisma.emprestimo.update({
      where: { id },
      data: { dataPrevistaDevolucao: novaData, status: 'ATIVO' },
      include: INCLUDE_FULL,
    })
  }

  async findPorDia(days = 90) {
    const since = new Date()
    since.setDate(since.getDate() - days)
    since.setHours(0, 0, 0, 0)

    const rows = await prisma.$queryRaw<
      Array<{ data: string; total: number | bigint }>
    >`
      SELECT TO_CHAR("dataEmprestimo", 'YYYY-MM-DD') AS data, COUNT(*) AS total
      FROM "Emprestimo"
      WHERE "dataEmprestimo" >= ${since}
      GROUP BY TO_CHAR("dataEmprestimo", 'YYYY-MM-DD')
      ORDER BY data ASC
    `
    return rows.map((r) => ({ data: r.data, total: Number(r.total) }))
  }
}

export const emprestimoRepository = new EmprestimoRepository()
