import { leitorRepository } from '@/src/repositories/leitor.repository'
import { LeitorCreate, LeitorUpdate } from '@/src/types/leitor'

export class LeitorService {
  async criar(data: LeitorCreate) {
    if (!data.nomeCompleto?.trim()) throw new Error('Nome completo é obrigatório')
    return leitorRepository.create(data)
  }

  async buscarPorId(id: number) {
    const leitor = await leitorRepository.findById(id)
    if (!leitor) throw new Error('Usuário não encontrado')
    return leitor
  }

  async listar() {
    return leitorRepository.findMany()
  }

  async atualizar(id: number, data: LeitorUpdate) {
    await this.buscarPorId(id)
    return leitorRepository.update(id, data)
  }

  async inativar(id: number) {
    await this.buscarPorId(id)
    return leitorRepository.softDelete(id)
  }
}

export const leitorService = new LeitorService()
