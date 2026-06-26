/**
 * ETAPA 2 — Script 05: Exportação de Relatórios
 *
 * Gera os seguintes arquivos em scripts/etapa2/reports/:
 *   migration-audit-<ts>.csv        — todos os registros de MigracaoAuditoria
 *   migration-audit-<ts>.json       — idem em JSON
 *   needs-review-<ts>.csv           — registros needsReview=true com dados do Acervo original
 *   migration-summary-<ts>.json     — estatísticas consolidadas da execução
 *
 * Execução (da raiz do projeto):
 *   npx tsx scripts/etapa2/05-export-reports.ts
 */

import fs from 'fs'
import path from 'path'
import { prisma, disconnect } from './_prisma'

// Versão semântica dos scripts de migração de dados da Etapa 2.
// Incrementar ao modificar a lógica de qualquer script desta etapa.
const MIGRATION_VERSION = '1.1.0'

const REPORTS_DIR = path.join(process.cwd(), 'scripts', 'etapa2', 'reports')

// ─── CSV ──────────────────────────────────────────────────────────────────────

type Row = Record<string, unknown>

function toCsv(rows: Row[]): string {
  if (rows.length === 0) return ''
  const headers = Object.keys(rows[0])
  const escape = (v: unknown): string => {
    const s = v == null ? '' : String(v)
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"`
      : s
  }
  return [
    headers.join(','),
    ...rows.map(r => headers.map(h => escape(r[h])).join(',')),
  ].join('\n')
}

function writeReport(filename: string, content: string): void {
  const filepath = path.join(REPORTS_DIR, filename)
  fs.writeFileSync(filepath, content, 'utf-8')
  const kb = (Buffer.byteLength(content, 'utf-8') / 1024).toFixed(1)
  console.log(`  📄 ${filename}  (${kb} KB)`)
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('╔══════════════════════════════════════════════════╗')
  console.log('║  ETAPA 2 — Script 05: Exportação de Relatórios   ║')
  console.log('╚══════════════════════════════════════════════════╝\n')

  const totalAudit = await prisma.migracaoAuditoria.count()
  if (totalAudit === 0) {
    console.error('❌  MigracaoAuditoria está vazia — execute os Scripts 01–03 antes.\n')
    process.exit(1)
  }

  fs.mkdirSync(REPORTS_DIR, { recursive: true })

  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  console.log(`Gerando relatórios (timestamp: ${ts})...\n`)

  // ── 1. Auditoria completa ──────────────────────────────────────────────
  const auditorias = await prisma.migracaoAuditoria.findMany({
    orderBy: { acervoId: 'asc' },
  })

  writeReport(`migration-audit-${ts}.csv`, toCsv(auditorias as unknown as Row[]))
  writeReport(`migration-audit-${ts}.json`, JSON.stringify(auditorias, null, 2))

  // ── 2. needsReview ────────────────────────────────────────────────────
  const needsReviewIds = auditorias.filter(a => a.needsReview).map(a => a.acervoId)
  const needsReviewRows: Row[] = []

  if (needsReviewIds.length > 0) {
    const acervos = await prisma.acervo.findMany({
      where: { id: { in: needsReviewIds } },
      orderBy: { id: 'asc' },
    })
    const auditByAcervo = new Map(auditorias.map(a => [a.acervoId, a]))

    for (const ac of acervos) {
      const aud = auditByAcervo.get(ac.id)!
      needsReviewRows.push({
        acervoId: ac.id,
        exemplarId: aud.exemplarId,
        obraId: aud.obraId,
        chaveDeduplicacao: aud.chaveDeduplicacao,
        titulo: ac.titulo,
        autor: ac.autor,
        isbn: ac.isbn,
        editora: ac.editora,
        edicao: ac.edicao,
        numeroExemplar: ac.numeroExemplar,
        status: ac.status,
        ativo: ac.ativo,
      })
    }
  }

  writeReport(
    `needs-review-${ts}.csv`,
    needsReviewRows.length > 0 ? toCsv(needsReviewRows) : 'acervoId,motivo\n(nenhum registro para revisão)',
  )

  // ── 3. Resumo / migration-summary ─────────────────────────────────────
  const totalAcervos = await prisma.acervo.count()
  const totalObras = await prisma.obra.count()
  const totalExemplares = await prisma.exemplar.count()
  const totalEmprestimos = await prisma.emprestimo.count()

  const porEstrategia = {
    ISBN: auditorias.filter(a => a.estrategia === 'ISBN').length,
    COMPOSTA: auditorias.filter(a => a.estrategia === 'COMPOSTA').length,
    INDIVIDUAL: auditorias.filter(a => a.estrategia === 'INDIVIDUAL').length,
  }

  // Emprestimos com exemplarId preenchido (coluna pode não existir ainda)
  let emprestimosComExemplarId = 0
  const colExists = await prisma.$queryRaw<Array<{ name: string }>>`
    SELECT name FROM pragma_table_info('Emprestimo') WHERE name='exemplarId'
  `
  if (colExists.length > 0) {
    const rows = await prisma.$queryRaw<Array<{ n: number }>>`
      SELECT COUNT(*) AS n FROM Emprestimo WHERE exemplarId IS NOT NULL
    `
    emprestimosComExemplarId = Number(rows[0]?.n ?? 0)
  }

  const seq = await prisma.sequencia.findUnique({ where: { nome: 'exemplar' } })

  // schemaVersion: nome da última migration Prisma aplicada — rastreabilidade do DDL
  const lastMigration = await prisma.$queryRaw<Array<{ migration_name: string }>>`
    SELECT migration_name FROM _prisma_migrations
    WHERE finished_at IS NOT NULL
    ORDER BY finished_at DESC
    LIMIT 1
  `
  const schemaVersion = lastMigration[0]?.migration_name ?? 'unknown'

  const summary = {
    executedAt: new Date().toISOString(),
    migrationVersion: MIGRATION_VERSION,
    schemaVersion,
    totais: {
      acervos: totalAcervos,
      obrasCreadas: totalObras,
      deduplicados: totalAcervos - totalObras,
      exemplaresCriados: totalExemplares,
      emprestimosTotal: totalEmprestimos,
      emprestimosComExemplarId,
    },
    porEstrategia: {
      ISBN: {
        acervos: porEstrategia.ISBN,
        obrasUnicas: auditorias
          .filter(a => a.estrategia === 'ISBN')
          .reduce((set, a) => set.add(a.obraId), new Set<number>()).size,
      },
      COMPOSTA: {
        acervos: porEstrategia.COMPOSTA,
        obrasUnicas: auditorias
          .filter(a => a.estrategia === 'COMPOSTA')
          .reduce((set, a) => set.add(a.obraId), new Set<number>()).size,
      },
      INDIVIDUAL: {
        acervos: porEstrategia.INDIVIDUAL,
        obrasUnicas: porEstrategia.INDIVIDUAL,  // 1 obra por acervo na estratégia INDIVIDUAL
      },
    },
    needsReview: {
      total: needsReviewIds.length,
      acervoIds: needsReviewIds,
    },
    sequencia: {
      nome: 'exemplar',
      valorAtual: seq?.valor ?? null,
      proximoCodigo: seq ? `EX${String(seq.valor + 1).padStart(6, '0')}` : null,
    },
  }

  writeReport(`migration-summary-${ts}.json`, JSON.stringify(summary, null, 2))

  // ── Impressão do resumo ────────────────────────────────────────────────
  console.log('\nResumo:')
  console.log(`  Acervos          : ${totalAcervos}`)
  console.log(`  Obras criadas    : ${totalObras}  (${totalAcervos - totalObras} deduplicados)`)
  console.log(`  Exemplares       : ${totalExemplares}`)
  console.log(`  Por estratégia   : ISBN=${porEstrategia.ISBN}, COMPOSTA=${porEstrategia.COMPOSTA}, INDIVIDUAL=${porEstrategia.INDIVIDUAL}`)
  console.log(`  needsReview      : ${needsReviewIds.length}`)
  console.log(`  Sequencia EX     : ${seq?.valor ?? 'não inicializada'}`)
  console.log('')

  if (needsReviewIds.length > 0) {
    console.log(`⚠️   ${needsReviewIds.length} registro(s) necessitam revisão manual do bibliotecário.`)
    console.log(`     Consulte: needs-review-${ts}.csv\n`)
  }

  console.log(`📁  Relatórios salvos em: scripts/etapa2/reports/`)
  console.log('\n✅  Script 05 concluído.\n')
}

main()
  .catch(err => { console.error('Erro inesperado:', err); process.exit(1) })
  .finally(() => disconnect())
