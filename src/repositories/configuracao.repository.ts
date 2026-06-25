import { prisma } from '@/lib/prisma'

export class ConfiguracaoRepository {
  async get() {
    let config = await prisma.configuracao.findFirst()
    if (!config) {
      config = await prisma.configuracao.create({
        data: { prazoEmprestimoDias: 14, maxEmprestimos: 3 },
      })
    }
    return config
  }
}

export const configuracaoRepository = new ConfiguracaoRepository()
