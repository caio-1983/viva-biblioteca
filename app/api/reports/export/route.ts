import { NextRequest, NextResponse } from 'next/server'
import Database from 'better-sqlite3'
import path from 'path'
import * as XLSX from 'xlsx'

const DB_PATH = path.join(process.cwd(), 'storage', 'database', 'biblioteca.db')

export async function GET(request: NextRequest) {
  const tipo = request.nextUrl.searchParams.get('tipo') || 'emprestimos'
  const formato = request.nextUrl.searchParams.get('formato') || 'xlsx'

  try {
    const db = new Database(DB_PATH, { readonly: true })
    let data: Record<string, unknown>[] = []
    let filename = ''

    if (tipo === 'acervo') {
      data = db.prepare(`
        SELECT numeroExemplar as "Nº Exemplar", tipoPublicacao as "Tipo", isbn as "ISBN",
               classificacao as "Classificação", titulo as "Título", subtitulo as "Subtítulo",
               autor as "Autor", edicao as "Edição", editora as "Editora",
               assunto1 as "Assunto 1", assunto2 as "Assunto 2", assunto3 as "Assunto 3",
               colecao as "Coleção", status as "Status"
        FROM Acervo WHERE ativo = 1 ORDER BY titulo
      `).all() as Record<string, unknown>[]
      filename = 'acervo'
    } else if (tipo === 'usuarios') {
      data = db.prepare(`
        SELECT numeroCadastro as "Nº Cadastro", nomeCompleto as "Nome Completo",
               cpf as "CPF", celular as "Celular", email as "E-mail"
        FROM Usuario WHERE ativo = 1 ORDER BY nomeCompleto
      `).all() as Record<string, unknown>[]
      filename = 'usuarios'
    } else {
      data = db.prepare(`
        SELECT e.id as "ID", u.numeroCadastro as "Nº Cadastro", u.nomeCompleto as "Membro",
               a.numeroExemplar as "Nº Exemplar", a.titulo as "Título",
               e.dataEmprestimo as "Data Empréstimo",
               e.dataPrevistaDevolucao as "Previsão Devolução",
               e.dataDevolucao as "Data Devolução", e.status as "Status"
        FROM Emprestimo e
        JOIN Usuario u ON u.id = e.usuarioId
        JOIN Acervo a ON a.id = e.acervoId
        ORDER BY e.dataEmprestimo DESC
      `).all() as Record<string, unknown>[]
      filename = 'emprestimos'
    }

    db.close()

    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, filename)

    if (formato === 'csv') {
      const csv = XLSX.utils.sheet_to_csv(ws)
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}.csv"`,
        },
      })
    }

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}.xlsx"`,
      },
    })
  } catch (error) {
    console.error('Erro ao exportar:', error)
    return NextResponse.json({ error: 'Erro ao exportar dados' }, { status: 500 })
  }
}
