import { emprestimoRepository } from '@/src/repositories/emprestimo.repository'
import { exemplarRepository } from '@/src/repositories/exemplar.repository'

export class DevolucaoService {
  async registrar(emprestimoId: number, exemplarId: number) {
    const emprestimo = await emprestimoRepository.findById(emprestimoId)
    if (!emprestimo) throw new Error('Empréstimo não encontrado ou já devolvido')
    if (emprestimo.status !== 'ATIVO') throw new Error('Empréstimo não está ativo')

    await emprestimoRepository.devolver(emprestimoId)
    await exemplarRepository.updateStatus(exemplarId, 'DISPONIVEL')

    return { success: true }
  }
}

export const devolucaoService = new DevolucaoService()
