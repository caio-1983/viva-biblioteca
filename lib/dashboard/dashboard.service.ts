import { prisma } from '@/lib/prisma'
import { exemplarRepository } from '@/src/repositories/exemplar.repository'
import { emprestimoRepository } from '@/src/repositories/emprestimo.repository'
import { leitorRepository } from '@/src/repositories/leitor.repository'
import type {
  DashboardData,
  DashboardActivity,
  DashboardCategory,
  DashboardLoanChartPoint,
  DashboardOverdueLoan,
} from './dashboard.types'

class DashboardService {
  async getData(): Promise<DashboardData> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const [
      disponivel,
      emprestado,
      emAtraso,
      totalLeitores,
      atrasadosRaw,
      loanChart,
      categories,
      activities,
      emprestimosHoje,
    ] = await Promise.all([
      exemplarRepository.countByStatus('DISPONIVEL'),
      exemplarRepository.countByStatus('EMPRESTADO'),
      emprestimoRepository.countAtrasados(),
      leitorRepository.countAtivos(),
      emprestimoRepository.findAtrasados(5),
      this.getLoanChart(),
      this.getCategories(),
      this.getActivities(),
      prisma.emprestimo.count({
        where: {
          status: 'ATIVO',
          dataPrevistaDevolucao: { gte: today, lt: tomorrow },
        },
      }),
    ])

    const overdueLoans: DashboardOverdueLoan[] = atrasadosRaw.map((e) => ({
      titulo: e.exemplar.obra.titulo,
      nomeCompleto: e.usuario.nomeCompleto,
      diasAtraso: Math.max(
        1,
        Math.floor((Date.now() - new Date(e.dataPrevistaDevolucao).getTime()) / (1000 * 60 * 60 * 24))
      ),
    }))

    return {
      metrics: {
        livrosDisponiveis: disponivel,
        livrosEmprestados: emprestado,
        emAtraso,
        membrosCadastrados: totalLeitores,
      },
      loanChart,
      overdueLoans,
      categories,
      activities,
      todayPending: {
        emAtraso,
        reservasAguardando: null, // módulo de reservas não implementado
        emprestimosHoje,
      },
    }
  }

  private async getLoanChart(): Promise<DashboardLoanChartPoint[]> {
    return emprestimoRepository.findPorDia(90)
  }

  private async getCategories(): Promise<DashboardCategory[]> {
    const rows = await prisma.$queryRaw<Array<{ nome: string; total: number | bigint }>>`
      SELECT o.assunto1 AS nome, COUNT(*) AS total
      FROM "Emprestimo" e
      JOIN "Exemplar" ex ON ex.id = e."exemplarId"
      JOIN "Obra" o ON o.id = ex."obraId"
      WHERE o.assunto1 IS NOT NULL AND o.assunto1 != ''
      GROUP BY o.assunto1
      ORDER BY total DESC
      LIMIT 8
    `

    const data = rows.map((r) => ({ nome: r.nome, total: Number(r.total) }))
    const grandTotal = data.reduce((sum, r) => sum + r.total, 0)

    return data.map((r) => ({
      nome: r.nome,
      total: r.total,
      percentual: grandTotal > 0 ? Math.round((r.total / grandTotal) * 100) : 0,
    }))
  }

  private async getActivities(): Promise<DashboardActivity[]> {
    const [loans, returns, members, books] = await Promise.all([
      prisma.emprestimo.findMany({
        where: { status: 'ATIVO' },
        include: {
          usuario: { select: { nomeCompleto: true } },
          exemplar: { include: { obra: { select: { titulo: true } } } },
        },
        orderBy: { dataEmprestimo: 'desc' },
        take: 5,
      }),
      prisma.emprestimo.findMany({
        where: { status: 'DEVOLVIDO', dataDevolucao: { not: null } },
        include: {
          usuario: { select: { nomeCompleto: true } },
          exemplar: { include: { obra: { select: { titulo: true } } } },
        },
        orderBy: { dataDevolucao: 'desc' },
        take: 5,
      }),
      prisma.usuario.findMany({
        where: { ativo: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { nomeCompleto: true, createdAt: true },
      }),
      prisma.obra.findMany({
        where: { ativo: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { titulo: true, createdAt: true },
      }),
    ])

    const events: DashboardActivity[] = [
      ...loans.map((e) => ({
        type: 'loan' as const,
        title: 'Novo empréstimo',
        description: `${e.exemplar.obra.titulo} para ${e.usuario.nomeCompleto}`,
        timestamp: e.dataEmprestimo.toISOString(),
      })),
      ...returns.map((e) => ({
        type: 'return' as const,
        title: 'Devolução registrada',
        description: `${e.exemplar.obra.titulo} devolvido por ${e.usuario.nomeCompleto}`,
        timestamp: e.dataDevolucao!.toISOString(),
      })),
      ...members.map((u) => ({
        type: 'member' as const,
        title: 'Novo membro cadastrado',
        description: `${u.nomeCompleto} adicionado ao sistema`,
        timestamp: u.createdAt.toISOString(),
      })),
      ...books.map((o) => ({
        type: 'book' as const,
        title: 'Livro cadastrado',
        description: `${o.titulo} adicionado ao acervo`,
        timestamp: o.createdAt.toISOString(),
      })),
    ]

    return events
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10)
  }
}

export const dashboardService = new DashboardService()
