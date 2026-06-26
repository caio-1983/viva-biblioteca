import { emprestimoRepository } from '@/src/repositories/emprestimo.repository'
import { exemplarRepository } from '@/src/repositories/exemplar.repository'
import { configuracaoRepository } from '@/src/repositories/configuracao.repository'
import { EmprestimoCreate } from '@/src/types/emprestimo'

export class EmprestimoService {
  async registrar(data: EmprestimoCreate) {
    const config = await configuracaoRepository.get()

    const exemplar = await exemplarRepository.findById(data.exemplarId)
    if (!exemplar || !exemplar.ativo) throw new Error('Exemplar não encontrado')
    if (exemplar.status !== 'DISPONIVEL') throw new Error('Exemplar não está disponível')

    const ativos = await emprestimoRepository.countAtivosByLeitorId(data.usuarioId)
    if (ativos >= config.maxEmprestimos) {
      throw new Error(
        `Usuário já possui o limite de ${config.maxEmprestimos} títulos emprestados simultaneamente`
      )
    }

    const emprestimo = await emprestimoRepository.create(data)
    await exemplarRepository.updateStatus(data.exemplarId, 'EMPRESTADO')

    return emprestimo
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

  async renovar(id: number) {
    const emprestimo = await emprestimoRepository.findById(id)
    if (!emprestimo) throw new Error('Empréstimo não encontrado')
    if (emprestimo.status === 'DEVOLVIDO') throw new Error('Empréstimo já devolvido')
    if (emprestimo.status === 'CANCELADO') throw new Error('Empréstimo cancelado')

    const config = await configuracaoRepository.get()
    const novaData = new Date(emprestimo.dataPrevistaDevolucao)
    novaData.setDate(novaData.getDate() + config.prazoEmprestimoDias)

    return emprestimoRepository.renovar(id, novaData)
  }

  async buscarPorLeitor(leitorId: number) {
    return emprestimoRepository.findByLeitorId(leitorId)
  }
}

export const emprestimoService = new EmprestimoService()
