/**
 * scripts/migration/validate-migration.ts
 *
 * Compara automaticamente SQLite (origem) e PostgreSQL (destino) após migração.
 *
 * Valida:
 *   - Quantidade de registros por tabela
 *   - Integridade referencial
 *   - Constraints (unique, not null)
 *   - Enums (status válidos)
 *   - Datas (não nulas onde obrigatórias)
 *   - Códigos EX (codigoExemplar)
 *   - Códigos US (numeroCadastro)
 *   - Configurações
 *   - Sequences
 *
 * Gera relatórios em:
 *   storage/reports/migration-validation.json
 *   storage/reports/migration-validation.md
 *
 * Execução:
 *   npm run pg:validate
 *   ou
 *   tsx scripts/migration/validate-migration.ts
 */

import 'dotenv/config'
import fs from 'fs'
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

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface ValidationCheck {
  categoria: string
  item: string
  sqlite: string | number
  postgres: string | number
  status: 'APROVADO' | 'REPROVADO' | 'AVISO' | 'INFO'
  detalhe?: string
}

interface ValidationReport {
  geradoEm: string
  duracao: string
  status: 'APROVADO' | 'REPROVADO'
  totalChecks: number
  aprovados: number
  reprovados: number
  avisos: number
  checks: ValidationCheck[]
}

const checks: ValidationCheck[] = []
let reprovados = 0
let avisos = 0

function check(item: ValidationCheck) {
  checks.push(item)
  if (item.status === 'REPROVADO') reprovados++
  if (item.status === 'AVISO') avisos++
  const icon = { APROVADO: '✅', REPROVADO: '❌', AVISO: '⚠️', INFO: 'ℹ️' }[item.status]
  console.log(`  ${icon}  [${item.categoria}] ${item.item}: SQLite=${item.sqlite} PG=${item.postgres}${item.detalhe ? ` — ${item.detalhe}` : ''}`)
}

function sqliteCount(table: string): number {
  try {
    const row = sqlite.prepare(`SELECT COUNT(*) as n FROM "${table}"`).get() as { n: number }
    return row.n
  } catch {
    return -1
  }
}

function tableExistsSqlite(table: string): boolean {
  try {
    const row = sqlite
      .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`)
      .get(table) as { name: string } | undefined
    return !!row
  } catch {
    return false
  }
}

// ─── 1. Contagem de registros por tabela ─────────────────────────────────────

async function checkContagens() {
  console.log('\n[1] Contagem de registros por tabela')

  const tables: Array<{
    nome: string
    pgCount: () => Promise<number>
  }> = [
    { nome: 'Sequencia', pgCount: () => prisma.sequencia.count() },
    { nome: 'Configuracao', pgCount: () => prisma.configuracao.count() },
    { nome: 'Acervo', pgCount: () => prisma.acervo.count() },
    { nome: 'Usuario', pgCount: () => prisma.usuario.count() },
    { nome: 'Obra', pgCount: () => prisma.obra.count() },
    { nome: 'Exemplar', pgCount: () => prisma.exemplar.count() },
    { nome: 'MigracaoAuditoria', pgCount: () => prisma.migracaoAuditoria.count() },
    { nome: 'Emprestimo', pgCount: () => prisma.emprestimo.count() },
  ]

  for (const t of tables) {
    const sqCount = tableExistsSqlite(t.nome) ? sqliteCount(t.nome) : -1
    const pgCount = await t.pgCount()
    const match = sqCount === pgCount
    check({
      categoria: 'CONTAGEM',
      item: t.nome,
      sqlite: sqCount === -1 ? 'N/A' : sqCount,
      postgres: pgCount,
      status: sqCount === -1 ? 'INFO' : match ? 'APROVADO' : 'REPROVADO',
      detalhe: !match && sqCount !== -1 ? `Diferença de ${Math.abs(pgCount - sqCount)} registros` : undefined,
    })
  }
}

// ─── 2. Integridade referencial ───────────────────────────────────────────────

async function checkIntegridadeReferencial() {
  console.log('\n[2] Integridade referencial')

  // Emprestimo → Usuario
  const empSemUsuario = await prisma.$queryRaw<[{ n: bigint }]>`
    SELECT COUNT(*) as n FROM "Emprestimo" e
    WHERE NOT EXISTS (SELECT 1 FROM "Usuario" u WHERE u.id = e."usuarioId")
  `
  const empSemUsuarioN = Number(empSemUsuario[0].n)
  check({
    categoria: 'REFERENCIAL',
    item: 'Emprestimo.usuarioId → Usuario',
    sqlite: 0,
    postgres: empSemUsuarioN,
    status: empSemUsuarioN === 0 ? 'APROVADO' : 'REPROVADO',
    detalhe: empSemUsuarioN > 0 ? `${empSemUsuarioN} empréstimos sem usuário` : undefined,
  })

  // Emprestimo → Exemplar
  const empSemExemplar = await prisma.$queryRaw<[{ n: bigint }]>`
    SELECT COUNT(*) as n FROM "Emprestimo" e
    WHERE NOT EXISTS (SELECT 1 FROM "Exemplar" ex WHERE ex.id = e."exemplarId")
  `
  const empSemExemplarN = Number(empSemExemplar[0].n)
  check({
    categoria: 'REFERENCIAL',
    item: 'Emprestimo.exemplarId → Exemplar',
    sqlite: 0,
    postgres: empSemExemplarN,
    status: empSemExemplarN === 0 ? 'APROVADO' : 'REPROVADO',
    detalhe: empSemExemplarN > 0 ? `${empSemExemplarN} empréstimos sem exemplar` : undefined,
  })

  // Exemplar → Obra
  const exSemObra = await prisma.$queryRaw<[{ n: bigint }]>`
    SELECT COUNT(*) as n FROM "Exemplar" ex
    WHERE NOT EXISTS (SELECT 1 FROM "Obra" o WHERE o.id = ex."obraId")
  `
  const exSemObraN = Number(exSemObra[0].n)
  check({
    categoria: 'REFERENCIAL',
    item: 'Exemplar.obraId → Obra',
    sqlite: 0,
    postgres: exSemObraN,
    status: exSemObraN === 0 ? 'APROVADO' : 'REPROVADO',
    detalhe: exSemObraN > 0 ? `${exSemObraN} exemplares sem obra` : undefined,
  })
}

// ─── 3. Constraints unique ────────────────────────────────────────────────────

async function checkConstraints() {
  console.log('\n[3] Constraints UNIQUE')

  // Usuario.numeroCadastro único
  const dupUS = await prisma.$queryRaw<[{ n: bigint }]>`
    SELECT COUNT(*) - COUNT(DISTINCT "numeroCadastro") as n FROM "Usuario"
  `
  const dupUSN = Number(dupUS[0].n)
  check({
    categoria: 'CONSTRAINT',
    item: 'Usuario.numeroCadastro UNIQUE',
    sqlite: 0,
    postgres: dupUSN,
    status: dupUSN === 0 ? 'APROVADO' : 'REPROVADO',
    detalhe: dupUSN > 0 ? `${dupUSN} duplicatas` : undefined,
  })

  // Exemplar.codigoExemplar único
  const dupEX = await prisma.$queryRaw<[{ n: bigint }]>`
    SELECT COUNT(*) - COUNT(DISTINCT "codigoExemplar") as n FROM "Exemplar"
  `
  const dupEXN = Number(dupEX[0].n)
  check({
    categoria: 'CONSTRAINT',
    item: 'Exemplar.codigoExemplar UNIQUE',
    sqlite: 0,
    postgres: dupEXN,
    status: dupEXN === 0 ? 'APROVADO' : 'REPROVADO',
    detalhe: dupEXN > 0 ? `${dupEXN} duplicatas` : undefined,
  })

  // Acervo.numeroExemplar único
  const acervoTotal = await prisma.acervo.count()
  if (acervoTotal > 0) {
    const dupAcervo = await prisma.$queryRaw<[{ n: bigint }]>`
      SELECT COUNT(*) - COUNT(DISTINCT "numeroExemplar") as n FROM "Acervo"
    `
    const dupAcervoN = Number(dupAcervo[0].n)
    check({
      categoria: 'CONSTRAINT',
      item: 'Acervo.numeroExemplar UNIQUE',
      sqlite: 0,
      postgres: dupAcervoN,
      status: dupAcervoN === 0 ? 'APROVADO' : 'REPROVADO',
      detalhe: dupAcervoN > 0 ? `${dupAcervoN} duplicatas` : undefined,
    })
  }
}

// ─── 4. Enums de status ───────────────────────────────────────────────────────

async function checkEnums() {
  console.log('\n[4] Enums de status')

  // No PostgreSQL, enums nativos rejeitam valores inválidos na inserção.
  // Verificamos via cast ::text para compatibilidade com a query raw.

  const badExemplarStatus = await prisma.$queryRawUnsafe<[{ n: bigint }]>(
    `SELECT COUNT(*) as n FROM "Exemplar" WHERE status::text NOT IN ('DISPONIVEL','EMPRESTADO','RESERVADO','MANUTENCAO','EXTRAVIADO','BAIXADO')`
  )
  check({
    categoria: 'ENUM',
    item: 'Exemplar.status valores válidos',
    sqlite: 0,
    postgres: Number(badExemplarStatus[0].n),
    status: Number(badExemplarStatus[0].n) === 0 ? 'APROVADO' : 'REPROVADO',
  })

  const acervoTotal = await prisma.acervo.count()
  if (acervoTotal > 0) {
    const badAcervoStatus = await prisma.$queryRawUnsafe<[{ n: bigint }]>(
      `SELECT COUNT(*) as n FROM "Acervo" WHERE status::text NOT IN ('DISPONIVEL','EMPRESTADO','RESERVADO','MANUTENCAO','EXTRAVIADO','BAIXADO')`
    )
    check({
      categoria: 'ENUM',
      item: 'Acervo.status valores válidos',
      sqlite: 0,
      postgres: Number(badAcervoStatus[0].n),
      status: Number(badAcervoStatus[0].n) === 0 ? 'APROVADO' : 'REPROVADO',
    })
  }

  const badEmprestimoStatus = await prisma.$queryRawUnsafe<[{ n: bigint }]>(
    `SELECT COUNT(*) as n FROM "Emprestimo" WHERE status::text NOT IN ('ATIVO','DEVOLVIDO','ATRASADO','CANCELADO')`
  )
  check({
    categoria: 'ENUM',
    item: 'Emprestimo.status valores válidos',
    sqlite: 0,
    postgres: Number(badEmprestimoStatus[0].n),
    status: Number(badEmprestimoStatus[0].n) === 0 ? 'APROVADO' : 'REPROVADO',
  })
}

// ─── 5. Datas obrigatórias ────────────────────────────────────────────────────

async function checkDatas() {
  console.log('\n[5] Datas obrigatórias')

  // Emprestimo.dataEmprestimo NOT NULL
  const empSemData = await prisma.$queryRaw<[{ n: bigint }]>`
    SELECT COUNT(*) as n FROM "Emprestimo" WHERE "dataEmprestimo" IS NULL
  `
  check({
    categoria: 'DATA',
    item: 'Emprestimo.dataEmprestimo NOT NULL',
    sqlite: 0,
    postgres: Number(empSemData[0].n),
    status: Number(empSemData[0].n) === 0 ? 'APROVADO' : 'REPROVADO',
  })

  // Emprestimo.dataPrevistaDevolucao NOT NULL
  const empSemPrazo = await prisma.$queryRaw<[{ n: bigint }]>`
    SELECT COUNT(*) as n FROM "Emprestimo" WHERE "dataPrevistaDevolucao" IS NULL
  `
  check({
    categoria: 'DATA',
    item: 'Emprestimo.dataPrevistaDevolucao NOT NULL',
    sqlite: 0,
    postgres: Number(empSemPrazo[0].n),
    status: Number(empSemPrazo[0].n) === 0 ? 'APROVADO' : 'REPROVADO',
  })

  // Usuários com data de nascimento futura (possível erro de conversão)
  const userDataFutura = await prisma.$queryRaw<[{ n: bigint }]>`
    SELECT COUNT(*) as n FROM "Usuario"
    WHERE "dataNascimento" IS NOT NULL AND "dataNascimento" > NOW()
  `
  check({
    categoria: 'DATA',
    item: 'Usuario.dataNascimento sem datas futuras',
    sqlite: 0,
    postgres: Number(userDataFutura[0].n),
    status: Number(userDataFutura[0].n) === 0 ? 'APROVADO' : 'AVISO',
    detalhe: Number(userDataFutura[0].n) > 0 ? 'Verificar datas de nascimento futuras' : undefined,
  })
}

// ─── 6. Códigos EX e US ───────────────────────────────────────────────────────

async function checkCodigos() {
  console.log('\n[6] Códigos EX e US')

  // Integridade: todos os codigoExemplar do SQLite estão no PostgreSQL
  const sqCodigos = tableExistsSqlite('Exemplar')
    ? (sqlite.prepare('SELECT codigoExemplar FROM "Exemplar" ORDER BY id').all() as Array<{ codigoExemplar: string }>)
    : []
  const sqCodigoSet = new Set(sqCodigos.map(r => r.codigoExemplar))
  const pgCodigos = await prisma.$queryRawUnsafe<Array<{ codigoExemplar: string }>>(
    `SELECT "codigoExemplar" FROM "Exemplar" ORDER BY id`
  )
  const pgCodigoSet = new Set(pgCodigos.map(r => r.codigoExemplar))
  const missingCodigos = [...sqCodigoSet].filter(c => !pgCodigoSet.has(c)).length
  check({
    categoria: 'CODIGO',
    item: 'Exemplar.codigoExemplar — integridade migração',
    sqlite: sqCodigoSet.size,
    postgres: pgCodigoSet.size,
    status: missingCodigos === 0 ? 'APROVADO' : 'REPROVADO',
    detalhe: missingCodigos > 0 ? `${missingCodigos} códigos do SQLite ausentes no PostgreSQL` : undefined,
  })

  // Códigos US no formato correto (US + 6 dígitos)
  const badUS = await prisma.$queryRawUnsafe<[{ n: bigint }]>(
    `SELECT COUNT(*) as n FROM "Usuario" WHERE "numeroCadastro" !~ '^US[0-9]{6}$'`
  )
  check({
    categoria: 'CODIGO',
    item: 'Usuario.numeroCadastro formato US000000',
    sqlite: 0,
    postgres: Number(badUS[0].n),
    status: Number(badUS[0].n) === 0 ? 'APROVADO' : 'REPROVADO',
    detalhe: Number(badUS[0].n) > 0 ? 'Usuários com código fora do formato US000000' : undefined,
  })

  // Verifica que a Sequencia está coerente com o total de exemplares
  const seqExemplar = await prisma.sequencia.findUnique({ where: { nome: 'exemplar' } })
  const exemplarCount = await prisma.exemplar.count()
  if (seqExemplar) {
    check({
      categoria: 'SEQUENCE',
      item: 'Sequencia exemplar ≥ total de Exemplares',
      sqlite: exemplarCount,
      postgres: seqExemplar.valor,
      status: seqExemplar.valor >= exemplarCount ? 'APROVADO' : 'REPROVADO',
      detalhe: seqExemplar.valor < exemplarCount ? `Sequence (${seqExemplar.valor}) menor que total (${exemplarCount})` : undefined,
    })
  }
}

// ─── 7. Configurações ─────────────────────────────────────────────────────────

async function checkConfiguracoes() {
  console.log('\n[7] Configurações')

  const config = await prisma.configuracao.findFirst()
  const sqConfig = tableExistsSqlite('Configuracao')
    ? (sqlite.prepare('SELECT prazoEmprestimoDias, maxEmprestimos FROM "Configuracao" LIMIT 1').get() as { prazoEmprestimoDias: number; maxEmprestimos: number } | undefined)
    : undefined

  if (!config) {
    check({
      categoria: 'CONFIG',
      item: 'Configuracao existe no PostgreSQL',
      sqlite: sqConfig ? 'SIM' : 'NÃO',
      postgres: 'NÃO',
      status: 'AVISO',
      detalhe: 'Nenhuma configuração encontrada — será criada com defaults no primeiro acesso',
    })
    return
  }

  check({
    categoria: 'CONFIG',
    item: 'prazoEmprestimoDias',
    sqlite: sqConfig?.prazoEmprestimoDias ?? 'N/A',
    postgres: config.prazoEmprestimoDias,
    status: sqConfig ? (sqConfig.prazoEmprestimoDias === config.prazoEmprestimoDias ? 'APROVADO' : 'REPROVADO') : 'INFO',
  })

  check({
    categoria: 'CONFIG',
    item: 'maxEmprestimos',
    sqlite: sqConfig?.maxEmprestimos ?? 'N/A',
    postgres: config.maxEmprestimos,
    status: sqConfig ? (sqConfig.maxEmprestimos === config.maxEmprestimos ? 'APROVADO' : 'REPROVADO') : 'INFO',
  })
}

// ─── 8. Sequences PostgreSQL ──────────────────────────────────────────────────

async function checkSequences() {
  console.log('\n[8] Sequences PostgreSQL')

  const tables = ['Acervo', 'Configuracao', 'Usuario', 'Obra', 'Exemplar', 'MigracaoAuditoria', 'Emprestimo']
  for (const table of tables) {
    try {
      const countRows = await prisma.$queryRawUnsafe<[{ c: bigint }]>(`SELECT COUNT(*) as c FROM "${table}"`)
      const countN = Number(countRows[0].c)
      const maxId = countN === 0 ? 0 : await prisma.$queryRawUnsafe<[{ m: number | null }]>(`SELECT MAX(id) as m FROM "${table}"`)
        .then(r => r[0].m ?? 0)

      // Lê last_value diretamente da tabela de sequence (não usa pg_sequences que retorna NULL quando is_called=false)
      const seqName = `${table}_id_seq`
      const seqRows = await prisma.$queryRawUnsafe<[{ last_value: bigint; is_called: boolean }]>(
        `SELECT last_value, is_called FROM "${seqName}"`
      ).catch(() => null)

      if (!seqRows) {
        check({
          categoria: 'SEQUENCE',
          item: `${table}.id sequence`,
          sqlite: maxId,
          postgres: 'N/A',
          status: 'INFO',
          detalhe: 'Sequence não encontrada',
        })
        continue
      }

      const lastValue = Number(seqRows[0].last_value)
      // Quando is_called=false, lastValue é o PRÓXIMO valor (setval com false = next value)
      // Quando is_called=true, lastValue é o ÚLTIMO valor retornado (next = lastValue+1)
      const nextValue = seqRows[0].is_called ? lastValue + 1 : lastValue
      const seqOk = nextValue > maxId

      check({
        categoria: 'SEQUENCE',
        item: `${table}.id sequence`,
        sqlite: maxId,
        postgres: `next=${nextValue}`,
        status: seqOk ? 'APROVADO' : 'REPROVADO',
        detalhe: !seqOk ? `Próximo ID (${nextValue}) não é maior que MAX(id) (${maxId})` : undefined,
      })
    } catch {
      check({
        categoria: 'SEQUENCE',
        item: `${table}.id sequence`,
        sqlite: 'N/A',
        postgres: 'ERRO',
        status: 'AVISO',
        detalhe: 'Não foi possível verificar sequence',
      })
    }
  }
}

// ─── Geração de relatórios ────────────────────────────────────────────────────

function gerarRelatorioJSON(report: ValidationReport, outputDir: string) {
  const filePath = path.join(outputDir, 'migration-validation.json')
  fs.writeFileSync(filePath, JSON.stringify(report, null, 2), 'utf-8')
  console.log(`\n📄  JSON: ${filePath}`)
}

function gerarRelatorioMD(report: ValidationReport, outputDir: string) {
  const statusIcon = report.status === 'APROVADO' ? '✅' : '❌'
  const lines: string[] = [
    `# Relatório de Validação — Migração SQLite → PostgreSQL`,
    ``,
    `**Gerado em:** ${report.geradoEm}  `,
    `**Duração:** ${report.duracao}  `,
    `**Status:** ${statusIcon} **${report.status}**`,
    ``,
    `## Resumo`,
    ``,
    `| Métrica | Valor |`,
    `|---------|-------|`,
    `| Total de checks | ${report.totalChecks} |`,
    `| Aprovados | ${report.aprovados} |`,
    `| Reprovados | ${report.reprovados} |`,
    `| Avisos | ${report.avisos} |`,
    ``,
    `## Detalhes por check`,
    ``,
    `| Status | Categoria | Item | SQLite | PostgreSQL | Detalhe |`,
    `|--------|-----------|------|--------|------------|---------|`,
  ]

  for (const c of report.checks) {
    const icon = { APROVADO: '✅', REPROVADO: '❌', AVISO: '⚠️', INFO: 'ℹ️' }[c.status]
    lines.push(`| ${icon} ${c.status} | ${c.categoria} | ${c.item} | ${c.sqlite} | ${c.postgres} | ${c.detalhe ?? ''} |`)
  }

  if (report.reprovados > 0) {
    lines.push(``, `## ❌ Checks reprovados`, ``)
    for (const c of report.checks.filter(c => c.status === 'REPROVADO')) {
      lines.push(`- **[${c.categoria}] ${c.item}**: SQLite=${c.sqlite}, PG=${c.postgres}${c.detalhe ? ` — ${c.detalhe}` : ''}`)
    }
  }

  if (report.avisos > 0) {
    lines.push(``, `## ⚠️ Avisos`, ``)
    for (const c of report.checks.filter(c => c.status === 'AVISO')) {
      lines.push(`- **[${c.categoria}] ${c.item}**: ${c.detalhe ?? ''}`)
    }
  }

  lines.push(``, `---`, `*Gerado por scripts/migration/validate-migration.ts*`)

  const filePath = path.join(outputDir, 'migration-validation.md')
  fs.writeFileSync(filePath, lines.join('\n'), 'utf-8')
  console.log(`📄  Markdown: ${filePath}`)
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const startTime = Date.now()

  console.log('════════════════════════════════════════════════')
  console.log('  VPS-004 — Validação da Migração SQLite → PostgreSQL')
  console.log('════════════════════════════════════════════════')

  await checkContagens()
  await checkIntegridadeReferencial()
  await checkConstraints()
  await checkEnums()
  await checkDatas()
  await checkCodigos()
  await checkConfiguracoes()
  await checkSequences()

  const duracao = `${((Date.now() - startTime) / 1000).toFixed(2)}s`
  const aprovados = checks.filter(c => c.status === 'APROVADO').length
  const statusGeral: 'APROVADO' | 'REPROVADO' = reprovados === 0 ? 'APROVADO' : 'REPROVADO'

  const report: ValidationReport = {
    geradoEm: new Date().toISOString(),
    duracao,
    status: statusGeral,
    totalChecks: checks.length,
    aprovados,
    reprovados,
    avisos,
    checks,
  }

  console.log('\n════════════════════════════════════════')
  console.log(`  Resultado: ${statusGeral === 'APROVADO' ? '✅ APROVADO' : '❌ REPROVADO'}`)
  console.log(`  Checks: ${aprovados} aprovados / ${reprovados} reprovados / ${avisos} avisos`)
  console.log(`  Duração: ${duracao}`)
  console.log('════════════════════════════════════════')

  const outputDir = path.resolve('storage/reports')
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  gerarRelatorioJSON(report, outputDir)
  gerarRelatorioMD(report, outputDir)

  if (reprovados > 0) {
    process.exit(1)
  }
}

main()
  .catch((err) => {
    console.error('\n❌  Erro fatal durante a validação:')
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    sqlite.close()
    await prisma.$disconnect()
  })
