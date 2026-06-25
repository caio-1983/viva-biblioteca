import { exemplarRepository } from '@/src/repositories/exemplar.repository'
import { ExemplarCreate, ExemplarUpdate, ExemplarFilters } from '@/src/types/exemplar'

export class ExemplarService {
  async criar(data: ExemplarCreate) {
    if (!data.titulo?.trim()) throw new Error('Título é obrigatório')
    return exemplarRepository.create(data)
  }

  async buscarPorId(id: number) {
    const exemplar = await exemplarRepository.findById(id)
    if (!exemplar) throw new Error('Exemplar não encontrado')
    return exemplar
  }

  async listar(filters?: ExemplarFilters, page = 1, limit = 20) {
    return exemplarRepository.findMany(filters, page, limit)
  }

  async listarTodos() {
    return exemplarRepository.findAll()
  }

  async atualizar(id: number, data: ExemplarUpdate) {
    await this.buscarPorId(id)
    return exemplarRepository.update(id, data)
  }

  async inativar(id: number) {
    await this.buscarPorId(id)
    return exemplarRepository.softDelete(id)
  }

  async getStats() {
    const [total, disponivel, emprestado, extraviado, manutencao] = await Promise.all([
      exemplarRepository.countAll(),
      exemplarRepository.countByStatus('DISPONIVEL'),
      exemplarRepository.countByStatus('EMPRESTADO'),
      exemplarRepository.countByStatus('EXTRAVIADO'),
      exemplarRepository.countByStatus('MANUTENCAO'),
    ])
    return { total, disponivel, emprestado, extraviado, manutencao }
  }

  async getProximaSequencia() {
    return exemplarRepository.getNextSequence()
  }
}

export const exemplarService = new ExemplarService()
