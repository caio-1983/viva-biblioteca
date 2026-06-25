/**
 * ETAPA 2 — Script 04: Validação de Integridade
 *
 * Verifica todas as asserções de integridade após a migração de dados.
 * BLOQUEANTE: acumula todos os erros e encerra com exit(1) se qualquer
 * validação falhar — não interrompe na primeira falha para exibir o quadro completo.
 *
 * Deve ser executado após os Scripts 01, 02, 02b e 03.
 * Se falhar, NÃO avance para o Passo 6 (Fase 2 destrutiva).
 *
 * Execução (da raiz do projeto):
 *   npx tsx scripts/etapa2/04-validate.ts
 */

import { prisma, disconnect } from './_prisma'

interface Assertion {
  name: string
  passed: boolean
  detail: string
}

async function assert(
  name: string,
  fn: () => Promise<string>,
): Promise<Assertion> {
  try {
    const detail = await fn()
    return { name, passed: true, detail }
  } catch (err) {
    return { name, passed: false, detail: err instanceof Error ? err.message : String(err) }
  }
}

// Lança erro com mensagem; o assert() captura e marca como falha
function fail(msg: string): never {
  throw new Error(msg)
}

async function main(): Promise<void> {
  console.log('╔══════════════════════════════════════════════════╗')
  console.log('║  ETAPA 2 — Script 04: Validação de Integridade   ║')
  console.log('╚══════════════════════════════════════════════════╝\n')

  const assertions: Assertion[] = []

  const totalAcervos = await prisma.acervo.count()
  console.log(`Referência: ${totalAcervos} registros em Acervo\n`)

  // ── A1: Contagem ────────────────────────────────────────────────────────
  assertions.push(await assert(
    'A1: COUNT(Exemplar) == COUNT(Acervo)',
    async () => {
      const n = await prisma.exemplar.count()
      if (n !== totalAcervos) fail(`Exemplar=${n}, Acervo=${totalAcervos}`)
      return `${n} exemplares`
    },
  ))

  assertions.push(await assert(
    'A2: COUNT(MigracaoAuditoria) == COUNT(Acervo)',
    async () => {
      const n = await prisma.migracaoAuditoria.count()
      if (n !== totalAcervos) fail(`Auditoria=${n}, Acervo=${totalAcervos}`)
      return `${n} registros de auditoria`
    },
  ))

  // ── A3: Unicidade ───────────────────────────────────────────────────────
  assertions.push(await assert(
    'A3: MigracaoAuditoria.acervoId sem duplicatas',
    async () => {
      const rows = await prisma.$queryRaw<Array<{ n: number }>>`
        SELECT COUNT(*) AS n FROM (
          SELECT acervoId FROM MigracaoAuditoria GROUP BY acervoId HAVING COUNT(*) > 1
        )
      `
      const n = Number(rows[0]?.n ?? 0)
      if (n > 0) fail(`${n} acervoId(s) duplicados em MigracaoAuditoria`)
      return 'todos únicos'
    },
  ))

  assertions.push(await assert(
    'A4: MigracaoAuditoria.exemplarId sem duplicatas',
    async () => {
      const rows = await prisma.$queryRaw<Array<{ n: number }>>`
        SELECT COUNT(*) AS n FROM (
          SELECT exemplarId FROM MigracaoAuditoria GROUP BY exemplarId HAVING COUNT(*) > 1
        )
      `
      const n = Number(rows[0]?.n ?? 0)
      if (n > 0) fail(`${n} exemplarId(s) duplicados em MigracaoAuditoria`)
      return 'todos únicos'
    },
  ))

  // ── A4: Cobertura — todo Acervo tem entrada em MigracaoAuditoria ────────
  assertions.push(await assert(
    'A5: Todo Acervo está em MigracaoAuditoria',
    async () => {
      const rows = await prisma.$queryRaw<Array<{ n: number }>>`
        SELECT COUNT(*) AS n FROM Acervo a
        WHERE NOT EXISTS (
          SELECT 1 FROM MigracaoAuditoria m WHERE m.acervoId = a.id
        )
      `
      const n = Number(rows[0]?.n ?? 0)
      if (n > 0) fail(`${n} Acervo(s) sem entrada em MigracaoAuditoria`)
      return 'cobertura 100%'
    },
  ))

  // ── A5: codigoExemplar preservados — cada Exemplar tem o mesmo código do Acervo ─
  assertions.push(await assert(
    'A6: codigoExemplar preservado (Exemplar == Acervo.numeroExemplar)',
    async () => {
      const rows = await prisma.$queryRaw<Array<{ n: number }>>`
        SELECT COUNT(*) AS n
        FROM MigracaoAuditoria m
        JOIN Exemplar ex ON ex.id = m.exemplarId
        JOIN Acervo ac  ON ac.id = m.acervoId
        WHERE ex.codigoExemplar != ac.numeroExemplar
      `
      const n = Number(rows[0]?.n ?? 0)
      if (n > 0) fail(`${n} Exemplar(es) com codigoExemplar diferente do Acervo original`)
      return 'todos preservados'
    },
  ))

  // ── A6: Exemplar.obraId referencia Obra existente ──────────────────────
  assertions.push(await assert(
    'A7: Exemplar.obraId sem orphans',
    async () => {
      const rows = await prisma.$queryRaw<Array<{ n: number }>>`
        SELECT COUNT(*) AS n FROM Exemplar e
        WHERE NOT EXISTS (SELECT 1 FROM Obra o WHERE o.id = e.obraId)
      `
      const n = Number(rows[0]?.n ?? 0)
      if (n > 0) fail(`${n} Exemplar(es) com obraId inexistente`)
      return 'sem orphans'
    },
  ))

  // ── A7: Todos os status em Exemplar são válidos ─────────────────────────
  assertions.push(await assert(
    'A8: Status válidos em Exemplar (ADR-008)',
    async () => {
      const rows = await prisma.$queryRaw<Array<{ status: string; n: number }>>`
        SELECT status, COUNT(*) AS n FROM Exemplar
        WHERE status NOT IN (
          'DISPONIVEL','EMPRESTADO','RESERVADO','MANUTENCAO','EXTRAVIADO','BAIXADO'
        )
        GROUP BY status
      `
      if (rows.length > 0) {
        const detail = rows.map(r => `'${r.status}' (${r.n}x)`).join(', ')
        fail(`Status inválidos em Exemplar: ${detail}`)
      }
      return 'todos válidos'
    },
  ))

  // ── A8: Sequencia 'exemplar' existe e está correta ──────────────────────
  assertions.push(await assert(
    "A9: Sequencia 'exemplar' inicializada",
    async () => {
      const seq = await prisma.sequencia.findUnique({ where: { nome: 'exemplar' } })
      if (!seq) fail("Sequencia 'exemplar' não encontrada — execute 02b-seed-sequencia.ts")

      // Valor deve ser >= ao maior número EX dos Exemplares
      const exemplares = await prisma.exemplar.findMany({ select: { codigoExemplar: true } })
      const maxValor = exemplares.reduce((acc, { codigoExemplar }) => {
        const match = codigoExemplar.match(/^EX(\d+)$/)
        return match ? Math.max(acc, parseInt(match[1], 10)) : acc
      }, 0)

      if (seq!.valor < maxValor) {
        fail(`Sequencia.valor=${seq!.valor} < maxCodigoEX=${maxValor} — risco de duplicata`)
      }
      return `valor=${seq!.valor} (máximo EX migrado: ${maxValor})`
    },
  ))

  // ── A9: Verificação de Empréstimos (se a coluna exemplarId existe) ──────
  const colExists = await prisma.$queryRaw<Array<{ name: string }>>`
    SELECT name FROM pragma_table_info('Emprestimo') WHERE name='exemplarId'
  `
  if (colExists.length > 0) {
    assertions.push(await assert(
      'A10: Emprestimo.exemplarId preenchido em todos os registros',
      async () => {
        const semExemplarId = await prisma.$queryRaw<Array<{ n: number }>>`
          SELECT COUNT(*) AS n FROM Emprestimo WHERE exemplarId IS NULL
        `
        const n = Number(semExemplarId[0]?.n ?? 0)
        if (n > 0) fail(`${n} Empréstimo(s) sem exemplarId — execute 03-migrate-emprestimos.ts`)
        const total = await prisma.emprestimo.count()
        return `${total} empréstimos com exemplarId`
      },
    ))

    assertions.push(await assert(
      'A11: Emprestimo.exemplarId referencia Exemplar existente',
      async () => {
        const rows = await prisma.$queryRaw<Array<{ n: number }>>`
          SELECT COUNT(*) AS n FROM Emprestimo e
          WHERE e.exemplarId IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM Exemplar ex WHERE ex.id = e.exemplarId)
        `
        const n = Number(rows[0]?.n ?? 0)
        if (n > 0) fail(`${n} Empréstimo(s) com exemplarId inexistente`)
        return 'sem orphans'
      },
    ))
  } else {
    console.log('ℹ️   Emprestimo.exemplarId ainda não existe (Script 03 não foi executado)')
    console.log('     As validações A10/A11 serão verificadas após o Passo 5.\n')
  }

  // ── Relatório ─────────────────────────────────────────────────────────────
  console.log('Resultados:')
  for (const a of assertions) {
    const icon = a.passed ? '  ✅' : '  ❌'
    const extra = a.passed ? `  →  ${a.detail}` : `  →  ${a.detail}`
    console.log(`${icon}  ${a.name}${extra}`)
  }

  const failed = assertions.filter(a => !a.passed)
  console.log('')

  if (failed.length > 0) {
    console.error(`🚫  ${failed.length} validação(ões) falhou/falharam.`)
    console.error('    Corrija os problemas antes de avançar para o Passo 6 (Fase 2 destrutiva).\n')
    process.exit(1)
  }

  // Informativo: needsReview
  const needsReview = await prisma.migracaoAuditoria.count({ where: { needsReview: true } })
  const totalObras = await prisma.obra.count()

  console.log('Sumário da migração:')
  console.log(`  Acervos     : ${totalAcervos}`)
  console.log(`  Obras       : ${totalObras} (${totalAcervos - totalObras} deduplicados)`)
  console.log(`  Exemplares  : ${totalAcervos}`)
  console.log(`  needsReview : ${needsReview} (estratégia INDIVIDUAL — revisar manualmente)`)
  console.log('')
  console.log('✅  Validação de integridade OK. Pronto para o Passo 6 (Fase 2 destrutiva).\n')
}

main()
  .catch(err => { console.error('Erro inesperado:', err); process.exit(1) })
  .finally(() => disconnect())
