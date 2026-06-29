/**
 * scripts/migration/sqlite-to-postgres.ts
 *
 * Migra todos os dados do banco SQLite legado para PostgreSQL.
 *
 * Ordem obrigatória de migração:
 *   Sequencia → Configuracao → Acervo → Usuario → Obra → Exemplar
 *   → MigracaoAuditoria → Emprestimo
 *
 * Regras:
 *   - SQLite aberto apenas em modo leitura
 *   - Aborta imediatamente em caso de erro
 *   - Seguro para execução única (verifica se destino já tem dados)
 *   - Preserva IDs originais sempre que possível
 *   - Atualiza todas as sequences do PostgreSQL ao final
 *
 * Execução:
 *   npm run pg:migrate
 *   ou
 *   tsx scripts/migration/sqlite-to-postgres.ts
 */

import 'dotenv/config'
import path from 'path'
import Database from 'better-sqlite3'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

// ─── Conexões ────────────────────────────────────────────────────────────────

const sqliteUrl = process.env.SQLITE_URL ?? 'file:./storage/database/biblioteca.db'
const sqlitePath = path.resolve(sqliteUrl.replace('file:', ''))

let sqlite: ReturnType<typeof Database>
try {
  sqlite = new Database(sqlitePath, { readonly: true })
} catch (err) {
  console.error(`❌  Não foi possível abrir o banco SQLite em: ${sqlitePath}`)
  console.error(err)
  process.exit(1)
}

const pgUrl = process.env.DATABASE_URL ?? 'postgresql://biblioteca:biblioteca@localhost:5432/biblioteca'
const adapter = new PrismaPg(pgUrl)
const prisma = new PrismaClient({ adapter })

// ─── Helpers ─────────────────────────────────────────────────────────────────

function log(msg: string) {
  console.log(`[${new Date().toISOString()}] ${msg}`)
}

function toDate(value: string | null | undefined): Date | null {
  if (!value) return null
  const d = new Date(value)
  return isNaN(d.getTime()) ? null : d
}

function tableExists(tableName: string): boolean {
  try {
    const row = sqlite
      .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`)
      .get(tableName) as { name: string } | undefined
    return !!row
  } catch {
    return false
  }
}

function countSqlite(tableName: string): number {
  try {
    const row = sqlite.prepare(`SELECT COUNT(*) as n FROM "${tableName}"`).get() as { n: number }
    return row.n
  } catch {
    return 0
  }
}

// ─── Verificação de segurança (execução única) ───────────────────────────────

async function checkAlreadyMigrated(): Promise<void> {
  const counts = await Promise.all([
    prisma.usuario.count(),
    prisma.obra.count(),
    prisma.exemplar.count(),
    prisma.emprestimo.count(),
  ])
  const total = counts.reduce((a, b) => a + b, 0)
  if (total > 0) {
    log(`⚠️  O PostgreSQL já contém dados (${total} registros no total).`)
    log(`    Execute apenas em banco vazio. Abortando.`)
    process.exit(1)
  }
}

// ─── Migração de Sequencia ───────────────────────────────────────────────────

async function migrateSequencia() {
  if (!tableExists('Sequencia')) {
    log('⏭️  Sequencia — tabela não existe no SQLite, pulando.')
    return 0
  }
  const rows = sqlite.prepare('SELECT nome, valor FROM "Sequencia"').all() as Array<{
    nome: string
    valor: number
  }>
  if (rows.length === 0) {
    log('ℹ️  Sequencia — 0 registros no SQLite.')
    return 0
  }
  await prisma.sequencia.createMany({ data: rows })
  log(`✅  Sequencia — ${rows.length} registro(s) migrado(s).`)
  return rows.length
}

// ─── Migração de Configuracao ────────────────────────────────────────────────

async function migrateConfiguracao() {
  if (!tableExists('Configuracao')) {
    log('⏭️  Configuracao — tabela não existe no SQLite, pulando.')
    return 0
  }
  const rows = sqlite
    .prepare('SELECT id, prazoEmprestimoDias, maxEmprestimos, pastaBackup, pastaExportacao, updatedAt FROM "Configuracao"')
    .all() as Array<{
      id: number
      prazoEmprestimoDias: number
      maxEmprestimos: number
      pastaBackup: string | null
      pastaExportacao: string | null
      updatedAt: string
    }>
  if (rows.length === 0) {
    log('ℹ️  Configuracao — 0 registros no SQLite.')
    return 0
  }
  for (const r of rows) {
    await prisma.configuracao.create({
      data: {
        id: r.id,
        prazoEmprestimoDias: r.prazoEmprestimoDias,
        maxEmprestimos: r.maxEmprestimos,
        pastaBackup: r.pastaBackup ?? null,
        pastaExportacao: r.pastaExportacao ?? null,
        updatedAt: toDate(r.updatedAt) ?? new Date(),
      },
    })
  }
  log(`✅  Configuracao — ${rows.length} registro(s) migrado(s).`)
  return rows.length
}

// ─── Migração de Acervo ──────────────────────────────────────────────────────

async function migrateAcervo() {
  if (!tableExists('Acervo')) {
    log('⏭️  Acervo — tabela não existe no SQLite, pulando.')
    return 0
  }
  const rows = sqlite
    .prepare(`SELECT id, numeroExemplar, tipoPublicacao, isbn, classificacao, titulo,
                     subtitulo, autor, edicao, editora, dataPublicacao, tombo,
                     assunto1, assunto2, assunto3, colecao, observacao, status,
                     ativo, createdAt, updatedAt
              FROM "Acervo"`)
    .all() as Array<{
      id: number
      numeroExemplar: string
      tipoPublicacao: string | null
      isbn: string | null
      classificacao: string | null
      titulo: string
      subtitulo: string | null
      autor: string | null
      edicao: string | null
      editora: string | null
      dataPublicacao: string | null
      tombo: string | null
      assunto1: string | null
      assunto2: string | null
      assunto3: string | null
      colecao: string | null
      observacao: string | null
      status: string
      ativo: number | boolean
      createdAt: string
      updatedAt: string
    }>
  if (rows.length === 0) {
    log('ℹ️  Acervo — 0 registros no SQLite.')
    return 0
  }
  const data = rows.map((r) => ({
    id: r.id,
    numeroExemplar: r.numeroExemplar,
    tipoPublicacao: r.tipoPublicacao ?? null,
    isbn: r.isbn ?? null,
    classificacao: r.classificacao ?? null,
    titulo: r.titulo,
    subtitulo: r.subtitulo ?? null,
    autor: r.autor ?? null,
    edicao: r.edicao ?? null,
    editora: r.editora ?? null,
    dataPublicacao: toDate(r.dataPublicacao),
    tombo: r.tombo ?? null,
    assunto1: r.assunto1 ?? null,
    assunto2: r.assunto2 ?? null,
    assunto3: r.assunto3 ?? null,
    colecao: r.colecao ?? null,
    observacao: r.observacao ?? null,
    status: r.status as 'DISPONIVEL' | 'EMPRESTADO' | 'RESERVADO' | 'MANUTENCAO' | 'EXTRAVIADO' | 'BAIXADO',
    ativo: Boolean(r.ativo),
    createdAt: toDate(r.createdAt) ?? new Date(),
    updatedAt: toDate(r.updatedAt) ?? new Date(),
  }))
  await prisma.acervo.createMany({ data })
  log(`✅  Acervo — ${rows.length} registro(s) migrado(s).`)
  return rows.length
}

// ─── Migração de Usuario ─────────────────────────────────────────────────────

async function migrateUsuario() {
  if (!tableExists('Usuario')) {
    log('⏭️  Usuario — tabela não existe no SQLite, pulando.')
    return 0
  }
  const rows = sqlite
    .prepare(`SELECT id, numeroCadastro, nomeCompleto, cpf, dataNascimento,
                     celular, email, membro, ativo, createdAt, updatedAt
              FROM "Usuario"`)
    .all() as Array<{
      id: number
      numeroCadastro: string
      nomeCompleto: string
      cpf: string | null
      dataNascimento: string | null
      celular: string | null
      email: string | null
      membro: number | boolean
      ativo: number | boolean
      createdAt: string
      updatedAt: string
    }>
  if (rows.length === 0) {
    log('ℹ️  Usuario — 0 registros no SQLite.')
    return 0
  }
  const data = rows.map((r) => ({
    id: r.id,
    numeroCadastro: r.numeroCadastro,
    nomeCompleto: r.nomeCompleto,
    cpf: r.cpf ?? null,
    dataNascimento: toDate(r.dataNascimento),
    celular: r.celular ?? null,
    email: r.email ?? null,
    membro: Boolean(r.membro),
    ativo: Boolean(r.ativo),
    createdAt: toDate(r.createdAt) ?? new Date(),
    updatedAt: toDate(r.updatedAt) ?? new Date(),
  }))
  await prisma.usuario.createMany({ data })
  log(`✅  Usuario — ${rows.length} registro(s) migrado(s).`)
  return rows.length
}

// ─── Migração de Obra ─────────────────────────────────────────────────────────

async function migrateObra() {
  if (!tableExists('Obra')) {
    log('⏭️  Obra — tabela não existe no SQLite, pulando.')
    return 0
  }
  const rows = sqlite
    .prepare(`SELECT id, isbn, titulo, subtitulo, tipoPublicacao, anoPublicacao,
                     autor, editora, edicao, idioma, classificacao,
                     assunto1, assunto2, assunto3, colecao, sinopse, capaUrl,
                     ativo, deletedAt, createdAt, updatedAt
              FROM "Obra"`)
    .all() as Array<{
      id: number
      isbn: string | null
      titulo: string
      subtitulo: string | null
      tipoPublicacao: string | null
      anoPublicacao: number | null
      autor: string | null
      editora: string | null
      edicao: string | null
      idioma: string | null
      classificacao: string | null
      assunto1: string | null
      assunto2: string | null
      assunto3: string | null
      colecao: string | null
      sinopse: string | null
      capaUrl: string | null
      ativo: number | boolean
      deletedAt: string | null
      createdAt: string
      updatedAt: string
    }>
  if (rows.length === 0) {
    log('ℹ️  Obra — 0 registros no SQLite.')
    return 0
  }
  const data = rows.map((r) => ({
    id: r.id,
    isbn: r.isbn ?? null,
    titulo: r.titulo,
    subtitulo: r.subtitulo ?? null,
    tipoPublicacao: r.tipoPublicacao ?? null,
    anoPublicacao: r.anoPublicacao ?? null,
    autor: r.autor ?? null,
    editora: r.editora ?? null,
    edicao: r.edicao ?? null,
    idioma: r.idioma ?? null,
    classificacao: r.classificacao ?? null,
    assunto1: r.assunto1 ?? null,
    assunto2: r.assunto2 ?? null,
    assunto3: r.assunto3 ?? null,
    colecao: r.colecao ?? null,
    sinopse: r.sinopse ?? null,
    capaUrl: r.capaUrl ?? null,
    ativo: Boolean(r.ativo),
    deletedAt: toDate(r.deletedAt),
    createdAt: toDate(r.createdAt) ?? new Date(),
    updatedAt: toDate(r.updatedAt) ?? new Date(),
  }))
  await prisma.obra.createMany({ data })
  log(`✅  Obra — ${rows.length} registro(s) migrado(s).`)
  return rows.length
}

// ─── Migração de Exemplar ────────────────────────────────────────────────────

async function migrateExemplar() {
  if (!tableExists('Exemplar')) {
    log('⏭️  Exemplar — tabela não existe no SQLite, pulando.')
    return 0
  }
  const rows = sqlite
    .prepare(`SELECT id, obraId, codigoExemplar, codigoBarras, tombo,
                     status, estadoFisico, localizacao, origem, dataAquisicao,
                     valor, observacao, ativo, deletedAt, createdAt, updatedAt
              FROM "Exemplar"`)
    .all() as Array<{
      id: number
      obraId: number
      codigoExemplar: string
      codigoBarras: string | null
      tombo: string | null
      status: string
      estadoFisico: string | null
      localizacao: string | null
      origem: string | null
      dataAquisicao: string | null
      valor: number | null
      observacao: string | null
      ativo: number | boolean
      deletedAt: string | null
      createdAt: string
      updatedAt: string
    }>
  if (rows.length === 0) {
    log('ℹ️  Exemplar — 0 registros no SQLite.')
    return 0
  }
  const data = rows.map((r) => ({
    id: r.id,
    obraId: r.obraId,
    codigoExemplar: r.codigoExemplar,
    codigoBarras: r.codigoBarras ?? null,
    tombo: r.tombo ?? null,
    status: r.status as 'DISPONIVEL' | 'EMPRESTADO' | 'RESERVADO' | 'MANUTENCAO' | 'EXTRAVIADO' | 'BAIXADO',
    estadoFisico: r.estadoFisico ?? null,
    localizacao: r.localizacao ?? null,
    origem: r.origem ?? null,
    dataAquisicao: toDate(r.dataAquisicao),
    valor: r.valor ?? null,
    observacao: r.observacao ?? null,
    ativo: Boolean(r.ativo),
    deletedAt: toDate(r.deletedAt),
    createdAt: toDate(r.createdAt) ?? new Date(),
    updatedAt: toDate(r.updatedAt) ?? new Date(),
  }))
  await prisma.exemplar.createMany({ data })
  log(`✅  Exemplar — ${rows.length} registro(s) migrado(s).`)
  return rows.length
}

// ─── Migração de MigracaoAuditoria ──────────────────────────────────────────

async function migrateMigracaoAuditoria() {
  if (!tableExists('MigracaoAuditoria')) {
    log('⏭️  MigracaoAuditoria — tabela não existe no SQLite, pulando.')
    return 0
  }
  const rows = sqlite
    .prepare(`SELECT id, acervoId, exemplarId, obraId, estrategia,
                     chaveDeduplicacao, needsReview, createdAt
              FROM "MigracaoAuditoria"`)
    .all() as Array<{
      id: number
      acervoId: number
      exemplarId: number
      obraId: number
      estrategia: string
      chaveDeduplicacao: string | null
      needsReview: number | boolean
      createdAt: string
    }>
  if (rows.length === 0) {
    log('ℹ️  MigracaoAuditoria — 0 registros no SQLite.')
    return 0
  }
  const data = rows.map((r) => ({
    id: r.id,
    acervoId: r.acervoId,
    exemplarId: r.exemplarId,
    obraId: r.obraId,
    estrategia: r.estrategia,
    chaveDeduplicacao: r.chaveDeduplicacao ?? null,
    needsReview: Boolean(r.needsReview),
    createdAt: toDate(r.createdAt) ?? new Date(),
  }))
  await prisma.migracaoAuditoria.createMany({ data })
  log(`✅  MigracaoAuditoria — ${rows.length} registro(s) migrado(s).`)
  return rows.length
}

// ─── Migração de Emprestimo ──────────────────────────────────────────────────

async function migrateEmprestimo() {
  if (!tableExists('Emprestimo')) {
    log('⏭️  Emprestimo — tabela não existe no SQLite, pulando.')
    return 0
  }
  const rows = sqlite
    .prepare(`SELECT id, usuarioId, exemplarId, dataEmprestimo,
                     dataPrevistaDevolucao, dataDevolucao, status, createdAt
              FROM "Emprestimo"`)
    .all() as Array<{
      id: number
      usuarioId: number
      exemplarId: number
      dataEmprestimo: string
      dataPrevistaDevolucao: string
      dataDevolucao: string | null
      status: string
      createdAt: string
    }>
  if (rows.length === 0) {
    log('ℹ️  Emprestimo — 0 registros no SQLite.')
    return 0
  }
  const data = rows.map((r) => ({
    id: r.id,
    usuarioId: r.usuarioId,
    exemplarId: r.exemplarId,
    dataEmprestimo: toDate(r.dataEmprestimo) ?? new Date(),
    dataPrevistaDevolucao: toDate(r.dataPrevistaDevolucao) ?? new Date(),
    dataDevolucao: toDate(r.dataDevolucao),
    status: r.status as 'ATIVO' | 'DEVOLVIDO' | 'ATRASADO' | 'CANCELADO',
    createdAt: toDate(r.createdAt) ?? new Date(),
  }))
  await prisma.emprestimo.createMany({ data })
  log(`✅  Emprestimo — ${rows.length} registro(s) migrado(s).`)
  return rows.length
}

// ─── Atualização de sequences PostgreSQL ─────────────────────────────────────

async function resetSequences() {
  log('🔄  Atualizando sequences PostgreSQL...')
  const tables: Array<[string, string]> = [
    ['Acervo', 'id'],
    ['Configuracao', 'id'],
    ['Usuario', 'id'],
    ['Obra', 'id'],
    ['Exemplar', 'id'],
    ['MigracaoAuditoria', 'id'],
    ['Emprestimo', 'id'],
  ]
  for (const [table, col] of tables) {
    try {
      await prisma.$executeRawUnsafe(`
        SELECT setval(
          pg_get_serial_sequence('"${table}"', '${col}'),
          COALESCE((SELECT MAX("${col}") FROM "${table}"), 0) + 1,
          false
        )
      `)
      log(`   ✅  sequence "${table}.${col}" atualizada.`)
    } catch (err) {
      log(`   ⚠️  sequence "${table}.${col}" — erro ao atualizar: ${err}`)
    }
  }
}

// ─── Relatório de contagens SQLite ───────────────────────────────────────────

function sqliteCounts(): Record<string, number> {
  const tables = ['Sequencia', 'Configuracao', 'Acervo', 'Usuario', 'Obra', 'Exemplar', 'MigracaoAuditoria', 'Emprestimo']
  const result: Record<string, number> = {}
  for (const t of tables) {
    result[t] = countSqlite(t)
  }
  return result
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  log('════════════════════════════════════════')
  log('  VPS-004 — Migração SQLite → PostgreSQL')
  log('════════════════════════════════════════')
  log(`SQLite: ${sqlitePath}`)

  const sqliteTotals = sqliteCounts()
  log('\n📊  Contagens SQLite (origem):')
  for (const [table, count] of Object.entries(sqliteTotals)) {
    log(`     ${table}: ${count}`)
  }

  log('\n🔒  Verificando banco PostgreSQL destino...')
  await checkAlreadyMigrated()
  log('   ✅  Banco PostgreSQL vazio — prosseguindo.')

  log('\n📦  Iniciando migração em ordem...')

  const results: Record<string, number> = {}

  results.Sequencia = await migrateSequencia()
  results.Configuracao = await migrateConfiguracao()
  results.Acervo = await migrateAcervo()
  results.Usuario = await migrateUsuario()
  results.Obra = await migrateObra()
  results.Exemplar = await migrateExemplar()
  results.MigracaoAuditoria = await migrateMigracaoAuditoria()
  results.Emprestimo = await migrateEmprestimo()

  await resetSequences()

  log('\n📊  Resumo da migração:')
  for (const [table, count] of Object.entries(results)) {
    const sqliteCount = sqliteTotals[table] ?? 0
    const status = count === sqliteCount ? '✅' : '⚠️'
    log(`     ${status}  ${table}: ${count}/${sqliteCount}`)
  }

  const totalMigrated = Object.values(results).reduce((a, b) => a + b, 0)
  const totalSource = Object.values(sqliteTotals).reduce((a, b) => a + b, 0)

  log(`\n✅  Migração concluída — ${totalMigrated}/${totalSource} registros.`)

  if (totalMigrated !== totalSource) {
    log('⚠️  Há divergência nas contagens — execute validate-migration.ts.')
  }
}

main()
  .catch((err) => {
    console.error('\n❌  Erro fatal durante a migração:')
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    sqlite.close()
    await prisma.$disconnect()
  })
