import { NextRequest, NextResponse } from 'next/server'
import Database from 'better-sqlite3'
import path from 'path'

const DB_PATH = path.join(process.cwd(), 'storage', 'database', 'biblioteca.db')

// GET /api/returns?exemplar=EX000001
export async function GET(request: NextRequest) {
  const exemplar = request.nextUrl.searchParams.get('exemplar')?.trim()

  if (!exemplar) {
    return NextResponse.json({ error: 'Informe o número do exemplar' }, { status: 400 })
  }

  try {
    const db = new Database(DB_PATH, { readonly: true })

    const row = db.prepare(`
      SELECT
        e.id              AS emprestimoId,
        e.dataEmprestimo,
        e.dataPrevistaDevolucao,
        e.status          AS statusEmprestimo,
        a.id              AS acervoId,
        a.numeroExemplar,
        a.titulo,
        u.id              AS usuarioId,
        u.nomeCompleto,
        u.numeroCadastro
      FROM Emprestimo e
      JOIN Acervo   a ON a.id = e.acervoId
      JOIN Usuario  u ON u.id = e.usuarioId
      WHERE a.numeroExemplar = ?
        AND e.status = 'ATIVO'
      LIMIT 1
    `).get(exemplar) as Record<string, unknown> | undefined

    db.close()

    if (!row) {
      return NextResponse.json({ error: 'Nenhum empréstimo ativo encontrado para este exemplar' }, { status: 404 })
    }

    return NextResponse.json(row)
  } catch (error) {
    console.error('Erro ao buscar empréstimo:', error)
    return NextResponse.json({ error: 'Erro ao buscar empréstimo' }, { status: 500 })
  }
}

// POST /api/returns  { emprestimoId, acervoId }
export async function POST(request: NextRequest) {
  try {
    const { emprestimoId, acervoId } = await request.json()

    if (!emprestimoId || !acervoId) {
      return NextResponse.json({ error: 'emprestimoId e acervoId são obrigatórios' }, { status: 400 })
    }

    const db = new Database(DB_PATH)

    const emprestimo = db.prepare(
      "SELECT id FROM Emprestimo WHERE id = ? AND status = 'ATIVO'"
    ).get(emprestimoId)

    if (!emprestimo) {
      db.close()
      return NextResponse.json({ error: 'Empréstimo não encontrado ou já devolvido' }, { status: 404 })
    }

    db.prepare(`
      UPDATE Emprestimo
      SET dataDevolucao = datetime('now'), status = 'DEVOLVIDO'
      WHERE id = ?
    `).run(emprestimoId)

    db.prepare(`
      UPDATE Acervo
      SET status = 'DISPONIVEL', updatedAt = datetime('now')
      WHERE id = ?
    `).run(acervoId)

    db.close()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao registrar devolução:', error)
    return NextResponse.json({ error: 'Erro ao registrar devolução' }, { status: 500 })
  }
}
