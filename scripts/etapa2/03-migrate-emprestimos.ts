/**
 * ETAPA 2 — Script 03: Migração de Empréstimos (acervoId → exemplarId)
 *
 * PRÉ-REQUISITO: Emprestimo.exemplarId (nullable Int) deve existir no banco.
 * A coluna foi adicionada pela migration etapa2_fase1b_emprestimo_exemplarId.
 * Se por algum motivo não existir, o script encerra com exit(1) e orienta o próximo passo.
 *
 * IDEMPOTENTE — 3 garantias:
 *   1. Se todos os Empréstimos já têm exemplarId → skip total
 *   2. WHERE exemplarId IS NULL: apenas registros pendentes são processados
 *   3. Execução parcial (interrupção) → seguro re-executar, retoma do ponto parado
 *
 * Execução (da raiz do projeto):
 *   npm run migrate:emprestimos
 *   — ou —
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

  // Idempotência — garantia 1: skip total se todos já estão preenchidos
  const pendentes = await prisma.emprestimo.count({ where: { exemplarId: null } })
  if (pendentes === 0 && totalEmprestimos > 0) {
    console.log('ℹ️   Todos os Empréstimos já têm exemplarId preenchido.')
    console.log('     Script 03 já foi executado — pulando.\n')
    return
  }
  const jaPreenchidos = totalEmprestimos - pendentes
  if (jaPreenchidos > 0) {
    console.log(`ℹ️   ${jaPreenchidos} já preenchidos, ${pendentes} pendentes (retomando).`)
  }

  // Busca mapeamentos acervoId → exemplarId
  const auditorias = await prisma.migracaoAuditoria.findMany({
    select: { acervoId: true, exemplarId: true },
  })
  const acervoParaExemplar = new Map(auditorias.map(a => [a.acervoId, a.exemplarId]))

  // Idempotência — garantia 2: WHERE exemplarId IS NULL — só processa pendentes
  const empretimosPendentes = await prisma.emprestimo.findMany({
    where: { exemplarId: null },
    select: { id: true, acervoId: true },
  })

  console.log('\nAtualizando Empréstimos pendentes...')
  let atualizados = 0
  let semMapeamento = 0

  for (const emp of empretimosPendentes) {
    const exemplarId = acervoParaExemplar.get(emp.acervoId)

    if (!exemplarId) {
      semMapeamento++
      console.warn(`  ⚠️  Emprestimo #${emp.id}: acervoId=${emp.acervoId} sem Exemplar em MigracaoAuditoria`)
      continue
    }

    // Prisma ORM: coluna exemplarId agora está no schema (migration etapa2_fase1b)
    await prisma.emprestimo.update({ where: { id: emp.id }, data: { exemplarId } })
    atualizados++
  }

  console.log(`\n  ✅ ${atualizados} Empréstimo(s) atualizados`)
  if (semMapeamento > 0) {
    console.error(`  ❌ ${semMapeamento} Empréstimo(s) sem mapeamento — verifique MigracaoAuditoria`)
    process.exit(1)
  }

  console.log('\n✅  Script 03 concluído.\n')
}

main()
  .catch(err => { console.error('Erro inesperado:', err); process.exit(1) })
  .finally(() => disconnect())
