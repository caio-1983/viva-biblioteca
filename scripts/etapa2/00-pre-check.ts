/**
 * ETAPA 2 — Script 00: Pré-verificação do ambiente
 *
 * Verifica pré-condições antes de iniciar a migração de dados.
 * BLOQUEANTE: encerra com exit(1) se qualquer condição não for satisfeita.
 *
 * Execução (da raiz do projeto):
 *   npx tsx scripts/etapa2/00-pre-check.ts
 */

import { prisma, disconnect } from './_prisma'

interface CheckResult {
  name: string
  passed: boolean
  detail: string
}

async function check(name: string, fn: () => Promise<void>): Promise<CheckResult> {
  try {
    await fn()
    return { name, passed: true, detail: 'OK' }
  } catch (err) {
    return { name, passed: false, detail: err instanceof Error ? err.message : String(err) }
  }
}

async function main(): Promise<void> {
  console.log('╔══════════════════════════════════════════════════╗')
  console.log('║  ETAPA 2 — Script 00: Pré-verificação            ║')
  console.log('╚══════════════════════════════════════════════════╝\n')

  const results: CheckResult[] = []

  // 1. Conexão com o banco
  results.push(await check('Conexão com o banco de dados', async () => {
    await prisma.$queryRaw`SELECT 1`
  }))

  // 2. Tabelas obrigatórias existem
  const requiredTables = [
    'Acervo', 'Obra', 'Exemplar', 'MigracaoAuditoria',
    'Sequencia', 'Emprestimo', 'Usuario',
  ]
  for (const table of requiredTables) {
    results.push(await check(`Tabela existe: ${table}`, async () => {
      const rows = await prisma.$queryRawUnsafe<Array<{ name: string }>>(
        `SELECT name FROM sqlite_master WHERE type='table' AND name=?`, table,
      )
      if (rows.length === 0) throw new Error(`tabela "${table}" não encontrada no banco`)
    }))
  }

  // 3. Acervo tem registros
  let totalAcervos = 0
  results.push(await check('Acervo tem registros', async () => {
    totalAcervos = await prisma.acervo.count()
    if (totalAcervos === 0) throw new Error('Acervo está vazio — nada a migrar')
  }))

  // 4. Sem códigos TEMP em Acervo.numeroExemplar (resquício de criações incompletas)
  results.push(await check('Sem códigos TEMP em Acervo.numeroExemplar', async () => {
    const count = await prisma.acervo.count({
      where: { numeroExemplar: { startsWith: 'TEMP' } },
    })
    if (count > 0) {
      throw new Error(
        `${count} registro(s) com numeroExemplar iniciando em "TEMP" — ` +
        `corrija antes de migrar (podem ser criações interrompidas)`,
      )
    }
  }))

  // 5. Todos os status em Acervo são StatusExemplar válidos (ADR-008)
  results.push(await check('Status válidos em Acervo (ADR-008)', async () => {
    const invalid = await prisma.$queryRaw<Array<{ status: string; n: number }>>`
      SELECT status, COUNT(*) AS n FROM Acervo
      WHERE status NOT IN (
        'DISPONIVEL','EMPRESTADO','RESERVADO','MANUTENCAO','EXTRAVIADO','BAIXADO'
      )
      GROUP BY status
    `
    if (invalid.length > 0) {
      const detail = invalid.map(r => `'${r.status}' (${r.n}x)`).join(', ')
      throw new Error(`Status inválidos encontrados: ${detail}`)
    }
  }))

  // 6. Nenhum Emprestimo aponta para Acervo inexistente (integridade referencial)
  results.push(await check('Sem Emprestimo com acervoId órfão', async () => {
    const rows = await prisma.$queryRaw<Array<{ n: number }>>`
      SELECT COUNT(*) AS n FROM Emprestimo e
      WHERE NOT EXISTS (SELECT 1 FROM Acervo a WHERE a.id = e.acervoId)
    `
    const n = Number(rows[0]?.n ?? 0)
    if (n > 0) throw new Error(`${n} Emprestimo(s) referenciam Acervo inexistente`)
  }))

  // 7. Estado da migração: deve estar vazio (pronto para iniciar) ou completo (idempotente)
  // string não-literal impede TypeScript de estreitar o tipo via controle de fluxo
  // através do closure assíncrono, que não é rastreado pelo analisador
  let migrationState = 'empty'
  results.push(await check('Estado de migração consistente', async () => {
    const obraCount = await prisma.obra.count()
    const exemplarCount = await prisma.exemplar.count()
    const auditCount = await prisma.migracaoAuditoria.count()

    const allEmpty = obraCount === 0 && exemplarCount === 0 && auditCount === 0
    const allFull =
      auditCount === totalAcervos &&
      exemplarCount === totalAcervos &&
      obraCount > 0

    if (allEmpty) {
      migrationState = 'empty'
      return
    }
    if (allFull) {
      migrationState = 'complete'
      return
    }

    migrationState = 'partial'
    throw new Error(
      `Estado parcial detectado — ` +
      `Acervo: ${totalAcervos}, Obra: ${obraCount}, ` +
      `Exemplar: ${exemplarCount}, Auditoria: ${auditCount}. ` +
      `Execute rollback.ts para limpar e reiniciar.`,
    )
  }))

  // --- Relatório ---
  console.log('Resultados:')
  for (const r of results) {
    const icon = r.passed ? '  ✅' : '  ❌'
    const extra = r.passed && r.detail === 'OK' ? '' : `  →  ${r.detail}`
    console.log(`${icon}  ${r.name}${extra}`)
  }

  const failed = results.filter(r => !r.passed)
  console.log('')

  if (failed.length > 0) {
    console.error(`🚫  ${failed.length} pré-condição(ões) não satisfeita(s). Corrija antes de prosseguir.\n`)
    process.exit(1)
  }

  if (migrationState === 'complete') {
    console.log('ℹ️   Migração já concluída anteriormente. Scripts 01–03 podem ser pulados.')
    console.log('     Execute 04-validate.ts para re-verificar a integridade.\n')
  } else {
    console.log(`✅  Pré-verificação OK — ${totalAcervos} registro(s) prontos para migração.\n`)
  }
}

main()
  .catch(err => { console.error('Erro inesperado:', err); process.exit(1) })
  .finally(() => disconnect())
