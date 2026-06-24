import { NextRequest, NextResponse } from 'next/server'
import Database from 'better-sqlite3'
import path from 'path'

const DB_PATH = path.join(process.cwd(), 'storage', 'database', 'biblioteca.db')

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const db = new Database(DB_PATH, { readonly: true })

    const emprestimos = db.prepare(`
      SELECT
        e.id,
        e.dataEmprestimo,
        e.dataPrevistaDevolucao,
        e.dataDevolucao,
        e.status,
        a.titulo,
        a.autor,
        a.numeroExemplar
      FROM Emprestimo e
      JOIN Acervo a ON a.id = e.acervoId
      WHERE e.usuarioId = ?
      ORDER BY e.dataEmprestimo DESC
    `).all(Number(id))

    db.close()
    return NextResponse.json(emprestimos)
  } catch (error) {
    console.error('Erro ao buscar empréstimos do usuário:', error)
    return NextResponse.json({ error: 'Erro ao buscar histórico' }, { status: 500 })
  }
}
