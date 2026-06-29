/**
 * run-all.ts — VPS-005
 *
 * Executa todos os testes de concorrência em sequência.
 * Uso: npm run test:concurrency
 */

import { disconnect } from './_prisma'
import { testEmprestimo } from './test-emprestimo'
import { testDevolucao }  from './test-devolucao'
import { testLeitor }     from './test-leitor'

async function main() {
  console.log('╔═══════════════════════════════════════════╗')
  console.log('║  VPS-005 — Testes de Concorrência         ║')
  console.log('╚═══════════════════════════════════════════╝')

  const results: { nome: string; ok: boolean | undefined }[] = []

  try {
    const ok1 = await testEmprestimo()
    results.push({ nome: 'Empréstimo simultâneo', ok: ok1 })
  } catch (e) {
    console.error('Erro no teste de empréstimo:', (e as Error).message)
    results.push({ nome: 'Empréstimo simultâneo', ok: false })
  }

  try {
    const ok2 = await testDevolucao()
    results.push({ nome: 'Devolução simultânea', ok: ok2 })
  } catch (e) {
    console.error('Erro no teste de devolução:', (e as Error).message)
    results.push({ nome: 'Devolução simultânea', ok: false })
  }

  try {
    const ok3 = await testLeitor()
    results.push({ nome: 'Criação de leitores', ok: ok3 })
  } catch (e) {
    console.error('Erro no teste de leitores:', (e as Error).message)
    results.push({ nome: 'Criação de leitores', ok: false })
  }

  console.log('\n╔═══════════════════════════════════════════╗')
  console.log('║  Resultado Final                          ║')
  console.log('╠═══════════════════════════════════════════╣')
  for (const r of results) {
    const icon = r.ok === undefined ? '⚠️ ' : r.ok ? '✅' : '❌'
    console.log(`║  ${icon}  ${r.nome.padEnd(35)}║`)
  }
  console.log('╚═══════════════════════════════════════════╝')

  const passed  = results.filter((r) => r.ok === true).length
  const skipped = results.filter((r) => r.ok === undefined).length
  const failed  = results.filter((r) => r.ok === false).length

  console.log(`\nTotal: ${passed} passou | ${skipped} pulado | ${failed} falhou`)

  if (failed > 0) process.exit(1)
}

main()
  .catch((e) => { console.error('Erro fatal:', e); process.exit(1) })
  .finally(disconnect)
