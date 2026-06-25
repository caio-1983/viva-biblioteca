/**
 * ETAPA 2 — Script 03: Migração de Empréstimos (acervoId → exemplarId)
 *
 * PRÉ-REQUISITO: a coluna Emprestimo.exemplarId (nullable Int) deve existir no banco.
 * Ela é adicionada como migration aditiva antes de executar este script (parte do Passo 5).
 * Se a coluna não existir, o script encerra com exit(1) e fornece instruções.
 *
 * Para cada Emprestimo: consulta MigracaoAuditoria pelo acervoId e preenche exemplarId.
 * Usa SQL direto ($executeRaw) porque a coluna exemplarId não está no schema atual
 * do Prisma Client (será adicionada junto com o Passo 5).
 *
 * IDEMPOTENTE: pula registros onde exemplarId já está preenchido.
 *
 * Execução (da raiz do projeto):
 *   npx tsx scripts/etapa2/03-migrate-emprestimos.ts
 */

import { prisma, disconnect } from './_prisma'

async function main(): Promise<void> {
  console.log('╔══════════════════════════════════════════════════╗')
  console.log('║  ETAPA 2 — Script 03: Migração de Empréstimos    ║')
  console.log('╚══════════════════════════════════════════════════╝\n')

  // Pré-condição 1: MigracaoAuditoria deve ter dados (Script 02 deve ter rodado)
  const auditCount = await prisma.migracaoAuditoria.count()
  if (auditCount === 0) {
    console.error('❌  MigracaoAuditoria está vazia.')
    console.error('    Execute os Scripts 01 e 02 antes de continuar.\n')
    process.exit(1)
  }

  // Pré-condição 2: coluna Emprestimo.exemplarId deve existir
  // A coluna é adicionada por migration aditiva antes de executar este script.
  const colExists = await prisma.$queryRaw<Array<{ name: string }>>`
    SELECT name FROM pragma_table_info('Emprestimo') WHERE name='exemplarId'
  `
  if (colExists.length === 0) {
    console.error('❌  Coluna Emprestimo.exemplarId não existe no banco.')
    console.error('')
    console.error('    Para adicionar a coluna, adicione ao schema.prisma:')
    console.error('')
    console.error('      model Emprestimo {')
    console.error('        // ... campos existentes ...')
    console.error('        exemplarId Int?')
    console.error('        exemplar   Exemplar? @relation(fields: [exemplarId], references: [id], onDelete: Restrict)')
    console.error('      }')
    console.error('')
    console.error('      model Exemplar {')
    console.error('        // ... campos existentes ...')
    console.error('        emprestimos Emprestimo[]')
    console.error('      }')
    console.error('')
    console.error('    Em seguida: npx prisma migrate dev --name etapa2-fase1b-emprestimo-exemplarId')
    console.error('    Depois execute este script novamente.\n')
    process.exit(1)
  }

  const totalEmprestimos = await prisma.emprestimo.count()
  console.log(`Total de Empréstimos: ${totalEmprestimos}`)

  // Idempotência: conta quantos já têm exemplarId preenchido
  const jaPreenchidos = await prisma.$queryRaw<Array<{ n: number }>>`
    SELECT COUNT(*) AS n FROM Emprestimo WHERE exemplarId IS NOT NULL
  `
  const nJaPreenchidos = Number(jaPreenchidos[0]?.n ?? 0)

  if (nJaPreenchidos === totalEmprestimos && totalEmprestimos > 0) {
    console.log('ℹ️   Todos os Empréstimos já têm exemplarId preenchido.')
    console.log('     Script 03 já foi executado — pulando.\n')
    return
  }

  if (nJaPreenchidos > 0) {
    console.log(`ℹ️   ${nJaPreenchidos} já preenchidos, ${totalEmprestimos - nJaPreenchidos} pendentes.`)
  }

  // Busca todos os mapeamentos acervoId → exemplarId da MigracaoAuditoria
  const auditorias = await prisma.migracaoAuditoria.findMany({
    select: { acervoId: true, exemplarId: true },
  })
  const acervoParaExemplar = new Map(auditorias.map(a => [a.acervoId, a.exemplarId]))

  console.log('\nAtualizando Empréstimos...')
  let atualizados = 0
  let semMapeamento = 0

  const emprestimos = await prisma.emprestimo.findMany({
    select: { id: true, acervoId: true },
  })

  for (const emp of emprestimos) {
    const exemplarId = acervoParaExemplar.get(emp.acervoId)

    if (!exemplarId) {
      semMapeamento++
      console.warn(`  ⚠️  Emprestimo #${emp.id}: acervoId=${emp.acervoId} sem Exemplar correspondente`)
      continue
    }

    await prisma.$executeRaw`
      UPDATE Emprestimo SET exemplarId = ${exemplarId} WHERE id = ${emp.id}
    `
    atualizados++
  }

  console.log(`\n  ✅ ${atualizados} Empréstimo(s) atualizados com exemplarId`)
  if (semMapeamento > 0) {
    console.error(`  ❌ ${semMapeamento} Empréstimo(s) sem mapeamento — verifique MigracaoAuditoria`)
    process.exit(1)
  }

  console.log('\n✅  Script 03 concluído.\n')
}

main()
  .catch(err => { console.error('Erro inesperado:', err); process.exit(1) })
  .finally(() => disconnect())
