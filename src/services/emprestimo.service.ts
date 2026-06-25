import { emprestimoRepository } from '@/src/repositories/emprestimo.repository'
import { exemplarRepository } from '@/src/repositories/exemplar.repository'
import { configuracaoRepository } from '@/src/repositories/configuracao.repository'
import { EmprestimoCreate } from '@/src/types/emprestimo'

export class EmprestimoService {
  async registrar(data: EmprestimoCreate) {
    const config = await configuracaoRepository.get()

    const exemplar = await exemplarRepository.findById(data.acervoId)
    if (!exemplar || !exemplar.ativo) throw new Error('Exemplar não encontrado')
    if (exemplar.status !== 'DISPONIVEL') throw new Error('Exemplar não está disponível')

    const ativos = await emprestimoRepository.countAtivosByLeitorId(data.usuarioId)
    if (ativos >= config.maxEmprestimos) {
      throw new Error(
        `Usuário já possui o limite de ${config.maxEmprestimos} títulos emprestados simultaneamente`
      )
    }

    const emprestimo = await emprestimoRepository.create(data)
    await exemplarRepository.updateStatus(data.acervoId, 'EMPRESTADO')

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

  async buscarPorLeitor(leitorId: number) {
    return emprestimoRepository.findByLeitorId(leitorId)
  }
}

export const emprestimoService = new EmprestimoService()
