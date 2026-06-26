import { exemplarRepository } from '@/src/repositories/exemplar.repository'
import { emprestimoRepository } from '@/src/repositories/emprestimo.repository'
import { leitorRepository } from '@/src/repositories/leitor.repository'
import { prisma } from '@/lib/prisma'

export class RelatorioService {
  async getDashboard() {
    const [
      acervoTotal,
      disponivel,
      emprestado,
      totalLeitores,
      emprestimosAtivos,
      emprestimosAtrasados,
      emprestimosTotal,
      porDia,
      atrasadosRaw,
      maisEmprestados,
      assuntos,
    ] = await Promise.all([
      exemplarRepository.countAll(),
      exemplarRepository.countByStatus('DISPONIVEL'),
      exemplarRepository.countByStatus('EMPRESTADO'),
      leitorRepository.countAtivos(),
      emprestimoRepository.countAtivos(),
      emprestimoRepository.countAtrasados(),
      emprestimoRepository.countTotal(),
      emprestimoRepository.findPorDia(90),
      emprestimoRepository.findAtrasados(20),
      emprestimoRepository.findMaisEmprestados(10),
      this.getAssuntos(8),
    ])

    const atrasados = atrasadosRaw.map((e) => ({
      titulo: e.exemplar.obra.titulo,
      codigoExemplar: e.exemplar.codigoExemplar,
      nomeCompleto: e.usuario.nomeCompleto,
      numeroCadastro: e.usuario.numeroCadastro,
      dataPrevistaDevolucao: e.dataPrevistaDevolucao,
      dataEmprestimo: e.dataEmprestimo,
      diasAtraso: Math.floor(
        (Date.now() - new Date(e.dataPrevistaDevolucao).getTime()) / (1000 * 60 * 60 * 24)
      ),
    }))

    return {
      acervo: { total: acervoTotal, disponivel, emprestado },
      usuarios: { total: totalLeitores },
      emprestimos: {
        ativos: emprestimosAtivos,
        emAtraso: emprestimosAtrasados,
        total: emprestimosTotal,
        porDia,
        atrasados,
        maisEmprestados,
      },
      assuntos,
    }
  }

  private async getAssuntos(limit: number) {
    const rows = await prisma.$queryRaw<Array<{ nome: string; total: number | bigint }>>`
      SELECT assunto1 AS nome, COUNT(*) AS total
      FROM Obra
      WHERE ativo = 1 AND assunto1 IS NOT NULL AND assunto1 != ''
      GROUP BY assunto1
      ORDER BY total DESC
      LIMIT ${limit}
    `
    return rows.map((r) => ({ nome: r.nome, total: Number(r.total) }))
  }

  async exportarAcervo() {
    const rows = await prisma.exemplar.findMany({
      where: { ativo: true },
      orderBy: { obra: { titulo: 'asc' } },
      include: { obra: true },
    })
    return rows.map((e) => ({
      'Cód. Exemplar': e.codigoExemplar,
      'Tipo': e.obra.tipoPublicacao,
      'ISBN': e.obra.isbn,
      'Classificação': e.obra.classificacao,
      'Título': e.obra.titulo,
      'Subtítulo': e.obra.subtitulo,
      'Autor': e.obra.autor,
      'Edição': e.obra.edicao,
      'Editora': e.obra.editora,
      'Ano Publicação': e.obra.anoPublicacao,
      'Assunto 1': e.obra.assunto1,
      'Assunto 2': e.obra.assunto2,
      'Assunto 3': e.obra.assunto3,
      'Coleção': e.obra.colecao,
      'Tombo': e.tombo,
      'Status': e.status,
    }))
  }

  async exportarLeitores() {
    const rows = await prisma.usuario.findMany({
      where: { ativo: true },
      orderBy: { nomeCompleto: 'asc' },
      select: {
        numeroCadastro: true, nomeCompleto: true,
        cpf: true, celular: true, email: true,
      },
    })
    return rows.map((u) => ({
      'Nº Cadastro': u.numeroCadastro,
      'Nome Completo': u.nomeCompleto,
      'CPF': u.cpf,
      'Celular': u.celular,
      'E-mail': u.email,
    }))
  }

  async exportarEmprestimos() {
    const rows = await prisma.emprestimo.findMany({
      include: {
        usuario: { select: { numeroCadastro: true, nomeCompleto: true } },
        exemplar: { include: { obra: { select: { titulo: true } } } },
      },
      orderBy: { dataEmprestimo: 'desc' },
    })
    return rows.map((e) => ({
      'ID': e.id,
      'Nº Cadastro': e.usuario.numeroCadastro,
      'Membro': e.usuario.nomeCompleto,
      'Cód. Exemplar': e.exemplar.codigoExemplar,
      'Título': e.exemplar.obra.titulo,
      'Data Empréstimo': e.dataEmprestimo,
      'Previsão Devolução': e.dataPrevistaDevolucao,
      'Data Devolução': e.dataDevolucao,
      'Status': e.status,
    }))
  }
}

export const relatorioService = new RelatorioService()
