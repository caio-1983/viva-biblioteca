import { NextResponse } from 'next/server'
import Database from 'better-sqlite3'
import path from 'path'

const DB_PATH = path.join(process.cwd(), 'storage', 'database', 'biblioteca.db')

export async function GET() {
  try {
    const db = new Database(DB_PATH, { readonly: true })

    const acervo = db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'DISPONIVEL' THEN 1 ELSE 0 END) as disponivel,
        SUM(CASE WHEN status = 'EMPRESTADO' THEN 1 ELSE 0 END) as emprestado
      FROM Acervo WHERE ativo = 1
    `).get() as { total: number; disponivel: number; emprestado: number }

    const usuarios = db.prepare(`
      SELECT COUNT(*) as total FROM Usuario WHERE ativo = 1
    `).get() as { total: number }

    const emprestimosAtivos = db.prepare(`
      SELECT COUNT(*) as total FROM Emprestimo WHERE status = 'ATIVO'
    `).get() as { total: number }

    const emprestimosAtraso = db.prepare(`
      SELECT COUNT(*) as total FROM Emprestimo
      WHERE status = 'ATIVO' AND dataPrevistaDevolucao < datetime('now')
    `).get() as { total: number }

    const emprestimosTotal = db.prepare(`
      SELECT COUNT(*) as total FROM Emprestimo
    `).get() as { total: number }

    const porDia = db.prepare(`
      SELECT
        date(dataEmprestimo) as data,
        COUNT(*) as total
      FROM Emprestimo
      WHERE dataEmprestimo >= datetime('now', '-90 days')
      GROUP BY date(dataEmprestimo)
      ORDER BY data ASC
    `).all() as { data: string; total: number }[]

    const atrasados = db.prepare(`
      SELECT
        a.titulo,
        a.numeroExemplar,
        u.nomeCompleto,
        u.numeroCadastro,
        e.dataPrevistaDevolucao,
        e.dataEmprestimo,
        CAST((julianday('now') - julianday(e.dataPrevistaDevolucao)) AS INTEGER) as diasAtraso
      FROM Emprestimo e
      JOIN Acervo a ON a.id = e.acervoId
      JOIN Usuario u ON u.id = e.usuarioId
      WHERE e.status = 'ATIVO' AND e.dataPrevistaDevolucao < datetime('now')
      ORDER BY diasAtraso DESC
      LIMIT 20
    `).all()

    const maisEmprestados = db.prepare(`
      SELECT
        a.titulo,
        a.autor,
        a.numeroExemplar,
        COUNT(*) as totalEmprestimos
      FROM Emprestimo e
      JOIN Acervo a ON a.id = e.acervoId
      GROUP BY a.id
      ORDER BY totalEmprestimos DESC
      LIMIT 10
    `).all()

    const assuntos = db.prepare(`
      SELECT assunto1 as nome, COUNT(*) as total
      FROM Acervo
      WHERE ativo = 1 AND assunto1 IS NOT NULL AND assunto1 != ''
      GROUP BY assunto1
      ORDER BY total DESC
      LIMIT 8
    `).all() as { nome: string; total: number }[]

    db.close()

    return NextResponse.json({
      acervo,
      usuarios,
      emprestimos: {
        ativos: emprestimosAtivos.total,
        emAtraso: emprestimosAtraso.total,
        total: emprestimosTotal.total,
        porDia,
        atrasados,
        maisEmprestados,
      },
      assuntos,
    })
  } catch (error) {
    console.error('Erro ao buscar relatórios:', error)
    return NextResponse.json({ error: 'Erro ao buscar relatórios' }, { status: 500 })
  }
}
