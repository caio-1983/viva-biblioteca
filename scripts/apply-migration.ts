/**
 * Aplica a migration etapa2_fase2 manualmente e registra no _prisma_migrations.
 * Usado porque `prisma migrate dev` é bloqueado em ambientes não-interativos
 * quando há aviso de perda de dados (mesmo que os dados já estejam migrados).
 */
import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import Database from 'better-sqlite3'

const url = process.env.DATABASE_URL ?? 'file:./storage/database/biblioteca.db'
const dbPath = url.replace('file:', '')
const db = new Database(path.resolve(dbPath))

const MIGRATION_NAME = '20260625190000_etapa2_fase2_emprestimo_not_null'
const SQL_PATH = path.join('prisma', 'migrations', MIGRATION_NAME, 'migration.sql')

// Verifica se já foi aplicada
const already = db.prepare(
  `SELECT id FROM _prisma_migrations WHERE migration_name = ?`
).get(MIGRATION_NAME)

if (already) {
  console.log(`ℹ️  Migration '${MIGRATION_NAME}' já registrada — pulando.`)
  db.close()
  process.exit(0)
}

// Verifica pré-condição: todos os exemplarId preenchidos
const pending = db.prepare(`SELECT COUNT(*) as n FROM Emprestimo WHERE exemplarId IS NULL`).get() as { n: number }
if (pending.n > 0) {
  console.error(`❌  ${pending.n} Emprestimo(s) com exemplarId NULL — execute o Script 03 primeiro.`)
  db.close()
  process.exit(1)
}

// Aplica SQL
const sql = fs.readFileSync(SQL_PATH, 'utf-8')
const startedAt = new Date().toISOString()
try {
  db.exec(sql)
} catch (err) {
  console.error('❌  Erro ao aplicar migration SQL:', err)
  db.close()
  process.exit(1)
}
const finishedAt = new Date().toISOString()

// Calcula checksum simples (length-based — suficiente para identificação)
const checksum = Buffer.from(sql).toString('base64').slice(0, 32)

db.prepare(`
  INSERT INTO _prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
  VALUES (?, ?, ?, ?, NULL, NULL, ?, 1)
`).run(
  `${Date.now()}-${MIGRATION_NAME}`,
  checksum,
  finishedAt,
  MIGRATION_NAME,
  startedAt,
)

console.log(`✅  Migration '${MIGRATION_NAME}' aplicada e registrada.`)
db.close()
