import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

export async function GET() {
  try {
    const dbPath = path.join(process.cwd(), 'storage', 'database', 'biblioteca.db');
    const db = new Database(dbPath, { readonly: true });

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
