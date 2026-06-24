import { NextRequest, NextResponse } from 'next/server'
import Database from 'better-sqlite3'
import path from 'path'

const DB_PATH = path.join(process.cwd(), 'storage', 'database', 'biblioteca.db')

export async function GET() {
  try {
    const db = new Database(DB_PATH, { readonly: true })

    const loans = db.prepare(`
      SELECT e.id, e.dataEmprestimo, e.dataPrevistaDevolucao, e.dataDevolucao, e.status,
             u.nomeCompleto, u.numeroCadastro,
             a.titulo, a.numeroExemplar
      FROM Emprestimo e
      JOIN Usuario u ON u.id = e.usuarioId
      JOIN Acervo a ON a.id = e.acervoId
      ORDER BY e.dataEmprestimo DESC
      LIMIT 100
    `).all()

    db.close()
    return NextResponse.json(loans)
  } catch (error) {
    console.error('Erro ao buscar empréstimos:', error)
    return NextResponse.json({ error: 'Erro ao buscar empréstimos' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { usuarioId, acervoId, dataEmprestimo, dataPrevistaDevolucao } = body

    if (!usuarioId || !acervoId || !dataPrevistaDevolucao) {
      return NextResponse.json(
        { error: 'usuarioId, acervoId e dataPrevistaDevolucao são obrigatórios' },
        { status: 400 }
      )
    }

    const db = new Database(DB_PATH)

    const usuario = db.prepare('SELECT id FROM Usuario WHERE id = ? AND ativo = 1').get(usuarioId)
    if (!usuario) {
      db.close()
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    const acervo = db.prepare("SELECT id, status FROM Acervo WHERE id = ? AND ativo = 1").get(acervoId) as { id: number; status: string } | undefined
    if (!acervo) {
      db.close()
      return NextResponse.json({ error: 'Exemplar não encontrado' }, { status: 404 })
    }
    if (acervo.status !== 'DISPONIVEL') {
      db.close()
      return NextResponse.json({ error: 'Exemplar não está disponível' }, { status: 409 })
    }

    const emprestimo = db.prepare(`
      INSERT INTO Emprestimo (usuarioId, acervoId, dataEmprestimo, dataPrevistaDevolucao, status, createdAt)
      VALUES (?, ?, ?, ?, 'ATIVO', datetime('now'))
    `).run(
      usuarioId,
      acervoId,
      dataEmprestimo || new Date().toISOString().split('T')[0],
      dataPrevistaDevolucao
    )

    db.prepare("UPDATE Acervo SET status = 'EMPRESTADO', updatedAt = datetime('now') WHERE id = ?").run(acervoId)

    const created = db.prepare('SELECT * FROM Emprestimo WHERE id = ?').get(emprestimo.lastInsertRowid)
    db.close()

    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    console.error('Erro ao registrar empréstimo:', error)
    return NextResponse.json({ error: 'Erro ao registrar empréstimo' }, { status: 500 })
  }
}
