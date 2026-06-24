import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'storage', 'database', 'biblioteca.db');

export async function GET() {
  try {
    const db = new Database(DB_PATH, { readonly: true });

    const books = db.prepare(`
      SELECT id, numeroExemplar, titulo, autor, assunto1, status
      FROM Acervo
      WHERE ativo = 1
      ORDER BY titulo
    `).all();

    db.close();

    return NextResponse.json(books);
  } catch (error) {
    console.error('Erro ao buscar livros:', error);
    return NextResponse.json({ error: 'Erro ao buscar livros' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.titulo || !String(body.titulo).trim()) {
      return NextResponse.json({ error: 'Título é obrigatório' }, { status: 400 });
    }

    const db = new Database(DB_PATH);

    const lastRow = db.prepare('SELECT id FROM Acervo ORDER BY id DESC LIMIT 1').get() as { id: number } | undefined;
    const nextId = (lastRow?.id ?? 0) + 1;
    const numeroExemplar = `EX${String(nextId).padStart(6, '0')}`;

    const stmt = db.prepare(`
      INSERT INTO Acervo (
        numeroExemplar, tipoPublicacao, isbn, classificacao, titulo, subtitulo,
        autor, edicao, editora, dataPublicacao, tombo,
        assunto1, assunto2, assunto3, colecao, observacao,
        status, ativo, createdAt, updatedAt
      ) VALUES (
        @numeroExemplar, @tipoPublicacao, @isbn, @classificacao, @titulo, @subtitulo,
        @autor, @edicao, @editora, @dataPublicacao, @tombo,
        @assunto1, @assunto2, @assunto3, @colecao, @observacao,
        'DISPONIVEL', 1, datetime('now'), datetime('now')
      )
    `);

    const result = stmt.run({
      numeroExemplar,
      tipoPublicacao: body.tipoPublicacao || null,
      isbn: body.isbn || null,
      classificacao: body.classificacao || null,
      titulo: String(body.titulo).trim(),
      subtitulo: body.subtitulo || null,
      autor: body.autor || null,
      edicao: body.edicao || null,
      editora: body.editora || null,
      dataPublicacao: body.dataPublicacao || null,
      tombo: body.tombo || null,
      assunto1: body.assunto1 || null,
      assunto2: body.assunto2 || null,
      assunto3: body.assunto3 || null,
      colecao: body.colecao || null,
      observacao: body.observacao || null,
    });

    const created = db.prepare('SELECT * FROM Acervo WHERE id = ?').get(result.lastInsertRowid);
    db.close();

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Erro ao cadastrar livro:', error);
    return NextResponse.json({ error: 'Erro ao cadastrar livro' }, { status: 500 });
  }
}
