import { prisma } from '@/lib/prisma'

export class DevolucaoService {
  async registrar(emprestimoId: number, exemplarId: number) {
    return prisma.$transaction(async (tx) => {
      // Check-and-set atômico: atualiza SOMENTE se o empréstimo ainda está ATIVO.
      // Elimina a race condition de devolução dupla simultânea.
      const updated = await tx.emprestimo.updateMany({
        where: { id: emprestimoId, status: 'ATIVO' },
        data: { dataDevolucao: new Date(), status: 'DEVOLVIDO' },
      })
      if (updated.count === 0) {
        const emp = await tx.emprestimo.findUnique({ where: { id: emprestimoId } })
        if (!emp) throw new Error('Empréstimo não encontrado ou já devolvido')
        throw new Error('Empréstimo não está ativo')
      }

      await tx.exemplar.update({
        where: { id: exemplarId },
        data: { status: 'DISPONIVEL' },
      })

      return { success: true }
    })
  }
}

export const devolucaoService = new DevolucaoService()
