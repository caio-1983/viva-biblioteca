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

    // Calcula diasAtraso no serviço para evitar dependência de funções SQLite
    const atrasados = atrasadosRaw.map((e) => ({
      titulo: e.acervo.titulo,
      numeroExemplar: e.acervo.numeroExemplar,
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
      FROM Acervo
      WHERE ativo = 1 AND assunto1 IS NOT NULL AND assunto1 != ''
      GROUP BY assunto1
      ORDER BY total DESC
      LIMIT ${limit}
    `
    return rows.map((r) => ({ nome: r.nome, total: Number(r.total) }))
  }

  async exportarAcervo() {
    const rows = await prisma.acervo.findMany({
      where: { ativo: true },
      orderBy: { titulo: 'asc' },
      select: {
        numeroExemplar: true, tipoPublicacao: true, isbn: true,
        classificacao: true, titulo: true, subtitulo: true, autor: true,
        edicao: true, editora: true, assunto1: true, assunto2: true,
        assunto3: true, colecao: true, status: true,
      },
    })
    return rows.map((a) => ({
      'Nº Exemplar': a.numeroExemplar,
      'Tipo': a.tipoPublicacao,
      'ISBN': a.isbn,
      'Classificação': a.classificacao,
      'Título': a.titulo,
      'Subtítulo': a.subtitulo,
      'Autor': a.autor,
      'Edição': a.edicao,
      'Editora': a.editora,
      'Assunto 1': a.assunto1,
      'Assunto 2': a.assunto2,
      'Assunto 3': a.assunto3,
      'Coleção': a.colecao,
      'Status': a.status,
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
        acervo: { select: { numeroExemplar: true, titulo: true } },
      },
      orderBy: { dataEmprestimo: 'desc' },
    })
    return rows.map((e) => ({
      'ID': e.id,
      'Nº Cadastro': e.usuario.numeroCadastro,
      'Membro': e.usuario.nomeCompleto,
      'Nº Exemplar': e.acervo.numeroExemplar,
      'Título': e.acervo.titulo,
      'Data Empréstimo': e.dataEmprestimo,
      'Previsão Devolução': e.dataPrevistaDevolucao,
      'Data Devolução': e.dataDevolucao,
      'Status': e.status,
    }))
  }
}

export const relatorioService = new RelatorioService()
