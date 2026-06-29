import { prisma } from '@/lib/prisma'
import { emprestimoRepository } from '@/src/repositories/emprestimo.repository'
import { configuracaoRepository } from '@/src/repositories/configuracao.repository'
import { EmprestimoCreate } from '@/src/types/emprestimo'

export class EmprestimoService {
  async registrar(data: EmprestimoCreate) {
    const config = await configuracaoRepository.get()

    return prisma.$transaction(async (tx) => {
      const ativos = await tx.emprestimo.count({
        where: { usuarioId: data.usuarioId, status: 'ATIVO' },
      })
      if (ativos >= config.maxEmprestimos) {
        throw new Error(
          `Usuário já possui o limite de ${config.maxEmprestimos} títulos emprestados simultaneamente`
        )
      }

      // Check-and-set atômico: atualiza SOMENTE se o exemplar ainda está DISPONIVEL.
      // Elimina a race condition TOCTOU de verificar e depois atualizar separadamente.
      const updated = await tx.exemplar.updateMany({
        where: { id: data.exemplarId, status: 'DISPONIVEL', ativo: true },
        data: { status: 'EMPRESTADO' },
      })
      if (updated.count === 0) {
        const exemplar = await tx.exemplar.findUnique({ where: { id: data.exemplarId } })
        if (!exemplar || !exemplar.ativo) throw new Error('Exemplar não encontrado')
        throw new Error('Exemplar não está disponível')
      }

      return tx.emprestimo.create({
        data: {
          usuarioId: data.usuarioId,
          exemplarId: data.exemplarId,
          dataEmprestimo: data.dataEmprestimo ?? new Date(),
          dataPrevistaDevolucao: data.dataPrevistaDevolucao,
          status: 'ATIVO',
        },
      })
    })
  }

  async listar(page = 1, limit = 100) {
    return emprestimoRepository.findMany(page, limit)
  }

  async buscarAtivoByCodigoExemplar(codigoExemplar: string) {
    const emprestimo = await emprestimoRepository.findAtivoByCodigoExemplar(codigoExemplar)
    if (!emprestimo) throw new Error('Nenhum empréstimo ativo encontrado para este exemplar')
    return emprestimo
  }

  async buscarAtivoByTombo(tombo: string) {
    const emprestimo = await emprestimoRepository.findAtivoByTombo(tombo)
    if (!emprestimo) throw new Error('Nenhum empréstimo ativo encontrado para este tombo')
    return emprestimo
  }

  async buscarAtivoByCodigoBarras(codigoBarras: string) {
    const emprestimo = await emprestimoRepository.findAtivoByCodigoBarras(codigoBarras)
    if (!emprestimo) throw new Error('Nenhum empréstimo ativo encontrado para este código de barras')
    return emprestimo
  }

  async renovar(id: number, dataVencimento?: Date) {
    const emprestimo = await emprestimoRepository.findById(id)
    if (!emprestimo) throw new Error('Empréstimo não encontrado')
    if (emprestimo.status === 'DEVOLVIDO') throw new Error('Empréstimo já devolvido')
    if (emprestimo.status === 'CANCELADO') throw new Error('Empréstimo cancelado')

    let novaData: Date
    if (dataVencimento) {
      novaData = dataVencimento
    } else {
      const config = await configuracaoRepository.get()
      novaData = new Date(emprestimo.dataPrevistaDevolucao)
      novaData.setDate(novaData.getDate() + config.prazoEmprestimoDias)
    }

    return emprestimoRepository.renovar(id, novaData)
  }

  async buscarPorLeitor(leitorId: number) {
    return emprestimoRepository.findByLeitorId(leitorId)
  }
}

export const emprestimoService = new EmprestimoService()
