/**
 * Script legado de verificação pós-migração Etapa 2 (Acervo → Obra+Exemplar).
 * VPS-004: convertido para usar better-sqlite3 direto (adapter removido).
 * Este script verifica o estado do banco SQLite legado, não o PostgreSQL.
 */
import 'dotenv/config'
import path from 'path'
import Database from 'better-sqlite3'

const url = process.env.SQLITE_URL ?? process.env.DATABASE_URL ?? 'file:./storage/database/biblioteca.db'
const dbPath = url.replace('file:', '')
const db = new Database(path.resolve(dbPath), { readonly: true })

const cols = db.prepare(`PRAGMA table_info('Emprestimo')`).all() as Array<{ name: string }>
console.log('Colunas:', cols.map(c => c.name).join(', '))

const acervoColExists = cols.some(c => c.name === 'acervoId')
console.log(acervoColExists ? '❌ acervoId ainda existe!' : '✅ acervoId removido')

const exemplarColExists = cols.some(c => c.name === 'exemplarId')
console.log(exemplarColExists ? '✅ exemplarId existe' : '❌ exemplarId não existe')

const rows = db.prepare('SELECT id, exemplarId FROM Emprestimo').all() as Array<{ id: number; exemplarId: number | null }>
console.log('Empréstimos:', JSON.stringify(rows))
console.log(rows.every(e => e.exemplarId !== null) ? '✅ 100% preenchidos' : '❌ há NULL')

db.close()
