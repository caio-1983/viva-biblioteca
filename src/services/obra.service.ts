import { obraRepository } from '@/src/repositories/obra.repository'
import { toObraDetailDTO } from '@/src/dto/obra.dto'
import { toExemplarDetailDTO } from '@/src/dto/exemplar.dto'
import { ObraUpdate, ExemplarParaObra } from '@/src/types/obra'

export class ObraService {
  async buscarPorId(id: number) {
    const obra = await obraRepository.findById(id)
    if (!obra) throw new Error('Obra não encontrada')
    return toObraDetailDTO(obra)
  }

  async atualizar(id: number, data: ObraUpdate) {
    const exists = await obraRepository.findById(id)
    if (!exists) throw new Error('Obra não encontrada')
    const updated = await obraRepository.update(id, data)
    return toObraDetailDTO(updated)
  }

  async adicionarExemplar(obraId: number, data: ExemplarParaObra) {
    const obra = await obraRepository.findById(obraId)
    if (!obra) throw new Error('Obra não encontrada')
    const exemplar = await obraRepository.addExemplar(obraId, data)
    return toExemplarDetailDTO(exemplar)
  }
}

export const obraService = new ObraService()
