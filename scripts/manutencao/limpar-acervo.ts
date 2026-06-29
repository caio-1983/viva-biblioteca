/**
 * MAINT-001 — Limpar Acervo e Empréstimos
 *
 * Remove todos os empréstimos, exemplares e obras do banco, preservando
 * usuários, configurações e demais tabelas administrativas.
 *
 * Ordem de exclusão (respeita chaves estrangeiras):
 *   1. Emprestimo  (referencia Exemplar e Usuario)
 *   2. Exemplar    (referencia Obra)
 *   3. Obra
 *
 * Ao final, reinicia a Sequencia 'exemplar' para 0 — o próximo exemplar
 * cadastrado receberá o código EX000001.
 *
 * Toda a operação é executada dentro de uma única transação.
 *
 * Execução (da raiz do projeto):
 *   npm run manutencao:limpar-acervo
 *   -- ou --
 *   npx tsx scripts/manutencao/limpar-acervo.ts
 */

import { prisma, disconnect } from './_prisma'

async function main(): Promise<void> {
  console.log('╔══════════════════════════════════════════════════╗')
  console.log('║  MAINT-001 — Limpar Acervo e Empréstimos         ║')
  console.log('╚══════════════════════════════════════════════════╝\n')

  const [totalEmprestimos, totalExemplares, totalObras, seq] = await Promise.all([
    prisma.emprestimo.count(),
    prisma.exemplar.count(),
    prisma.obra.count(),
    prisma.sequencia.findUnique({ where: { nome: 'exemplar' } }),
  ])

  console.log('Estado atual:')
  console.log(`  Empréstimos  : ${totalEmprestimos}`)
  console.log(`  Exemplares   : ${totalExemplares}`)
  console.log(`  Obras        : ${totalObras}`)
  console.log(`  Seq exemplar : ${seq ? seq.valor : '(não existe)'}`)
  console.log('')

  const resultado = await prisma.$transaction(async (tx) => {
    const emprestimos = await tx.emprestimo.deleteMany()
    const exemplares  = await tx.exemplar.deleteMany()
    const obras       = await tx.obra.deleteMany()

    await tx.sequencia.upsert({
      where:  { nome: 'exemplar' },
      update: { valor: 0 },
      create: { nome: 'exemplar', valor: 0 },
    })

    return { emprestimos, exemplares, obras }
  })

  console.log('Resultado:')
  console.log(`  ✅ Empréstimos removidos : ${resultado.emprestimos.count}`)
  console.log(`  ✅ Exemplares removidos  : ${resultado.exemplares.count}`)
  console.log(`  ✅ Obras removidas       : ${resultado.obras.count}`)
  console.log(`  ✅ Sequencia 'exemplar'  : reiniciada para 0`)
  console.log('')
  console.log('  → Próximo código de exemplar: EX000001')
  console.log('\n✅  Limpeza concluída com sucesso.\n')
}

main()
  .catch(err => { console.error('Erro inesperado:', err); process.exit(1) })
  .finally(() => disconnect())
