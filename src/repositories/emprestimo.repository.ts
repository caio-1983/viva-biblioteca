import { prisma } from '@/lib/prisma'
import { EmprestimoCreate } from '@/src/types/emprestimo'

export class EmprestimoRepository {
  async create(data: EmprestimoCreate) {
    return prisma.emprestimo.create({
      data: {
        usuarioId: data.usuarioId,
        acervoId: data.acervoId,
        dataEmprestimo: data.dataEmprestimo ?? new Date(),
        dataPrevistaDevolucao: data.dataPrevistaDevolucao,
        status: 'ATIVO',
      },
    })
  }

  async findById(id: number) {
    return prisma.emprestimo.findUnique({
      where: { id },
      include: { usuario: true, acervo: true },
    })
  }

  async findAtivoByCodigoExemplar(codigoExemplar: string) {
    return prisma.emprestimo.findFirst({
      where: {
        status: 'ATIVO',
        acervo: { numeroExemplar: codigoExemplar },
      },
      include: { acervo: true, usuario: true },
    })
  }

  async findByLeitorId(leitorId: number) {
    return prisma.emprestimo.findMany({
      where: { usuarioId: leitorId },
      include: {
        acervo: {
          select: { titulo: true, autor: true, numeroExemplar: true },
        },
      },
      orderBy: { dataEmprestimo: 'desc' },
    })
  }

  async findMany(page = 1, limit = 100) {
    const skip = (page - 1) * limit
    return prisma.emprestimo.findMany({
      skip,
      take: limit,
      include: {
        usuario: { select: { nomeCompleto: true, numeroCadastro: true } },
        acervo: { select: { titulo: true, numeroExemplar: true } },
      },
      orderBy: { dataEmprestimo: 'desc' },
    })
  }

  async countAtivos() {
    return prisma.emprestimo.count({ where: { status: 'ATIVO' } })
  }

  async countAtrasados() {
    return prisma.emprestimo.count({
      where: { status: 'ATIVO', dataPrevistaDevolucao: { lt: new Date() } },
    })
  }

  async countTotal() {
    return prisma.emprestimo.count()
  }

  async countAtivosByLeitorId(leitorId: number) {
    return prisma.emprestimo.count({ where: { usuarioId: leitorId, status: 'ATIVO' } })
  }

  async devolver(id: number) {
    return prisma.emprestimo.update({
      where: { id },
      data: { dataDevolucao: new Date(), status: 'DEVOLVIDO' },
    })
  }

  async findAtrasados(limit = 20) {
    return prisma.emprestimo.findMany({
      where: { status: 'ATIVO', dataPrevistaDevolucao: { lt: new Date() } },
      include: {
        acervo: { select: { titulo: true, numeroExemplar: true } },
        usuario: { select: { nomeCompleto: true, numeroCadastro: true } },
      },
      orderBy: { dataPrevistaDevolucao: 'asc' },
      take: limit,
    })
  }

  async findMaisEmprestados(limit = 10) {
    // Prisma groupBy não suporta include — usamos queryRaw para o JOIN
    const rows = await prisma.$queryRaw<
      Array<{
        titulo: string
        autor: string | null
        numeroExemplar: string
        totalEmprestimos: number | bigint
      }>
    >`
      SELECT a.titulo, a.autor, a.numeroExemplar, COUNT(*) AS totalEmprestimos
      FROM Emprestimo e
      JOIN Acervo a ON a.id = e.acervoId
      GROUP BY e.acervoId
      ORDER BY totalEmprestimos DESC
      LIMIT ${limit}
    `
    return rows.map((r) => ({
      ...r,
      totalEmprestimos: Number(r.totalEmprestimos),
    }))
  }

  async findPorDia(days = 90) {
    const since = new Date()
    since.setDate(since.getDate() - days)
    const sinceStr = since.toISOString().split('T')[0]

    const rows = await prisma.$queryRaw<
      Array<{ data: string; total: number | bigint }>
    >`
      SELECT date(dataEmprestimo) AS data, COUNT(*) AS total
      FROM Emprestimo
      WHERE date(dataEmprestimo) >= ${sinceStr}
      GROUP BY date(dataEmprestimo)
      ORDER BY data ASC
    `
    return rows.map((r) => ({ data: r.data, total: Number(r.total) }))
  }
}

export const emprestimoRepository = new EmprestimoRepository()
