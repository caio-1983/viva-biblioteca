import { acervoRepository } from '@/src/repositories/acervo.repository'
import { AcervoCreate, AcervoUpdate, AcervoFilters } from '@/src/types/acervo'

export class AcervoService {
  async createAcervo(data: AcervoCreate) {
    if (!data.titulo) {
      throw new Error('Título é obrigatório')
    }
    return acervoRepository.create(data)
  }

  async getAcervoById(id: number) {
    const acervo = await acervoRepository.findById(id)
    if (!acervo) {
      throw new Error('Exemplar não encontrado')
    }
    return acervo
  }

  async listAcervos(filters?: AcervoFilters, page = 1, limit = 20) {
    return acervoRepository.findMany(filters, page, limit)
  }

  async updateAcervo(id: number, data: AcervoUpdate) {
    const acervo = await acervoRepository.findById(id)
    if (!acervo) {
      throw new Error('Exemplar não encontrado')
    }
    return acervoRepository.update(id, data)
  }

  async deleteAcervo(id: number) {
    const acervo = await acervoRepository.findById(id)
    if (!acervo) {
      throw new Error('Exemplar não encontrado')
    }
    return acervoRepository.softDelete(id)
  }

  async getStats() {
    const total = await acervoRepository.countAll()
    const disponivel = await acervoRepository.countByStatus('DISPONIVEL')
    const emprestado = await acervoRepository.countByStatus('EMPRESTADO')
    const extraviado = await acervoRepository.countByStatus('EXTRAVIADO')
    const manutencao = await acervoRepository.countByStatus('MANUTENCAO')

    return { total, disponivel, emprestado, extraviado, manutencao }
  }
}

export const acervoService = new AcervoService()
